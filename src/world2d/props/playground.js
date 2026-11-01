// Playground: swings, slide, monkey bars, tetherball, sandbox, four square, fountain.
import { BOX, CYL, RBOX } from '../build.js';

export function swingSet(b, x, z) {
  for (const sx of [-1.8, 1.8]) {
    b.add(CYL, '#e63946', [x + sx, 1.3, z - 0.65], [0.38, 0, 0], [0.07, 2.8, 0.07], null, 'metal');
    b.add(CYL, '#e63946', [x + sx, 1.3, z + 0.65], [-0.38, 0, 0], [0.07, 2.8, 0.07], null, 'metal');
  }
  b.add(CYL, '#e63946', [x, 2.6, z], [0, 0, Math.PI / 2], [0.07, 3.8, 0.07], null, 'metal');
  for (const sx of [-0.9, 0.9]) {
    for (const d of [-0.22, 0.22])
      b.cyl(0.012, 0.012, 1.95, '#9aa0a6', x + sx + d, 0.65, z, { mat: 'metal' });
    b.rbox(0.55, 0.05, 0.24, '#222', x + sx, 0.62, z, { mat: 'rubber' });
  }
  b.colliders.push({ minX: x - 2, maxX: x + 2, minZ: z - 0.3, maxZ: z + 0.3 });
}
export function slide(b, x, z) {
  b.rbox(1.4, 0.12, 1.4, '#ffbe0b', x, 1.8, z, { mat: 'plastic' });
  for (const [dx, dz] of [
    [-0.6, -0.6],
    [0.6, -0.6],
    [-0.6, 0.6],
    [0.6, 0.6],
  ])
    b.cyl(0.06, 0.06, 2.6, '#3a86ff', x + dx, 0, z + dz, { collide: false, mat: 'metal' });
  b.add(RBOX, '#4cc9f0', [x, 0.95, z + 2.15], [0.52, 0, 0], [1.0, 0.1, 3.4], null, 'plastic');
  for (const sd of [-0.5, 0.5])
    b.add(BOX, '#3a86ff', [x + sd, 1.08, z + 2.15], [0.52, 0, 0], [0.06, 0.2, 3.4], null, 'plastic');
  for (let i = 0; i < 6; i++)
    b.box(0.8, 0.05, 0.15, '#90be6d', x, 0.3 + i * 0.3, z - 0.75 - i * 0.04, { mat: 'plastic' });
  b.colliders.push({ minX: x - 0.7, maxX: x + 0.7, minZ: z - 0.7, maxZ: z + 0.7 });
}
export function monkeyBars(b, x, z) {
  for (const sx of [-2, 2])
    for (const sz of [-0.5, 0.5]) b.cyl(0.05, 0.05, 2.2, '#577590', x + sx, 0, z + sz, { mat: 'metal' });
  for (const sz of [-0.5, 0.5])
    b.add(CYL, '#577590', [x, 2.2, z + sz], [0, 0, Math.PI / 2], [0.05, 4.1, 0.05], null, 'metal');
  for (let i = 0; i < 9; i++)
    b.add(
      CYL,
      '#f94144',
      [x - 1.8 + i * 0.45, 2.22, z],
      [Math.PI / 2, 0, 0],
      [0.03, 1.0, 0.03],
      null,
      'metal',
    );
}
export function tetherball(b, x, z) {
  b.cyl(0.05, 0.07, 3.0, '#bbbbbb', x, 0, z, { collide: true, mat: 'metal' });
  b.cyl(0.4, 0.4, 0.1, '#888', x, 0, z, { mat: 'concrete' });
  b.add(CYL, '#eeeeee', [x + 0.4, 1.9, z], [0, 0, 0.42], [0.008, 1.2, 0.008], null, 'fabric');
  b.sphere(0.2, '#f8961e', x + 0.68, 1.3, z, [1, 1, 1], { mat: 'rubber' });
}
export function sandbox(b, x, z) {
  for (const [dx, dz, w, d] of [
    [0, -1.6, 3.4, 0.2],
    [0, 1.6, 3.4, 0.2],
    [-1.6, 0, 0.2, 3.4],
    [1.6, 0, 0.2, 3.4],
  ])
    b.box(w, 0.3, d, '#a0522d', x + dx, 0, z + dz, { mat: 'wood' });
  b.box(3.0, 0.22, 3.0, '#f2d49b', x, 0, z, { mat: 'dirt' });
  b.sphere(0.4, '#e9c46a', x + 0.5, 0.25, z - 0.3, [1, 0.45, 1], { mat: 'dirt' });
  b.cone(0.2, 0.3, '#e63946', x - 0.6, 0.22, z + 0.4, { mat: 'plastic' });
  b.cyl(0.12, 0.1, 0.18, '#3a86ff', x + 0.2, 0.22, z + 0.8, { mat: 'plastic' });
}
export function fourSquare(b, x, z) {
  const cols = ['#f94144', '#f9c74f', '#43aa8b', '#577590'];
  let i = 0;
  for (const dx of [-1, 1])
    for (const dz of [-1, 1]) b.box(1.9, 0.02, 1.9, cols[i++], x + dx, 0.03, z + dz, { mat: 'asphalt' });
}
export function fountain(b, x, z, r = 2.2) {
  b.cyl(r, r + 0.15, 0.6, '#d9d3c7', x, 0, z, { collide: true, mat: 'concrete' });
  b.cyl(r - 0.2, r - 0.2, 0.55, '#4aa3df', x, 0.05, z, { mat: 'water' });
  b.cyl(0.25, 0.35, 1.5, '#d9d3c7', x, 0.5, z, { mat: 'concrete' });
  b.cyl(0.85, 0.6, 0.22, '#d9d3c7', x, 1.9, z, { mat: 'concrete' });
  b.sphere(0.32, '#a9d6f5', x, 2.35, z, [1, 1.5, 1], { mat: 'water' });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.sphere(0.04, '#d4af37', x + Math.cos(a) * r * 0.6, 0.62, z + Math.sin(a) * r * 0.6, [1, 0.3, 1], {
      mat: 'metal',
    });
  }
}
