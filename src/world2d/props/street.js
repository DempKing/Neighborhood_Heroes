// Street things: signs, lamps, mailboxes, cars, benches, lawn chairs.
import { BOX, CYL, RBOX, signMesh } from '../build.js';

export function addSign(group, text, x, y, z, width = 3, rotY = 0, opts = {}) {
  const s = signMesh(text, width, opts);
  s.position.set(x, y, z);
  s.rotation.y = rotY;
  group.add(s);
  return s;
}
export function streetLamp(b, x, z) {
  b.cyl(0.06, 0.1, 4.2, '#2f3238', x, 0, z, { collide: true, mat: 'metal' });
  b.cyl(0.18, 0.18, 0.15, '#2f3238', x, 0, z, { mat: 'metal' });
  b.add(CYL, '#2f3238', [x, 4.25, z + 0.35], [Math.PI / 2, 0, 0], [0.04, 0.7, 0.04], null, 'metal');
  b.cyl(0.12, 0.28, 0.2, '#2f3238', x, 4.15, z + 0.7, { mat: 'metal' });
  b.sphere(0.16, '#fff1c9', x, 4.08, z + 0.7, [1, 0.6, 1], { mat: 'glow' });
}
export function mailbox(b, x, z, color = '#2f5d8a') {
  b.box(0.08, 1.0, 0.08, '#6d4c41', x, 0, z, { mat: 'wood' });
  b.rbox(0.28, 0.28, 0.5, color, x, 1.0, z, { mat: 'metal' });
  b.box(0.03, 0.18, 0.1, '#e63946', x + 0.15, 1.18, z - 0.1, { mat: 'metal' });
}
export function car(b, x, z, rot = 0, color = '#e63946') {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const at = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
  const add = (geom, col, dx, dy, dz, sc, mat, extraRot = [0, 0, 0]) => {
    const [px, pz] = at(dx, dz);
    b.add(geom, col, [px, dy, pz], [extraRot[0], rot + extraRot[1], extraRot[2]], sc, null, mat);
  };
  add(RBOX, color, 0, 0.62, 0, [1.85, 0.62, 4.1], 'shoe');
  add(RBOX, color, 0, 1.12, -0.25, [1.65, 0.62, 2.2], 'shoe');
  add(RBOX, '#1d2733', 0, 1.14, -0.25, [1.67, 0.46, 2.0], 'glass');
  add(BOX, '#e8e8e8', 0, 0.62, 2.06, [1.5, 0.18, 0.06], 'metal');
  for (const sd of [-0.6, 0.6]) {
    add(BOX, '#fff6d6', sd, 0.72, 2.06, [0.32, 0.14, 0.04], 'glow');
    add(BOX, '#d62828', sd, 0.72, -2.06, [0.3, 0.14, 0.04], 'plastic');
  }
  for (const [dx, dz] of [
    [-0.88, 1.3],
    [0.88, 1.3],
    [-0.88, -1.3],
    [0.88, -1.3],
  ]) {
    add(CYL, '#1a1a1a', dx, 0.34, dz, [0.34, 0.26, 0.34], 'rubber', [0, 0, Math.PI / 2]);
    add(CYL, '#c0c7cf', dx * 1.08, 0.34, dz, [0.18, 0.08, 0.18], 'metal', [0, 0, Math.PI / 2]);
  }
  const [mx, mz] = at(0, 0);
  b.colliders.push({ minX: mx - 1.7, maxX: mx + 1.7, minZ: mz - 1.7, maxZ: mz + 1.7 });
}
export function bench(b, x, z, rot = 0, color = '#8d5a3b') {
  for (let i = 0; i < 3; i++)
    b.add(
      BOX,
      color,
      [x - Math.sin(rot) * (i * 0.15 - 0.15), 0.45, z - Math.cos(rot) * (i * 0.15 - 0.15)],
      [0, rot, 0],
      [1.8, 0.05, 0.12],
      null,
      'wood',
    );
  for (let i = 0; i < 2; i++)
    b.add(
      BOX,
      color,
      [x - Math.sin(rot) * 0.25, 0.65 + i * 0.18, z - Math.cos(rot) * 0.25],
      [0, rot, 0],
      [1.8, 0.1, 0.04],
      null,
      'wood',
    );
  for (const sd of [-0.75, 0.75])
    b.add(
      BOX,
      '#2f3238',
      [x + Math.cos(rot) * sd, 0.3, z - Math.sin(rot) * sd],
      [0, rot, 0],
      [0.06, 0.6, 0.5],
      null,
      'metal',
    );
}
export function lawnChair(b, x, z, rot = 0, color = '#4cc9f0') {
  b.add(
    BOX,
    color,
    [x, 0.38, z],
    [0, rot, 0],
    [0.55, 0.05, 0.5],
    (px, py, pz) => (Math.floor((px + 0.5) * 6) % 2 ? '#ffffff' : null),
    'fabric',
  );
  b.add(
    BOX,
    color,
    [x - Math.sin(rot) * 0.26, 0.68, z - Math.cos(rot) * 0.26],
    [0.3, rot, 0],
    [0.55, 0.6, 0.04],
    (px) => (Math.floor((px + 0.5) * 6) % 2 ? '#ffffff' : null),
    'fabric',
  );
  for (const sd of [-0.27, 0.27])
    b.add(
      BOX,
      '#c0c7cf',
      [x + Math.cos(rot) * sd, 0.2, z - Math.sin(rot) * sd],
      [0, rot, 0],
      [0.03, 0.4, 0.5],
      null,
      'metal',
    );
}
