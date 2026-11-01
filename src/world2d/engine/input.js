// Engine input: mouse/touch/keyboard binding, click-to-walk and what the player is facing.
export function bindInput(engine) {
  window.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    engine.keys.add(e.code);
    if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !engine.paused && engine.focus) {
      e.preventDefault();
      engine.onInteract(engine.focus);
    }
  });
  window.addEventListener('keyup', (e) => engine.keys.delete(e.code));
  window.addEventListener('blur', () => engine.keys.clear());
  const el = engine.canvas;
  const pts = new Map();
  let pinch = null;
  let tap = null;
  el.addEventListener('pointerdown', (e) => {
    tap = pts.size === 0 ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() } : null;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: engine.cam.dist };
    }
  });
  const up = (e) => {
    if (
      tap &&
      tap.id === e.pointerId &&
      e.type === 'pointerup' &&
      Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 10 &&
      performance.now() - tap.t < 500
    ) {
      const hit = engine.pickNPC(e.clientX, e.clientY);
      if (hit) engine.clickNPC(hit);
      else engine.clickToMove(e.clientX, e.clientY);
    }
    tap = null;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
  };
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  let hoverT = 0;
  window.addEventListener('pointermove', (e) => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!pts.size && e.pointerType === 'mouse' && e.target === el && performance.now() - hoverT > 90) {
      hoverT = performance.now();
      el.style.cursor = engine.pickNPC(e.clientX, e.clientY) ? 'pointer' : '';
    }
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()];
      engine.cam.dist = Math.max(
        5,
        Math.min(24, pinch.dist * (pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)))),
      );
    }
  });
  el.addEventListener(
    'wheel',
    (e) => {
      engine.cam.dist = Math.max(5, Math.min(24, engine.cam.dist + Math.sign(e.deltaY) * 1.1));
    },
    { passive: true },
  );
}
/** Turns to face an NPC and talks. */
export function faceAndTalk(engine, n) {
  const p = engine.playerState;
  const pos = n.char.root.position;
  p.rot = Math.atan2(pos.x - p.x, pos.z - p.z);
  engine.onInteract({ type: 'npc', id: n.id, label: n.interact, npc: n });
}
/** One step of click-to-walk. */
export function autoWalkStep(engine, dt) {
  const w = engine.autoWalk;
  if (!w) {
    engine.moveMarker = null;
    return null;
  }
  const p = engine.playerState;
  if (w.point) {
    if (engine.paused || engine.camMode !== 'follow' || p.sitting) {
      engine.autoWalk = null;
      engine.moveMarker = null;
      return null;
    }
    if (engine.moveMarker) engine.moveMarker.t += dt;
    const dx = w.point.x - p.x;
    const dz = w.point.z - p.z;
    const d = Math.hypot(dx, dz);
    const reach = w.spot ? Math.min(1.2, (w.spot.r || 1.6) * 0.6) : 0.25;
    if (d <= reach) {
      engine.autoWalk = null;
      engine.moveMarker = null;
      if (w.spot)
        engine.onInteract({
          type: 'spot',
          kind: w.spot.kind,
          label: w.spot.label,
          data: w.spot.data,
          spot: w.spot,
        });
      return null;
    }
    w.t += dt;
    if (w.last - d < 0.02 * 60 * dt) w.stuck += dt;
    else w.stuck = 0;
    w.last = d;
    if (w.t > 20 || w.stuck > 0.9) {
      engine.autoWalk = null;
      engine.moveMarker = null;
      return null;
    }
    return [dx / d, dz / d];
  }
  const n = engine.npcs.get(w.id);
  if (!n || engine.paused || engine.camMode !== 'follow' || p.sitting) {
    engine.autoWalk = null;
    return null;
  }
  const pos = n.char.root.position;
  const dx = pos.x - p.x;
  const dz = pos.z - p.z;
  const d = Math.hypot(dx, dz);
  if (d <= 1.7) {
    engine.autoWalk = null;
    faceAndTalk(engine, n);
    return null;
  }
  w.t += dt;
  if (w.last - d < 0.02 * 60 * dt) w.stuck += dt;
  else w.stuck = 0;
  w.last = d;
  if (w.t > 12 || w.stuck > 1.2) {
    engine.autoWalk = null;
    return null;
  }
  return [dx / d, dz / d];
}
/** Works out what the player is facing (NPC, door or spot). */
export function updateFocus(engine) {
  if (engine.paused || engine.camMode !== 'follow') {
    setFocus(engine, null);
    return;
  }
  const p = engine.playerState;
  let best = null;
  let bestD = Infinity;
  const fx = Math.sin(p.rot);
  const fz = Math.cos(p.rot);
  for (const n of engine.npcs.values()) {
    if (!n.interact || !n.char.root.visible) continue;
    const dx = n.char.root.position.x - p.x;
    const dz = n.char.root.position.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d > 2.1) continue;
    const score = d - ((dx * fx + dz * fz) / (d || 1)) * 0.8;
    if (score < bestD) {
      bestD = score;
      best = { type: 'npc', id: n.id, label: n.interact, npc: n };
    }
  }
  for (const it of engine.world.interact || []) {
    if (it.hidden) continue;
    const d = Math.hypot(it.x - p.x, it.z - p.z);
    if (d > (it.r || 1.6)) continue;
    if (d + 0.3 < bestD) {
      bestD = d + 0.3;
      best = { type: 'spot', kind: it.kind, label: it.label, data: it.data, spot: it };
    }
  }
  setFocus(engine, best);
}
/** Changes what the player is facing. */
export function setFocus(engine, f) {
  const key = f ? `${f.type}:${f.id || f.kind}:${f.label}` : null;
  if (key === engine._focusKey) return;
  engine._focusKey = key;
  engine.focus = f;
  engine.onFocus(f);
}
