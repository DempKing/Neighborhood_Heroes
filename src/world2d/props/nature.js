// Trees, bushes, flowers, grass and fences (and the wind that sways them).
import { PRISM, shade } from '../build.js';
import * as THREE from '../three2d.js';

/** Shared wind clock for swaying grass (advanced by the engine). */
export const wind = { value: 0 };
// Nature
// Trees, bushes and flower beds are hand-painted 2D pieces (see paint.js).
export function tree(b, x, z, s = 1, kind = 0) {
  b.paint('tree', x, z, s, { kind });
  b.colliders.push({ minX: x - 0.28 * s, maxX: x + 0.28 * s, minZ: z - 0.28 * s, maxZ: z + 0.28 * s });
}
export function pine(b, x, z, s = 1) {
  b.paint('pine', x, z, s);
  b.colliders.push({ minX: x - 0.2 * s, maxX: x + 0.2 * s, minZ: z - 0.2 * s, maxZ: z + 0.2 * s });
}
export function bush(b, x, z, s = 1, color = '#4f9a3a') {
  b.paint('bush', x, z, s, { color });
}
export function flowers(b, x, z, w, d) {
  b.paint('flowers', x, z, 1, { w, d });
}
/** Grass is painted into the ground layer by the renderer; nothing to add here. */
export function grassTufts() {
  return new THREE.Group();
}
// Fences
export function fence(b, x1, z1, x2, z2, color = '#f4ead5', h = 1.0) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const ang = Math.atan2(x2 - x1, z2 - z1);
  const n = Math.max(2, Math.round(len / 0.3));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x1 + (x2 - x1) * t;
    const pz = z1 + (z2 - z1) * t;
    b.box(0.1, h, 0.035, color, px, 0, pz, { rot: [0, ang, 0], mat: 'wood' });
    b.add(PRISM, color, [px, h, pz], [0, ang + Math.PI / 2, 0], [0.1, 0.1, 0.035], null, 'wood');
  }
  for (let i = 0; i <= Math.ceil(len / 2.4); i++) {
    const t = Math.min(1, (i * 2.4) / len);
    b.box(0.12, h + 0.08, 0.12, shade(color, 0.95), x1 + (x2 - x1) * t, 0, z1 + (z2 - z1) * t, {
      mat: 'wood',
    });
  }
  const mx = (x1 + x2) / 2;
  const mz = (z1 + z2) / 2;
  b.box(0.05, 0.08, len, shade(color, 0.9), mx, h * 0.28, mz, { rot: [0, ang, 0], mat: 'wood' });
  b.box(0.05, 0.08, len, shade(color, 0.9), mx, h * 0.72, mz, { rot: [0, ang, 0], mat: 'wood' });
  const pad = 0.15;
  b.colliders.push({
    minX: Math.min(x1, x2) - pad,
    maxX: Math.max(x1, x2) + pad,
    minZ: Math.min(z1, z2) - pad,
    maxZ: Math.max(z1, z2) + pad,
  });
}
