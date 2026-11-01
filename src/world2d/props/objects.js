// Other objects: bikes, mowers, carts, fish tanks, vending machines, arcade games.
import { mulberry32 } from '../../game/rng.js';
import { BOX, Builder, CONE, CYL, matFor, PRISM, RBOX, shade, SPHERE_LO, TORUS } from '../build.js';
import * as THREE from '../three2d.js';
import { frame, ICO, PAL, yawTilt } from './furniture.js';

export function bike(b, x, z, rot = 0, color = '#e63946') {
  const f = frame(b, x, z, rot);
  const [wx1, wz1] = f.at(-0.5, 0);
  const [wx2, wz2] = f.at(0.5, 0);
  for (const [wx, wz] of [
    [wx1, wz1],
    [wx2, wz2],
  ]) {
    b.add(TORUS, '#1a1a1a', [wx, 0.33, wz], [0, rot, 0], [0.3, 0.3, 0.5], null, 'rubber');
    b.add(CYL, '#c0c7cf', [wx, 0.33, wz], yawTilt(rot, Math.PI / 2, 0), [0.04, 0.06, 0.04], null, 'metal');
  }
  f.box(0.8, 0.05, 0.05, color, 0, 0.62, 0, 'metal', { center: true, rz: -0.12 });
  f.box(0.05, 0.55, 0.05, color, -0.12, 0.5, 0, 'metal', { center: true, rz: 0.35 });
  f.box(0.05, 0.6, 0.05, color, 0.35, 0.55, 0, 'metal', { center: true, rz: -0.3 });
  f.box(0.6, 0.04, 0.04, color, -0.25, 0.36, 0, 'metal', { center: true });
  f.box(0.24, 0.05, 0.1, '#1a1a1a', -0.22, 0.82, 0, 'rubber', { center: true });
  f.box(0.04, 0.04, 0.5, '#1a1a1a', 0.45, 0.9, 0, 'rubber', { center: true });
  f.solid(1.4, 0.4);
}
export function lawnMower(b, x, z, rot = 0, color = '#2a9d8f') {
  const f = frame(b, x, z, rot);
  f.rbox(0.55, 0.22, 0.65, color, 0, 0.1, 0, 'plastic');
  f.cyl(0.14, 0.16, 0.2, '#2b2b2f', 0, 0.3, 0.05, 'metal');
  f.cyl(0.05, 0.05, 0.05, '#e63946', 0, 0.5, 0.05, 'plastic');
  for (const sx of [-0.27, 0.27])
    for (const sz of [-0.25, 0.25]) f.hcyl(0.1, 0.06, '#1a1a1a', sx, 0.1, sz, 'x', 'rubber');
  for (const sx of [-0.2, 0.2])
    f.box(0.03, 0.85, 0.03, '#6c757d', sx, 0.62, -0.55, 'metal', { center: true, rx: -0.6 });
  f.box(0.44, 0.04, 0.04, '#1a1a1a', 0, 0.97, -0.8, 'rubber', { center: true });
  f.box(0.42, 0.3, 0.3, '#3d3d42', 0, 0.12, -0.42, 'fabric');
  f.solid(0.6, 1.1, 0, -0.2);
}
export function shoppingCart(b, x, z, rot = 0, color = '#c0c7cf') {
  const f = frame(b, x, z, rot);
  const wire = (px, py) => (Math.abs(px) > 0.45 || Math.abs(py) > 0.45 ? shade(color, 0.8) : null);
  f.box(0.55, 0.4, 0.8, color, 0, 0.45, 0, 'metal', { shade: wire });
  f.box(0.5, 0.03, 0.7, shade(color, 0.85), 0, 0.2, 0, 'metal');
  f.box(0.55, 0.04, 0.04, '#e63946', 0, 0.95, -0.47, 'plastic');
  for (const sx of [-0.24, 0.24]) {
    f.box(0.03, 0.55, 0.03, color, sx, 0.62, -0.44, 'metal', { center: true, rx: 0.2 });
    for (const sz of [-0.33, 0.33]) {
      f.box(0.03, 0.42, 0.03, color, sx, 0.05, sz, 'metal');
      f.hcyl(0.05, 0.03, '#1a1a1a', sx, 0.05, sz, 'x', 'rubber');
    }
  }
}
export function plinth(b, x, z, w = 0.8, h = 1.0, color = '#f4f1ea', solid = true) {
  b.box(w, h, w, color, x, 0, z, { mat: 'stucco' });
  b.box(w + 0.1, 0.06, w + 0.1, shade(color, 0.9), x, h, z, { mat: 'stucco' });
  b.box(w + 0.1, 0.08, w + 0.1, shade(color, 0.85), x, 0, z, { mat: 'stucco' });
  if (solid) b.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - w / 2, maxZ: z + w / 2 });
}
/** Brass posts with a velvet rope along a path of [x, z] points (closed if loop). */
export function ropeLine(b, pts, loop = false, rope = '#9d0208') {
  const P2 = loop ? [...pts, pts[0]] : pts;
  for (const [px, pz] of pts) {
    b.cyl(0.035, 0.035, 0.85, '#d4af37', px, 0, pz, { mat: 'metal' });
    b.cyl(0.13, 0.15, 0.04, '#d4af37', px, 0, pz, { mat: 'metal' });
    b.add(ICO, '#d4af37', [px, 0.88, pz], [0, 0, 0], [0.055, 0.055, 0.055], null, 'metal');
  }
  for (let i = 0; i < P2.length - 1; i++) {
    const [x1, z1] = P2[i];
    const [x2, z2] = P2[i + 1];
    const len = Math.hypot(x2 - x1, z2 - z1);
    b.add(
      BOX,
      rope,
      [(x1 + x2) / 2, 0.72, (z1 + z2) / 2],
      [0, Math.atan2(-(z2 - z1), x2 - x1), 0],
      [len, 0.04, 0.04],
      null,
      'fabric',
    );
  }
}
/** Little angled info sign on a post, facing local +z. */
export function infoPlaque(b, x, z, rot = 0, color = '#1d3557') {
  const f = frame(b, x, z, rot);
  f.box(0.06, 0.8, 0.06, '#3a3a3f', 0, 0, 0, 'metal');
  f.box(0.6, 0.42, 0.04, color, 0, 0.92, 0, 'plastic', { center: true, rx: -0.6 });
  for (let i = 0; i < 4; i++)
    f.box(
      0.44 - (i % 2) * 0.12,
      0.03,
      0.01,
      '#f4f1ea',
      -(i % 2) * 0.06,
      1.0 - i * 0.065,
      0.03 + i * 0.04,
      'plain',
      { center: true, rx: -0.6 },
    );
}
export function musicStand(b, x, z, rot = 0) {
  const f = frame(b, x, z, rot);
  f.cyl(0.015, 0.015, 1.05, '#2b2b2f', 0, 0, 0, 'metal');
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    f.box(0.3, 0.02, 0.02, '#2b2b2f', Math.cos(a) * 0.12, 0.02, Math.sin(a) * 0.12, 'metal', { ry: -a });
  }
  f.box(0.5, 0.34, 0.02, '#2b2b2f', 0, 1.15, -0.05, 'metal', { center: true, rx: -0.35 });
  f.box(0.4, 0.26, 0.01, '#ffffff', 0, 1.16, -0.03, 'plain', { center: true, rx: -0.35 });
}
export function drumKit(b, x, z, rot = 0) {
  const f = frame(b, x, z, rot);
  f.hcyl(0.3, 0.32, '#c1121f', 0, 0.32, 0.1, 'z', 'plastic');
  f.hcyl(0.26, 0.34, '#f4f1ea', 0, 0.32, 0.1, 'z', 'fabric');
  f.cyl(0.18, 0.18, 0.14, '#c1121f', -0.42, 0.6, 0.15, 'plastic')
    .cyl(0.18, 0.18, 0.02, '#f4f1ea', -0.42, 0.74, 0.15, 'fabric')
    .cyl(0.02, 0.02, 0.6, '#9aa0a6', -0.42, 0, 0.15, 'metal');
  for (const sd of [-0.15, 0.15])
    f.cyl(0.13, 0.13, 0.12, '#c1121f', sd, 0.62, 0.05, 'plastic').cyl(
      0.13,
      0.13,
      0.02,
      '#f4f1ea',
      sd,
      0.74,
      0.05,
      'fabric',
    );
  f.cyl(0.2, 0.2, 0.25, '#c1121f', 0.45, 0.25, 0.2, 'plastic').cyl(
    0.2,
    0.2,
    0.02,
    '#f4f1ea',
    0.45,
    0.5,
    0.2,
    'fabric',
  );
  for (const [sx, h] of [
    [-0.62, 1.05],
    [0.6, 1.15],
  ]) {
    f.cyl(0.015, 0.015, h, '#9aa0a6', sx, 0, -0.05, 'metal');
    f.cyl(0.24, 0.24, 0.015, '#e0b84a', sx, h, -0.05, 'metal');
  }
  f.cyl(0.17, 0.17, 0.08, '#2b2b2f', 0, 0.45, -0.55, 'fabric').cyl(
    0.03,
    0.03,
    0.45,
    '#9aa0a6',
    0,
    0,
    -0.55,
    'metal',
  );
  f.solid(1.3, 0.8, 0, 0.1);
}
/** Glass fish tank on a cabinet stand. */
export function fishTank(b, x, z, rot = 0, w = 1.2, rng = Math.random) {
  const f = frame(b, x, z, rot);
  f.box(w, 0.75, 0.5, '#2b2d42', 0, 0, 0, 'wood');
  f.box(w - 0.04, 0.5, 0.44, '#4aa3df', 0, 0.78, 0, 'water');
  f.box(w - 0.04, 0.06, 0.44, '#e9c46a', 0, 0.76, 0, 'dirt');
  f.box(w, 0.6, 0.5, '#cfe8ff', 0, 0.75, 0, 'glass');
  f.box(w + 0.02, 0.05, 0.52, '#1a1a1a', 0, 1.35, 0, 'plastic');
  for (let i = 0; i < 4; i++)
    f.box(
      0.03,
      0.2 + rng() * 0.15,
      0.03,
      '#2d6a4f',
      -w / 2 + 0.15 + rng() * (w - 0.3),
      0.8,
      (rng() - 0.5) * 0.3,
      'plastic',
    );
  for (let i = 0; i < 5; i++)
    f.ball(
      0.04,
      ['#ff7b00', '#ffd60a', '#4cc9f0', '#ff006e'][i % 4],
      -w / 2 + 0.15 + rng() * (w - 0.3),
      0.95 + rng() * 0.25,
      (rng() - 0.5) * 0.3,
      'plastic',
      [1.6, 1, 0.6],
    );
  f.solid(w, 0.5);
}
export function vendingMachine(b, x, z, rot = 0, color = '#d62828', rng = Math.random) {
  const f = frame(b, x, z, rot);
  f.rbox(1.0, 1.95, 0.8, color, 0, 0, 0, 'metal');
  f.box(0.62, 1.4, 0.02, '#1d2733', -0.12, 0.4, 0.4, 'plastic');
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 4; c++)
      f.box(
        0.1,
        0.16,
        0.04,
        PAL[Math.floor(rng() * PAL.length)],
        -0.36 + c * 0.155,
        0.5 + r * 0.26,
        0.39,
        'plastic',
      );
  f.box(0.62, 1.4, 0.02, '#cfe8ff', -0.12, 0.4, 0.42, 'glass');
  f.box(0.2, 0.5, 0.02, '#2b2d42', 0.36, 0.95, 0.41, 'plastic');
  f.box(0.5, 0.15, 0.02, '#1a1a1a', -0.12, 0.15, 0.41, 'plastic');
  f.box(0.9, 0.18, 0.02, '#fff4d6', 0, 1.72, 0.41, 'glow');
  f.solid(1.0, 0.8);
}
/** Rolling clothes rack along local x, with shirts on hangers. */
export function clothesRack(b, x, z, rot = 0, len = 1.6, rng = Math.random, palette = PAL) {
  const f = frame(b, x, z, rot);
  for (const sd of [-1, 1]) {
    f.box(0.04, 1.5, 0.04, '#9aa0a6', (sd * len) / 2, 0, 0, 'metal');
    f.box(0.04, 0.04, 0.5, '#9aa0a6', (sd * len) / 2, 0.04, 0, 'metal');
  }
  f.hcyl(0.02, len, '#c0c7cf', 0, 1.5, 0, 'x', 'metal');
  const n = Math.floor((len - 0.2) / 0.11);
  for (let i = 0; i < n; i++) {
    const col = palette[Math.floor(rng() * palette.length)];
    const px = -len / 2 + 0.15 + i * 0.11;
    f.box(0.05, 0.62, 0.46, col, px, 0.82, 0, 'fabric');
    f.box(0.05, 0.12, 0.66, col, px, 1.32, 0, 'fabric');
  }
  f.solid(len, 0.6);
}
/** Cart of balls (gym / sporting goods). */
export function ballCart(b, x, z, rot = 0, cols = ['#e8742b', '#ffffff', '#e63946', '#f4d35e']) {
  const f = frame(b, x, z, rot);
  f.box(0.9, 0.04, 0.55, '#6c757d', 0, 0.2, 0, 'metal');
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      f.box(0.03, 0.75, 0.03, '#6c757d', sx * 0.43, 0.08, sz * 0.26, 'metal');
      f.ball(0.05, '#1a1a1a', sx * 0.43, 0.05, sz * 0.26, 'rubber');
    }
  for (const sz of [-1, 1])
    for (const y of [0.5, 0.82]) f.box(0.9, 0.025, 0.025, '#6c757d', 0, y, sz * 0.26, 'metal');
  for (const sx of [-1, 1])
    for (const y of [0.5, 0.82]) f.box(0.025, 0.025, 0.55, '#6c757d', sx * 0.43, y, 0, 'metal');
  for (let i = 0; i < 10; i++)
    f.ball(
      0.12,
      cols[i % cols.length],
      -0.3 + (i % 4) * 0.2,
      0.36 + Math.floor(i / 4) * 0.2,
      i % 2 ? 0.1 : -0.1,
      'rubber',
    );
  f.solid(0.9, 0.55);
}
/** Freestanding glass-door freezer/cooler run along local x. */
export function freezerCase(
  b,
  x,
  z,
  rot = 0,
  len = 4,
  rng = Math.random,
  palette = ['#bde0fe', '#ffffff', '#ffafcc', '#caffbf', '#ffd6a5', '#3a86ff'],
) {
  const f = frame(b, x, z, rot);
  f.box(len, 2.1, 0.8, '#e9ecef', 0, 0, 0, 'metal');
  const doors = Math.max(1, Math.round(len / 0.9));
  const dw = len / doors;
  for (let i = 0; i < doors; i++) {
    const dx = -len / 2 + dw * (i + 0.5);
    f.box(dw - 0.08, 1.6, 0.02, '#dff3ff', dx, 0.3, 0.405, 'plain');
    for (let s = 0; s < 4; s++)
      for (let k = 0; k < 4; k++)
        f.box(
          dw / 5,
          0.26,
          0.04,
          palette[Math.floor(rng() * palette.length)],
          dx - dw / 2 + (dw * (k + 0.5)) / 4,
          0.36 + s * 0.38,
          0.425,
          'plastic',
        );
    f.box(dw - 0.08, 1.6, 0.03, '#cfe8ff', dx, 0.3, 0.45, 'glass');
    f.box(0.03, 0.6, 0.04, '#adb5bd', dx + dw / 2 - 0.12, 0.8, 0.48, 'metal');
  }
  f.box(len, 0.2, 0.04, '#bde0fe', 0, 1.95, 0.41, 'glow');
  f.solid(len, 0.85);
}
/** Tilted produce display with mounds of fruit and vegetables. */
export function produceStand(
  b,
  x,
  z,
  rot = 0,
  w = 2.4,
  cols = ['#e63946', '#f4a261', '#8ac926', '#ffca3a'],
  rng = Math.random,
) {
  const f = frame(b, x, z, rot);
  f.box(w, 0.7, 0.9, '#8d5a3b', 0, 0, 0, 'wood');
  const n = cols.length;
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + bw * (i + 0.5);
    f.box(bw - 0.06, 0.16, 0.86, '#a5673f', cx, 0.7, 0, 'wood');
    const col = cols[i];
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < Math.floor(bw / 0.2); k++)
        f.ball(
          0.09,
          rng() < 0.2 ? shade(col, 0.85) : col,
          cx - bw / 2 + 0.13 + k * 0.2,
          0.86 + r * 0.06 + 0.05,
          -0.28 + r * 0.28,
          'plastic',
        );
  }
  f.solid(w, 0.9);
}
/** Mall cart kiosk with a striped canopy. */
export function kiosk(b, x, z, rot = 0, color = '#3a86ff', rng = Math.random) {
  const f = frame(b, x, z, rot);
  f.rbox(2.2, 1.0, 1.0, color, 0, 0, 0, 'wood');
  f.box(2.3, 0.06, 1.1, '#f4f1ea', 0, 1.0, 0, 'tile');
  for (let i = 0; i < 9; i++)
    f.box(
      0.16,
      0.22,
      0.12,
      PAL[Math.floor(rng() * PAL.length)],
      -0.9 + i * 0.22,
      1.06,
      i % 2 ? 0.15 : -0.15,
      'plastic',
    );
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) f.box(0.05, 1.3, 0.05, '#e9ecef', sx * 1.05, 1.06, sz * 0.48, 'metal');
  f.box(2.5, 0.1, 1.3, color, 0, 2.36, 0, 'fabric', {
    shade: (px) => (Math.floor((px + 0.5) * 10) % 2 ? '#ffffff' : null),
  });
  f.solid(2.3, 1.1);
}
/** Wire basket of balls (or toys) on the floor. */
export function ballBin(b, x, z, cols = ['#e8742b', '#ffffff', '#e63946', '#3a86ff'], r = 0.32) {
  b.cyl(r, r * 0.9, 0.55, '#6c757d', x, 0, z, { mat: 'metal' });
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05;
    b.add(
      ICO,
      cols[i % cols.length],
      [x + Math.cos(a) * r * 0.45, 0.6 + (i % 2) * 0.08, z + Math.sin(a) * r * 0.45],
      [0, 0, 0],
      [0.12, 0.12, 0.12],
      null,
      'rubber',
    );
  }
  b.colliders.push({ minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r });
}
/** Stack of gym mats. */
export function matStack(b, x, z, rot = 0, n = 4, color = '#1d4ed8') {
  const f = frame(b, x, z, rot);
  for (let i = 0; i < n; i++)
    f.rbox(1.8, 0.14, 1.2, i % 2 ? shade(color, 1.2) : color, (i % 2) * 0.04, i * 0.14, 0, 'fabric');
  f.solid(1.8, 1.2);
}
export function airHockey(b, x, z, rot = 0) {
  const f = frame(b, x, z, rot);
  f.box(2.2, 0.7, 1.2, '#3a0ca3', 0, 0, 0, 'plastic').box(2.1, 0.04, 1.1, '#f8f9fa', 0, 0.7, 0, 'plastic');
  for (const sd of [-1, 1]) {
    f.box(2.2, 0.1, 0.05, '#ff006e', 0, 0.7, sd * 0.575, 'plastic');
    f.box(0.05, 0.1, 1.2, '#ff006e', sd * 1.075, 0.7, 0, 'plastic');
    f.cyl(0.08, 0.08, 0.06, '#e63946', sd * 0.75, 0.74, 0, 'plastic');
    f.box(0.3, 0.12, 0.02, '#ffd60a', sd * 1.1, 0.8, 0, 'glow', { ry: Math.PI / 2 });
  }
  f.box(0.02, 0.005, 1.08, '#e63946', 0, 0.742, 0, 'plain')
    .cyl(0.05, 0.05, 0.015, '#1a1a1a', 0.2, 0.742, 0.1, 'plastic')
    .solid(2.2, 1.2);
}
/** Skee-ball lane running along local z, the target at the far (-z) end. */
export function skeeBall(b, x, z, rot = 0, len = 3.6) {
  const f = frame(b, x, z, rot);
  f.box(0.9, 0.5, len, '#7209b7', 0, 0, 0, 'wood');
  f.box(0.7, 0.04, len - 0.6, '#f4d35e', 0, 0.5, 0.3, 'wood', { rx: -0.08 });
  f.box(0.9, 1.8, 0.4, '#3a0ca3', 0, 0, -len / 2 + 0.2, 'plastic');
  for (const [r, c] of [
    [0.3, '#ffbe0b'],
    [0.2, '#ff006e'],
    [0.1, '#06d6a0'],
  ])
    f.hcyl(r, 0.03, c, 0, 1.1, -len / 2 + 0.42 + (0.3 - r) * 0.1, 'z', 'plastic');
  f.box(0.8, 0.25, 0.02, '#80ffdb', 0, 1.55, -len / 2 + 0.41, 'glow');
  for (let k = 0; k < 3; k++) f.ball(0.07, '#8d5a3b', -0.2 + k * 0.2, 0.62, len / 2 - 0.25, 'wood');
  f.solid(0.9, len);
}
export { BOX, Builder, CONE, CYL, matFor, mulberry32, PRISM, RBOX, SPHERE_LO, THREE };
