// Engine world: compiling a scene description into drawable items, and which area the player is in.
import { forCells, GRID, push, unionBox } from '../engine.js';
import { IDENT, labelItem, mul, nodeMatrix, primItem, quadItem, sortItems } from '../project.js';

/** Static world -> sorted drawing items, tagged with the building parts they belong to. */
export function compileWorld(engine, desc) {
  const tags = new Map();
  for (const a of desc.areas) {
    for (const wl of a.walls || []) tags.set(wl.obj, { area: a, wall: wl.side });
    if (a.roof) tags.set(a.roof, { area: a, roof: true });
    if (a.lid) tags.set(a.lid, { area: a, lid: true });
    if (a.contents) tags.set(a.contents, { area: a, contents: true });
    if (a.focus)
      for (const o of a.objs || []) {
        const t = tags.get(o) || {};
        tags.set(o, { ...t, area: t.area || a, focusArea: a });
      }
  }
  const items = [];
  const walk = (node, m, chain, tag) => {
    if (node.userData.doorCtl) return; // doorways stay open in 2D
    const mm = mul(m, nodeMatrix(node));
    const t = tags.has(node) ? { ...tag, ...tags.get(node) } : tag;
    const ch = [...chain, node];
    const push = (it) => {
      if (!it) return;
      it.nodes = ch;
      it.tag = t;
      items.push(it);
    };
    const areaGrp = t.area && (t.wall || t.roof || t.lid) ? `A:${t.area.id}` : null;
    if (node.isShapeMesh) {
      for (const p of node.prims) {
        const it = primItem(p, mm);
        if (!it) continue;
        it.grp = areaGrp || p.grp || null;
        if (t.wall === 'S') it.cut = primItem(p, mm, 0.75) || { skip: true };
        // rooms in front of you (indoors) drop to knee height so they don't hide the hallway
        if (t.wall) it.low = primItem(p, mm, 0.75) || { skip: true };
        if (t.lid && t.area) {
          const H = t.area.wallH || 3;
          it.low = primItem(p, mul([1, 0, 0, 0, 0, 1, 0, -(H - 0.75), 0, 0, 1, 0], mm)) || { skip: true };
        }
        push(it);
      }
    } else if (
      node.isMesh &&
      node.geometry &&
      node.geometry.kind === 'plane' &&
      node.material &&
      node.material.map
    )
      push(quadItem(node, mm));
    else if (node.isMesh && node.geometry && node.material) {
      const g = node.geometry;
      if (g.kind && g.kind !== 'none')
        push(
          primItem(
            {
              g,
              color: node.material.color ? node.material.color.getStyle() : '#cccccc',
              pos: [0, 0, 0],
              rot: [0, 0, 0],
              scale: [1, 1, 1],
              mat: 'plain',
            },
            mm,
          ),
        );
    } else if (node.isSprite && node.material && node.material.map) push(labelItem(node, mm));
    for (const c of node.children) walk(c, mm, ch, t);
  };
  for (const c of desc.group.children) walk(c, IDENT, [], {});
  engine.items = sortItems(items);
  engine.staticRoots = new Set(desc.group.children);
  // grids: tiles (all items) and occluders (tall items)
  engine.tileGrid = new Map();
  engine.occGrid = new Map();
  for (const it of engine.items) {
    let sb = it.cut && !it.cut.skip ? unionBox(it.sb, it.cut.sb) : it.sb;
    if (it.low && !it.low.skip) sb = unionBox(sb, it.low.sb);
    forCells(sb, GRID, (k) => push(engine.tileGrid, k, it));
    if (!it.flat) forCells(sb, 2, (k) => push(engine.occGrid, k, it));
  }
  // group boxes (for fading whole buildings that hide you)
  engine.grpBox = new Map();
  for (const it of engine.items)
    if (it.grp) {
      const b = engine.grpBox.get(it.grp);
      engine.grpBox.set(it.grp, b ? unionBox(b, it.sb) : { ...it.sb });
    }
  engine.faded = new Set();
  engine.tiles.clear();
  engine.dyn = new Map();
}
/** Roofs come off and front walls drop low when you're inside; rooms seen from a hallway get a ceiling. */
export function updateAreas(engine, force = false) {
  const w = engine.world;
  if (!w) return;
  const p = engine.playerState;
  const inside = new Set();
  for (const a of w.areas) if (engine._areaContains(a, p.x, p.z)) inside.add(a.id);
  let focus = null;
  for (const a of w.areas) if (a.focus && inside.has(a.id)) focus = a;
  const covered = (a) => !!(a && a.lid && !inside.has(a.id));
  for (const a of w.areas) {
    const ins = inside.has(a.id);
    const parentIn = a.parent && inside.has(a.parent);
    if (a.roof) a.roof.visible = !ins;
    if (a.lid) a.lid.visible = !ins && !!parentIn;
    if (a.contents) a.contents.visible = !covered(a) || ins;
  }
  // Indoors, closed rooms in front of (south of) you are drawn low.
  const lowered = new Set();
  if (inside.size)
    for (const a of w.areas) if (a.lid && !inside.has(a.id) && a.rect.minZ >= p.z - 0.3) lowered.add(a.id);
  const sig = `${[...inside].sort().join(',')}|${focus ? focus.id : ''}|${[...lowered].sort().join(',')}`;
  if (sig !== engine._areaSig || force) {
    engine._areaSig = sig;
    engine.tiles.clear();
  }
  engine.areaState = { inside, focus, covered, lowered };
}
