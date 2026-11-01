// Engine rendering: cached map tiles, sorted items, fading walls in front of the player, markers and name tags.
import { compileNode, facePath, forCells, GRID, INK, nameplateCanvas, TILE_PX, unionBox } from '../engine.js';
import { grassDecor } from '../paint.js';
import { drawItem, IDENT, nodeMatrix, order, overlaps, PY, PZ } from '../project.js';

// Render
/** A cached tile at a resolution level (pixels per meter). */
export function drawTile(engine, tx, ty, tppm) {
  const key = `${tppm}:${tx},${ty}`;
  let t = engine.tiles.get(key);
  if (t) {
    engine.tiles.delete(key);
    engine.tiles.set(key, t);
    return t;
  } // LRU touch
  const TILE = TILE_PX / tppm;
  const cv = document.createElement('canvas');
  cv.width = cv.height = TILE_PX;
  const c = cv.getContext('2d');
  c.setTransform(tppm, 0, 0, tppm, -tx * TILE * tppm, -ty * TILE * tppm);
  const rect = { x0: tx * TILE, x1: (tx + 1) * TILE, y0: ty * TILE, y1: (ty + 1) * TILE };
  const px = 1 / tppm;
  for (const it of itemsIn(engine, rect)) {
    const d = engine._live(it);
    if (!d) continue;
    drawItem(c, d, px, it.grp && engine.faded.has(it.grp) ? 0.32 : 1);
    if (it.flat && it.mat === 'grass' && !engine.areaState.focus && tppm >= 24)
      drawGrass(engine, c, it, rect, px);
  }
  t = cv;
  engine.tiles.set(key, t);
  while (engine.tiles.size > 120) engine.tiles.delete(engine.tiles.keys().next().value);
  return t;
}
/** Items overlapping a screen-meter rect, in draw order. */
export function itemsIn(engine, rect) {
  const set = new Set();
  forCells(rect, GRID, (k) => {
    const l = engine.tileGrid.get(k);
    if (l) for (const it of l) set.add(it);
  });
  const out = [];
  for (const it of set) {
    let sb = it.cut && !it.cut.skip ? unionBox(it.sb, it.cut.sb) : it.sb;
    if (it.low && !it.low.skip) sb = unionBox(sb, it.low.sb);
    if (overlaps(sb, rect)) out.push(it);
  }
  out.sort((a, b) => a.ord - b.ord);
  return out;
}
/** Painted grass texture over one lawn item, clipped to it. */
export function drawGrass(engine, c, g, rect, px) {
  c.save();
  const clip = new Path2D();
  for (const f of g.faces) {
    clip.moveTo(f.pts[0][0], f.pts[0][1]);
    for (const q of f.pts.slice(1)) clip.lineTo(q[0], q[1]);
    clip.closePath();
  }
  c.clip(clip);
  grassDecor(c, rect, px);
  c.restore();
}
/** Draws one frame. */
export function render(engine) {
  const ctx = engine.ctx;
  const v = engine.view;
  const dpr = engine.dpr;
  const focus = engine.areaState.focus;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = focus ? '#141821' : '#6aa555';
  ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);
  const ox = engine.viewCenterX != null ? engine.viewCenterX : engine.w / 2;
  const toPx = (X, Y) => [(ox + (X - v.x) * v.ppm) * dpr, (engine.h / 2 + (Y - v.y) * v.ppm) * dpr];
  // visible screen-meter rect
  const X0 = v.x - ox / v.ppm;
  const X1 = v.x + (engine.w - ox) / v.ppm;
  const Y0 = v.y - engine.h / 2 / v.ppm;
  const Y1 = v.y + engine.h / 2 / v.ppm;
  ctx.imageSmoothingEnabled = true;
  // tile resolution follows the zoom (power of two, 8..128 px/m)
  const tppm = Math.max(8, Math.min(128, 2 ** Math.ceil(Math.log2(Math.max(1, v.ppm * dpr * 0.9)))));
  const TILE = TILE_PX / tppm;
  for (let ty = Math.floor(Y0 / TILE); ty <= Math.floor(Y1 / TILE); ty++) {
    for (let tx = Math.floor(X0 / TILE); tx <= Math.floor(X1 / TILE); tx++) {
      const img = drawTile(engine, tx, ty, tppm);
      const [px0, py0] = toPx(tx * TILE, ty * TILE);
      const sz = TILE * v.ppm * dpr;
      ctx.drawImage(img, px0, py0, sz + 0.6, sz + 0.6);
    }
  }
  // world-space drawing transform (screen meters -> device pixels)
  const S = v.ppm * dpr;
  const setWorld = () =>
    ctx.setTransform(S, 0, 0, S, (ox - v.x * v.ppm) * dpr, (engine.h / 2 - v.y * v.ppm) * dpr);
  setWorld();
  const px = 1 / v.ppm;
  // markers on the ground
  if (engine.moveMarker) {
    const m = engine.moveMarker;
    const k = 1 + 0.15 * Math.sin(m.t * 8);
    ctx.lineWidth = 0.09;
    ctx.strokeStyle = '#ffd23f';
    ctx.beginPath();
    ctx.ellipse(m.x, m.z * PZ, 0.38 * k, 0.38 * PZ * k, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // sprites: characters, dynamic objects, markers
  const sprites = [];
  const addChar = (char, isPlayer, n) => {
    const r = char.root;
    if (!r.visible) return;
    const x = r.position.x;
    const z = r.position.z;
    sprites.push({
      z,
      isPlayer,
      bb: { minX: x - 0.25, maxX: x + 0.25, minY: 0, maxY: char.height, minZ: z - 0.18, maxZ: z + 0.18 },
      draw: (alpha) => {
        char.draw(ctx, px, x, z * PZ, alpha);
        drawAttached(engine, ctx, r, px);
      },
      sb: char.box(x, z * PZ),
      npc: n,
    });
  };
  if (engine.player && engine.player.root.visible && engine.camMode !== 'hide') addChar(engine.player, true);
  for (const n of engine.npcs.values()) addChar(n.char, false, n);
  for (const it of dynamicItems(engine)) {
    if (it.flat)
      drawItem(ctx, it, px); // ground-level additions go under everyone
    else
      sprites.push({
        z: it.bb.maxZ,
        bb: it.bb,
        sb: it.sb,
        draw: (a) => drawItem(ctx, it, px, a),
        item: it,
      });
  }
  for (const m of engine.markers) {
    if (focus && !engine._areaContains(focus, m.x, m.z, 0.5)) continue;
    sprites.push({
      z: m.z,
      bb: { minX: m.x - 0.7, maxX: m.x + 0.7, minY: 0, maxY: 2.6, minZ: m.z - 0.1, maxZ: m.z + 0.1 },
      sb: { x0: m.x - 0.8, x1: m.x + 0.8, y0: m.z * PZ - 3, y1: m.z * PZ + 0.5 },
      draw: () => drawMarker(engine, ctx, m, px),
    });
  }
  sprites.sort((a, b) => a.z - b.z);
  for (const s of sprites) {
    s.draw(1);
    // redraw whatever stands in front of engine sprite
    const occ = occluders(engine, s);
    if (!occ.length) continue;
    const see = s.isPlayer;
    // which occluders really cover you (chest or head), not just touch your box?
    const covers = see ? new Set(occ.filter((it) => coversItem(engine, engine._live(it), s))) : null;
    if (see) fadeGroups(engine, covers);
    for (const it of occ) {
      const d = engine._live(it);
      if (!d) continue;
      const faded = it.grp && engine.faded.has(it.grp);
      drawItem(ctx, d, px, faded ? 0.32 : see && covers.has(it) ? 0.3 : 1);
    }
    if (see && covers.size) {
      // silhouette of you behind things
      ctx.save();
      ctx.globalAlpha = 0.35;
      s.draw(0.35);
      ctx.restore();
    }
  }
  // name tags and labels on top
  for (const n of engine.npcs.values()) if (n.showTag) drawTag(engine, ctx, n, px);
  // time of day tint (outdoors)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const tint = !focus && sceneTint(engine);
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);
  }
  // soft vignette (cached)
  ctx.drawImage(vignette(engine), 0, 0, engine.canvas.width, engine.canvas.height);
}
/** The dark edge around the screen. */
export function vignette(engine) {
  const W = 480;
  const H = Math.round((480 * engine.h) / engine.w) || 270;
  if (engine._vig && engine._vig.width === W && engine._vig.height === H) return engine._vig;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,20,10,0.22)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  engine._vig = cv;
  return cv;
}
/** Does a drawn item cover the sprite's chest or head? */
export function coversItem(engine, d, s) {
  if (!d || d.flat) return false;
  const cx = (s.sb.x0 + s.sb.x1) / 2;
  const h = s.sb.y1 - s.sb.y0;
  const pts = [
    [cx, s.sb.y1 - h * 0.45],
    [cx, s.sb.y1 - h * 0.8],
  ];
  if (d.type !== 'faces')
    return pts.some(([x, y]) => x > d.sb.x0 && x < d.sb.x1 && y > d.sb.y0 && y < d.sb.y1);
  const c = engine.ctx;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  let hit = false;
  for (const f of d.faces) {
    const p = f.path || (f.path = facePath(f.pts));
    if (pts.some(([x, y]) => c.isPointInPath(p, x, y))) {
      hit = true;
      break;
    }
  }
  c.restore();
  return hit;
}
/** Buildings (groups) standing in front of you fade out as a whole; their tiles are redrawn. */
export function fadeGroups(engine, occ) {
  const want = new Set();
  for (const it of occ) if (it.grp && !it.flat) want.add(it.grp);
  const changed = [...want]
    .filter((g) => !engine.faded.has(g))
    .concat([...engine.faded].filter((g) => !want.has(g)));
  if (!changed.length) return;
  engine.faded = want;
  for (const g of changed) {
    const b = engine.grpBox.get(g);
    if (!b) continue;
    for (const key of [...engine.tiles.keys()]) {
      const [lv, xy] = key.split(':');
      const [tx, ty] = xy.split(',').map(Number);
      const T = TILE_PX / +lv;
      if (overlaps(b, { x0: tx * T, x1: (tx + 1) * T, y0: ty * T, y1: (ty + 1) * T }))
        engine.tiles.delete(key);
    }
  }
}
/** The color tint for the time of day. */
export function sceneTint(engine) {
  const m = engine.minute;
  const evening = m > 17 * 60 ? Math.min(1, (m - 17 * 60) / 180) : 0;
  const night = m > 19.5 * 60 ? Math.min(1, (m - 19.5 * 60) / 90) : 0;
  const morning = m < 7.5 * 60 ? Math.min(1, (7.5 * 60 - m) / 90) : 0;
  if (night > 0) return `rgba(20,28,70,${0.18 + night * 0.32})`;
  if (evening > 0) return `rgba(255,130,60,${evening * 0.16})`;
  if (morning > 0) return `rgba(255,190,140,${morning * 0.12})`;
  return null;
}
/** Things in front of the player that should go see-through. */
export function occluders(engine, s) {
  const out = new Set();
  forCells(s.sb, 2, (k) => {
    const l = engine.occGrid.get(k);
    if (l) for (const it of l) out.add(it);
  });
  const res = [];
  for (const it of out) {
    const d = engine._live(it);
    if (!d || !overlaps(d.sb, s.sb)) continue;
    if (order(s, d) < 0) res.push(it);
  }
  res.sort((a, b) => a.ord - b.ord);
  return res;
}
/** Objects added to the world after loading (stands, balls, flags...), recompiled each frame. */
export function dynamicItems(engine) {
  const out = [];
  if (!engine.world) return out;
  for (const node of engine.world.group.children) {
    if (engine.staticRoots.has(node) || !node.visible) continue;
    compileNode(node, IDENT, out);
  }
  return out;
}
/** Draws things attached to a character. */
export function drawAttached(engine, ctx, root, px) {
  if (!root.children.length) return;
  const m = nodeMatrix(root);
  const items = [];
  for (const c of root.children) if (c.visible) compileNode(c, m, items);
  items.sort((a, b) => a.bb.maxZ - b.bb.maxZ);
  for (const it of items) drawItem(ctx, it, px);
}
/** A task marker. */
export function drawMarker(engine, ctx, m, px) {
  const X = m.x;
  const Y = m.z * PZ;
  const k = 1 + Math.sin(m.t * 3.3) * 0.06;
  ctx.lineWidth = 0.12;
  ctx.strokeStyle = m.color;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(X, Y, 0.78 * k, 0.78 * PZ * k, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = m.color;
  ctx.beginPath();
  ctx.moveTo(X - 0.6, Y);
  ctx.lineTo(X - 0.5, Y - 2.2);
  ctx.lineTo(X + 0.5, Y - 2.2);
  ctx.lineTo(X + 0.6, Y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  const sy2 = Y - 2.3 - Math.sin(m.t * 2.5) * 0.12;
  ctx.beginPath();
  ctx.moveTo(X, sy2 - 0.26);
  ctx.lineTo(X + 0.2, sy2);
  ctx.lineTo(X, sy2 + 0.26);
  ctx.lineTo(X - 0.2, sy2);
  ctx.closePath();
  ctx.fillStyle = m.color;
  ctx.fill();
  ctx.lineWidth = 1.5 * px;
  ctx.strokeStyle = INK;
  ctx.stroke();
  if (m.label) {
    const h = 0.32;
    const w = h * m.label.aspect;
    ctx.drawImage(m.label.tex.image, X - w / 2, sy2 - 0.75, w, h);
  }
}
/** A name tag over a character. */
export function drawTag(engine, ctx, n, px) {
  const key = `${n.tag}|${n.tagColor}`;
  let img = engine.tagCache.get(key);
  if (!img) {
    img = nameplateCanvas(n.tag, n.tagColor);
    engine.tagCache.set(key, img);
    if (engine.tagCache.size > 400) engine.tagCache.delete(engine.tagCache.keys().next().value);
  }
  const r = n.char.root;
  const X = r.position.x;
  const Y = r.position.z * PZ - (n.char.height + 0.28) * PY;
  const h = 22 * px;
  const w = h * (img.width / img.height);
  ctx.drawImage(img, X - w / 2, Y - h, w, h);
}
