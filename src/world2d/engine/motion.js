// Engine motion: moving the player and NPCs, and collisions.
import { autoWalkStep } from './input.js';

// Physics
export function collide(engine, x, z, r = 0.32) {
  const w = engine.world;
  if (!w) return [x, z];
  for (const c of w.colliders) {
    if (x + r <= c.minX || x - r >= c.maxX || z + r <= c.minZ || z - r >= c.maxZ) continue;
    const pushL = x + r - c.minX;
    const pushR = c.maxX - (x - r);
    const pushU = z + r - c.minZ;
    const pushD = c.maxZ - (z - r);
    const m = Math.min(pushL, pushR, pushU, pushD);
    if (m === pushL) x -= pushL;
    else if (m === pushR) x += pushR;
    else if (m === pushU) z -= pushU;
    else z += pushD;
  }
  const bd = w.bounds;
  if (bd) {
    x = Math.max(bd.minX, Math.min(bd.maxX, x));
    z = Math.max(bd.minZ, Math.min(bd.maxZ, z));
  }
  return [x, z];
}
/** Moves the player from input, with collisions. */
export function updatePlayer(engine, dt) {
  const p = engine.playerState;
  if (!engine.player) return;
  let mx = 0;
  let mz = 0;
  let push = 1;
  const a = engine.analog;
  if (!engine.paused && engine.camMode === 'follow' && !p.sitting) {
    if (engine.keys.has('KeyW') || engine.keys.has('ArrowUp')) mz -= 1;
    if (engine.keys.has('KeyS') || engine.keys.has('ArrowDown')) mz += 1;
    if (engine.keys.has('KeyA') || engine.keys.has('ArrowLeft')) mx -= 1;
    if (engine.keys.has('KeyD') || engine.keys.has('ArrowRight')) mx += 1;
    if (!mx && !mz && a && Math.hypot(a.x, a.y) > 0.18) {
      mx = a.x;
      mz = a.y;
      push = Math.min(1, Math.hypot(a.x, a.y));
    }
  }
  let auto = null;
  if (mx || mz) {
    engine.autoWalk = null;
    engine.moveMarker = null;
  } else auto = autoWalkStep(engine, dt);
  if (mx || mz || auto) {
    let dx;
    let dz;
    if (auto) [dx, dz] = auto;
    else {
      const len = Math.hypot(mx, mz);
      dx = mx / len;
      dz = mz / len;
    }
    const run =
      engine.keys.has('ShiftLeft') ||
      engine.keys.has('ShiftRight') ||
      (a && a.run) ||
      (push > 0.92 && a && a.autoRun) ||
      !!(auto && engine.autoWalk && engine.autoWalk.run);
    const sp = (run ? 5.6 : 3.3 * Math.max(0.45, push)) * engine.speedMult;
    const [nx, nz] = collide(engine, p.x + dx * sp * dt, p.z + dz * sp * dt);
    p.x = nx;
    p.z = nz;
    p.rot = Math.atan2(dx, dz);
    p.mode = run ? 'run' : 'walk';
    engine.onMove && engine.onMove(dt * sp);
  } else if (!p.override) p.mode = p.sitting ? 'sit' : 'idle';
  if (!(engine.cine && engine.cine.turnPlayer)) engine._placePlayer();
  engine.player.update(dt, p.override || p.mode, 1);
}
/** Moves NPCs along their paths. */
export function updateNPCs(engine, dt) {
  const px = engine.playerState.x;
  const pz = engine.playerState.z;
  engine.visT -= dt;
  const checkVis = engine.visT <= 0;
  if (checkVis) engine.visT = 0.2;
  for (const n of engine.npcs.values()) {
    const root = n.char.root;
    if (checkVis) root.visible = n.alwaysVisible || engine._npcVisible(root.position.x, root.position.z);
    let anim = n.mode === 'sit' ? 'sit' : 'idle';
    if (n.mode === 'wander' && n.area) {
      n.wait -= dt;
      const dx = n.tx - root.position.x;
      const dz = n.tz - root.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.2 && n.wait <= 0) {
        const sp = 1.4;
        const nx = root.position.x + (dx / dist) * sp * dt;
        const nz = root.position.z + (dz / dist) * sp * dt;
        if (engine._blocked(nx, nz)) {
          n.tx = root.position.x;
          n.tz = root.position.z;
        } else {
          root.position.x = nx;
          root.position.z = nz;
          root.rotation.y = Math.atan2(dx, dz);
          anim = 'walk';
        }
      } else if (n.wait <= 0) {
        n.wait = 2 + n.rng() * 5;
        n.tx = n.area.x + (n.rng() - 0.5) * n.area.w;
        n.tz = n.area.z + (n.rng() - 0.5) * n.area.d;
      }
    } else if (n.mode === 'goto') {
      const dx = n.tx - root.position.x;
      const dz = n.tz - root.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.12) {
        const sp = Math.min(dist / Math.max(dt, 1e-3), n.gotoSpeed || 2.2);
        root.position.x += (dx / dist) * sp * dt;
        root.position.z += (dz / dist) * sp * dt;
        root.rotation.y = Math.atan2(dx, dz);
        anim = (n.gotoSpeed || 2.2) > 4 ? 'run' : 'walk';
      } else {
        n.mode = n.afterGoto || 'stand';
        if (n.onArrive) {
          const f = n.onArrive;
          n.onArrive = null;
          f();
        }
      }
    }
    if (n.animOverride) anim = n.animOverride;
    const pd = Math.hypot(root.position.x - px, root.position.z - pz);
    if (n.talking) {
      anim = 'talk';
      root.rotation.y = Math.atan2(px - root.position.x, pz - root.position.z);
    } else if (pd < 2.6 && n.mode !== 'sit' && n.mode !== 'goto' && anim === 'idle')
      root.rotation.y = Math.atan2(px - root.position.x, pz - root.position.z);
    n.showTag = !!n.tag && pd < 7 && engine.camMode === 'follow' && root.visible;
    if (root.visible) n.char.update(dt, anim, n.animSpeed || 1);
  }
}
