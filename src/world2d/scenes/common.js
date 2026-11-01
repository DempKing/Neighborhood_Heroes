// Shared helpers for the location builders: the base scene, ground, zones, roads and doorways.
import { Builder, PRISM } from '../build.js';
import { finishArea } from '../buildings.js';
import * as P from '../props.js';
import * as THREE from '../three2d.js';

export function base(bounds) {
  return {
    group: new THREE.Group(),
    b: new Builder('plain'),
    colliders: [],
    zones: {},
    interact: [],
    spawn: { x: 0, z: 0, rot: 0 },
    bounds,
    indoor: false,
    extra: {},
    areas: [],
    grass: [],
  };
}
export function finish(sc, avoidExtra = []) {
  sc.group.add(sc.b.mesh());
  sc.colliders.push(...sc.b.colliders);
  delete sc.b;
  if (sc.grass.length) {
    const avoid = [...sc.colliders, ...avoidExtra, ...sc.areas.map((a) => a.rect)];
    sc.group.add(P.grassTufts(sc.grass, sc.grassCount || 5000, avoid, sc.grassSeed || 7));
  }
  for (const a of sc.areas) if (a.b) finishArea(a);
  return sc;
}
export function ground(sc, x, z, w, d, mat = 'grass', color = '#6fa04a') {
  const g = new Builder();
  g.box(w, 0.2, d, color, x, -0.2, z, { mat });
  const m = g.mesh({ castShadow: false });
  sc.group.add(m);
}
export function zone(sc, name, x, z, w, d, extra = {}) {
  sc.zones[name] = { x, z, w, d, ...extra };
}
export function act(sc, kind, x, z, label, data = {}, r = 1.6) {
  sc.interact.push({ kind, x, z, label, data, r });
}
/** Asphalt road along x (horiz) or z with curbs and dashed center line. */
export function road(b, x, z, len, width = 7, horiz = true) {
  const W = horiz ? len : width;
  const D = horiz ? width : len;
  b.box(W, 0.05, D, '#55585e', x, 0, z, { mat: 'asphalt' });
  for (const sd of [-1, 1]) {
    if (horiz) b.box(len, 0.16, 0.25, '#bdbab2', x, 0, z + sd * (width / 2 + 0.12), { mat: 'concrete' });
    else b.box(0.25, 0.16, len, '#bdbab2', x + sd * (width / 2 + 0.12), 0, z, { mat: 'concrete' });
  }
  const n = Math.floor(len / 3.2);
  for (let i = 0; i < n; i++) {
    if (horiz) b.box(1.5, 0.055, 0.14, '#f4d35e', x - len / 2 + 1.6 + i * 3.2, 0.005, z, { mat: 'plain' });
    else b.box(0.14, 0.055, 1.5, '#f4d35e', x, 0.005, z - len / 2 + 1.6 + i * 3.2, { mat: 'plain' });
  }
}
export function sidewalk(b, x, z, w, d) {
  b.box(w, 0.14, d, '#d6d2ca', x, 0, z, { mat: 'concrete' });
}
export function portico(b, x, z, w, n, h, color = '#f4f1ea', face = 1) {
  const prev = b.grp;
  b.grp = `portico:${x}:${z}`; // fades as one piece when it hides you
  try {
    porticoShape(b, x, z, w, n, h, color, face);
  } finally {
    b.grp = prev;
  }
}
function porticoShape(b, x, z, w, n, h, color, face) {
  for (let i = 0; i < n; i++) {
    const cx = x - w / 2 + (i + 0.5) * (w / n);
    b.cyl(0.32, 0.36, h, color, cx, 0.6, z, { mat: 'stucco', collide: true });
    b.box(0.85, 0.25, 0.85, color, cx, 0.4, z, { mat: 'stucco' });
    b.box(0.85, 0.25, 0.85, color, cx, h + 0.55, z, { mat: 'stucco' });
  }
  b.box(w + 1, 0.6, 2.4, color, x, h + 0.8, z - face * 0.8, { mat: 'stucco' });
  b.add(PRISM, color, [x, h + 1.4, z - face * 0.8], [0, 0, 0], [w + 1, 1.8, 2.4], null, 'stucco');
  for (let i = 0; i < 4; i++)
    b.box(w + 2 - i * 0.6, 0.2, 1.2 + i * 0.5, '#d6d2ca', x, i * 0.2, z + face * (1.2 - i * 0.3), {
      mat: 'concrete',
    });
}
