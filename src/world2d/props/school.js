// School things: bleachers, desks, lockers and bookshelves.
import { BOX, shade } from '../build.js';

export function bleachers(b, x, z, w, rows, rot = 0, color = '#b0b7c0') {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let r = 0; r < rows; r++) {
    const dz = -r * 0.7;
    const h = 0.45 * (r + 1);
    for (const sd of [-w / 2, 0, w / 2])
      b.add(
        BOX,
        '#6c757d',
        [x + sd * c + dz * s, h / 2, z + dz * c - sd * s],
        [0, rot, 0],
        [0.08, h, 0.08],
        null,
        'metal',
      );
    b.add(
      BOX,
      r % 2 ? '#d7dde4' : color,
      [x + dz * s, h + 0.04, z + dz * c],
      [0, rot, 0],
      [w, 0.07, 0.42],
      null,
      'metal',
    );
    b.add(
      BOX,
      '#8f969e',
      [x + (dz + 0.25) * s, h - 0.18, z + (dz + 0.25) * c],
      [0, rot, 0],
      [w, 0.3, 0.04],
      null,
      'metal',
    );
  }
  b.colliders.push({
    minX: x - w / 2 - 0.2,
    maxX: x + w / 2 + 0.2,
    minZ: z - rows * 0.7 - 0.2,
    maxZ: z + 0.35,
  });
}
export function desk(b, x, z, color = '#d9a066') {
  b.rbox(0.92, 0.05, 0.62, color, x, 0.72, z, { mat: 'wood' });
  b.box(0.86, 0.22, 0.04, '#7a7f88', x, 0.48, z - 0.27, { mat: 'metal' });
  for (const [dx, dz] of [
    [-0.4, -0.25],
    [0.4, -0.25],
    [-0.4, 0.25],
    [0.4, 0.25],
  ])
    b.cyl(0.02, 0.02, 0.72, '#7a7f88', x + dx, 0, z + dz, { mat: 'metal' });
  b.rbox(0.44, 0.05, 0.4, '#3a86ff', x, 0.42, z + 0.56, { mat: 'plastic' });
  b.rbox(0.44, 0.38, 0.05, '#3a86ff', x, 0.62, z + 0.78, { mat: 'plastic', rot: [-0.1, 0, 0] });
  for (const [dx, dz] of [
    [-0.2, 0.4],
    [0.2, 0.4],
    [-0.2, 0.72],
    [0.2, 0.72],
  ])
    b.cyl(0.015, 0.015, 0.42, '#7a7f88', x + dx, 0, z + dz, { mat: 'metal' });
}
/**
 * Student desk + chair, rotated by rotY. At rotY = 0 the chair is on the +z
 * side (student faces -z); rotY = PI/2 puts the chair to the east, facing west.
 */
export function studentDesk(b, x, z, rotY = 0, chair = '#2f6fb5') {
  const c = Math.cos(rotY);
  const sn = Math.sin(rotY);
  const P = (dx, dz) => [x + dx * c + dz * sn, z - dx * sn + dz * c];
  const at = (dx, dz) => P(dx, dz);
  const box = (w, h, d, col, dx, y, dz, mat, rx = 0) => {
    const [px, pz] = at(dx, dz);
    b.add(BOX, col, [px, y + h / 2, pz], [rx, rotY, 0], [w, h, d], null, mat);
  };
  box(0.82, 0.045, 0.58, '#d9b48a', 0, 0.71, -0.02, 'wood');
  box(0.86, 0.02, 0.62, '#8b939c', 0, 0.69, -0.02, 'metal');
  box(0.78, 0.16, 0.5, '#6f7882', 0, 0.53, -0.04, 'metal');
  for (const [dx, dz] of [
    [-0.38, -0.26],
    [0.38, -0.26],
    [-0.38, 0.22],
    [0.38, 0.22],
  ]) {
    const [px, pz] = at(dx, dz);
    b.cyl(0.018, 0.018, 0.7, '#8b939c', px, 0, pz, { mat: 'metal' });
  }
  // chair: molded seat, back, tubular legs
  box(0.42, 0.04, 0.4, chair, 0, 0.42, 0.58, 'plastic');
  box(0.42, 0.34, 0.04, chair, 0, 0.5, 0.8, 'plastic');
  for (const [dx, dz] of [
    [-0.18, 0.42],
    [0.18, 0.42],
    [-0.18, 0.76],
    [0.18, 0.76],
  ]) {
    const [px, pz] = at(dx, dz);
    b.cyl(0.014, 0.014, 0.42, '#8b939c', px, 0, pz, { mat: 'metal' });
  }
  // a few school supplies on top
  const [bx, bz] = at(-0.18, -0.06);
  b.box(
    0.24,
    0.025,
    0.3,
    ['#e63946', '#2a9d8f', '#f4a261', '#457b9d'][Math.abs(Math.round(x * 7 + z * 3)) % 4],
    bx,
    0.755,
    bz,
    { mat: 'plastic', rot: [0, rotY + 0.2, 0] },
  );
  const [px2, pz2] = at(0.2, 0.0);
  b.cyl(0.008, 0.008, 0.16, '#ffd23f', px2, 0.77, pz2, { mat: 'plastic', rot: [Math.PI / 2, rotY + 0.6, 0] });
}
/** Teacher's desk with an apple, books and a mug. Faces +x at rotY = PI/2 (toward the class). */
export function teacherDesk(b, x, z, rotY = 0) {
  const c = Math.cos(rotY);
  const sn = Math.sin(rotY);
  const at = (dx, dz) => [x + dx * c + dz * sn, z - dx * sn + dz * c];
  const box = (w, h, d, col, dx, y, dz, mat) => {
    const [px, pz] = at(dx, dz);
    b.add(BOX, col, [px, y + h / 2, pz], [0, rotY, 0], [w, h, d], null, mat);
  };
  box(1.8, 0.06, 0.85, '#8a5a3b', 0, 0.74, 0, 'wood');
  box(0.5, 0.74, 0.8, '#7a4f33', -0.62, 0, 0, 'wood');
  box(0.5, 0.74, 0.8, '#7a4f33', 0.62, 0, 0, 'wood');
  box(0.74, 0.5, 0.04, '#6d4630', 0, 0.24, 0.38, 'wood');
  for (const dy of [0.2, 0.46]) box(0.42, 0.18, 0.02, '#8a5a3b', -0.62, dy, 0.41, 'wood');
  const [ax, az] = at(0.55, 0.1);
  b.sphere(0.07, '#d62828', ax, 0.86, az, [1, 0.95, 1], { mat: 'plastic' });
  const [sx, sz] = at(0.55, 0.1);
  b.cyl(0.008, 0.008, 0.05, '#5b3a1e', sx, 0.92, sz, { mat: 'wood' });
  for (let i = 0; i < 3; i++)
    box(0.3, 0.06, 0.22, ['#1d3557', '#e9c46a', '#2a9d8f'][i], -0.5, 0.8 + i * 0.06, -0.05, 'plastic');
  const [mx, mz] = at(0.1, -0.2);
  b.cyl(0.045, 0.045, 0.1, '#ffffff', mx, 0.8, mz, { mat: 'plastic' });
  // rolling chair behind
  const [cx, cz] = at(0, -0.75);
  b.cyl(0.25, 0.25, 0.08, '#2b2d42', cx, 0.45, cz, { mat: 'fabric' });
  b.cyl(0.03, 0.03, 0.42, '#6c757d', cx, 0.03, cz, { mat: 'metal' });
  box(0.5, 0.5, 0.06, '#2b2d42', 0, 0.6, -1.0, 'fabric');
}
/**
 * A bank of school lockers along x from x0 to x1, backs against a wall at z.
 * face = +1 means the doors face +z.
 */
export function lockerBank(b, x0, x1, z, face, color = '#45698f') {
  const W = 0.38;
  const H = 1.86;
  const D = 0.42;
  const n = Math.floor((x1 - x0) / W);
  const start = x0 + (x1 - x0 - n * W) / 2;
  const cz = z + (face * D) / 2;
  const fz = z + face * (D + 0.006);
  b.box(n * W + 0.04, 0.12, D, '#3a3f45', start + (n * W) / 2, 0, cz, { mat: 'metal' });
  b.box(n * W + 0.06, 0.05, D + 0.04, shade(color, 0.8), start + (n * W) / 2, H + 0.12, cz, { mat: 'metal' });
  for (let i = 0; i < n; i++) {
    const lx = start + i * W + W / 2;
    b.box(W - 0.03, H, D - 0.02, color, lx, 0.12, cz, { mat: 'metal' });
    // vents, handle, number plate on the door face
    for (let k = 0; k < 4; k++)
      b.box(W * 0.5, 0.025, 0.012, shade(color, 0.55), lx, 0.12 + H - 0.22 - k * 0.06, fz, { mat: 'metal' });
    for (let k = 0; k < 3; k++)
      b.box(W * 0.5, 0.025, 0.012, shade(color, 0.55), lx, 0.3 + k * 0.06, fz, { mat: 'metal' });
    b.box(0.03, 0.16, 0.03, '#c9ced4', lx + W * 0.28, 0.12 + H * 0.5, fz, { mat: 'metal' });
    b.box(0.09, 0.05, 0.012, '#d9dde2', lx, 0.12 + H - 0.08, fz, { mat: 'metal' });
  }
  return {
    minX: start,
    maxX: start + n * W,
    minZ: Math.min(z, z + face * D),
    maxZ: Math.max(z, z + face * D),
  };
}
export function bookshelf(b, x, z, w = 3, rot = 0, rng = Math.random) {
  b.add(BOX, '#8d5a3b', [x, 1.0, z], [0, rot, 0], [w, 2.0, 0.5], null, 'wood');
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let shelf = 0; shelf < 4; shelf++) {
    let off = -w / 2 + 0.12;
    while (off < w / 2 - 0.2) {
      const bw = 0.07 + rng() * 0.09;
      const col = ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#e9c46a', '#8338ec', '#ff006e', '#264653'][
        Math.floor(rng() * 8)
      ];
      const lx = off + bw / 2;
      const bh = 0.3 + rng() * 0.1;
      b.add(
        BOX,
        col,
        [x + lx * c + 0.26 * s, 0.12 + shelf * 0.48 + bh / 2, z - lx * s + 0.26 * c],
        [0, rot + (rng() < 0.08 ? 0.2 : 0), 0],
        [bw, bh, 0.3],
        null,
        'fabric',
      );
      off += bw + 0.008;
    }
  }
  b.colliders.push(
    rot === 0 || Math.abs(rot - Math.PI) < 0.01
      ? { minX: x - w / 2, maxX: x + w / 2, minZ: z - 0.35, maxZ: z + 0.35 }
      : { minX: x - 0.35, maxX: x + 0.35, minZ: z - w / 2, maxZ: z + w / 2 },
  );
}
