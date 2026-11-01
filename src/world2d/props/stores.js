// Shops and exhibits: counters, shelves, lunch tables, the dinosaur, planets, the lemonade stand, trophies.
import { Builder, CYL, RBOX, shade, TORUS } from '../build.js';

export function counter(b, x, z, w, rot = 0, color = '#c8553d') {
  b.add(RBOX, color, [x, 0.5, z], [0, rot, 0], [w, 1.0, 0.8], null, 'wood');
  b.add(RBOX, '#f4f1de', [x, 1.03, z], [0, rot, 0], [w + 0.1, 0.07, 0.9], null, 'tile');
  const horiz = Math.abs(Math.sin(rot)) < 0.5;
  b.colliders.push(
    horiz
      ? { minX: x - w / 2, maxX: x + w / 2, minZ: z - 0.45, maxZ: z + 0.45 }
      : { minX: x - 0.45, maxX: x + 0.45, minZ: z - w / 2, maxZ: z + w / 2 },
  );
}
export function groceryShelf(b, x, z, len, rng, tint) {
  b.box(0.9, 0.1, len, '#d0d4d9', x, 0, z, { collide: true, mat: 'metal' });
  b.box(0.12, 1.9, len, '#e3e6ea', x, 0, z, { mat: 'metal' });
  for (let shelf = 0; shelf < 4; shelf++) {
    b.box(0.95, 0.04, len, '#c8ccd2', x, 0.12 + shelf * 0.5, z, { mat: 'metal' });
    for (let i = 0; i < len / 0.3; i++) {
      for (const side of [-1, 1]) {
        const col = tint
          ? tint(rng)
          : ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#8338ec', '#3a86ff', '#06d6a0'][
              Math.floor(rng() * 7)
            ];
        const h = 0.28 + rng() * 0.12;
        if (rng() < 0.5)
          b.rbox(0.2, h, 0.24, col, x + side * 0.3, 0.16 + shelf * 0.5, z - len / 2 + 0.18 + i * 0.3, {
            mat: 'plastic',
          });
        else
          b.cyl(0.08, 0.08, h * 0.8, col, x + side * 0.3, 0.16 + shelf * 0.5, z - len / 2 + 0.18 + i * 0.3, {
            mat: 'plastic',
          });
      }
    }
  }
}
export function lunchTable(b, x, z, color = '#8ecae6') {
  b.rbox(3, 0.07, 1.0, color, x, 0.74, z, { mat: 'plastic' });
  for (const sd of [-1.2, 1.2]) b.box(0.08, 0.74, 0.8, '#6c757d', x + sd, 0, z, { mat: 'metal' });
  for (const sz of [-0.85, 0.85])
    b.rbox(3, 0.06, 0.34, shade(color, 0.85), x, 0.44, z + sz, { mat: 'plastic' });
  b.colliders.push({ minX: x - 1.5, maxX: x + 1.5, minZ: z - 0.5, maxZ: z + 0.5 });
}
export function dinoSkeleton(b, x, z) {
  const bone = '#efe6cc';
  for (const sx of [-0.6, 0.6]) {
    b.add(CYL, bone, [x + 0.5, 1.15, z + sx], [0, 0, 0.3], [0.12, 2.0, 0.12], null, 'plastic');
    b.add(RBOX, bone, [x + 0.15, 0.35, z + sx], [0, 0, 0], [0.75, 0.15, 0.28], null, 'plastic');
  }
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const px = x - 3.8 + t * 7;
    const py = 2.5 + Math.sin(t * Math.PI) * 0.8 - (t < 0.3 ? (0.3 - t) * 2.2 : 0);
    b.sphere(0.22 - t * 0.06, bone, px, py, z, [1.2, 1, 1], { low: true, mat: 'plastic' });
    if (t > 0.3 && t < 0.78)
      b.add(TORUS, bone, [px, py - 0.55, z], [0, Math.PI / 2, 0], [0.55, 0.6, 0.15], null, 'plastic');
  }
  b.sphere(0.75, bone, x + 3.8, 3.6, z, [1.45, 0.8, 0.8], { low: true, mat: 'plastic' });
  b.box(0.9, 0.15, 0.5, bone, x + 4.2, 3.25, z, { mat: 'plastic' });
  b.sphere(0.12, '#2a1e1a', x + 4.0, 3.8, z + 0.42, [1, 1, 0.4], { mat: 'plastic' });
  b.box(9, 0.35, 3.2, '#5a6370', x, 0, z, { collide: true, mat: 'stucco' });
  b.box(9.3, 0.08, 3.5, '#d4af37', x, 0.35, z, { mat: 'metal' });
}
export function planet(b, x, y, z, r, color, ring = false) {
  b.sphere(r, color, x, y, z, [1, 1, 1], {
    shade: (px, py) => (Math.sin(py * 7) > 0.55 ? shade(color, 0.82) : null),
    mat: 'plastic',
  });
  if (ring) b.add(TORUS, '#e9d8a6', [x, y, z], [1.2, 0, 0.3], [r * 1.7, r * 1.7, 0.12], null, 'plastic');
}
export function lemonadeStand(b, x, z, rot = 0) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  b.add(
    RBOX,
    '#fff1a8',
    [x, 0.5, z],
    [0, rot, 0],
    [1.7, 1.0, 0.75],
    (px, py) => (Math.floor((px + 0.5) * 8) % 2 ? '#ffe066' : null),
    'wood',
  );
  b.add(RBOX, '#ffd23f', [x, 1.03, z], [0, rot, 0], [1.85, 0.07, 0.85], null, 'wood');
  for (const dx of [-0.82, 0.82])
    b.add(CYL, '#c9a227', [x + dx * c, 1.55, z - dx * s], [0, 0, 0], [0.04, 1.05, 0.04], null, 'wood');
  b.add(
    RBOX,
    '#ff6b6b',
    [x, 2.08, z],
    [0, rot, 0],
    [1.95, 0.1, 0.95],
    (px) => (Math.floor((px + 0.5) * 8) % 2 ? '#ffffff' : null),
    'fabric',
  );
  b.cyl(0.13, 0.11, 0.35, '#fff3a3', x - 0.45 * c, 1.07, z + 0.45 * s, { mat: 'glass' });
  b.cyl(0.11, 0.1, 0.3, '#ffe066', x - 0.45 * c, 1.07, z + 0.45 * s, { mat: 'plastic' });
  for (let i = 0; i < 4; i++)
    b.cyl(0.05, 0.04, 0.12, '#ffffff', x + (0.1 + i * 0.12) * c, 1.07, z - (0.1 + i * 0.12) * s, {
      mat: 'plastic',
    });
  b.colliders.push({ minX: x - 0.95, maxX: x + 0.95, minZ: z - 0.5, maxZ: z + 0.5 });
}
export function trophyModel(kind = 'gold') {
  const b = new Builder();
  const col = kind === 'silver' ? '#d0d7df' : kind === 'ball' ? '#e8742b' : '#f7c948';
  if (kind === 'ball') {
    b.rbox(0.3, 0.12, 0.3, '#5d4037', 0, 0, 0, { mat: 'wood' });
    b.sphere(0.15, col, 0, 0.27, 0, [1, 1, 1], { mat: 'rubber' });
  } else {
    b.rbox(0.32, 0.12, 0.32, '#3d2b1f', 0, 0, 0, { mat: 'wood' });
    b.cyl(0.05, 0.05, 0.2, col, 0, 0.12, 0, { mat: 'metal' });
    b.cyl(0.18, 0.08, 0.28, col, 0, 0.32, 0, { mat: 'metal' });
    for (const sx of [-1, 1])
      b.add(TORUS, col, [sx * 0.2, 0.48, 0], [0, 0, 0], [0.08, 0.08, 0.6], null, 'metal');
    b.sphere(0.06, col, 0, 0.66, 0, [1, 1, 1], { mat: 'metal' });
  }
  return b.mesh();
}
