// Houses and apartment blocks, with their windows.
import { BOX, GABLE, shade } from '../build.js';

// House details
/** A window with frame, mullions, sill and glass, on a wall facing direction `face` (+1 = +z). */
export function windowOn(b, x, y, z, w, h, face = 1, axis = 'z', frame = '#ffffff', shutters = null) {
  const out = 0.05 * face;
  const P = (dx, dz) => (axis === 'z' ? [x + dx, z + dz] : [x + dz, z + dx]);
  const rotY = axis === 'z' ? 0 : Math.PI / 2;
  const add = (ww, hh, dd, col, dx, dy, dz, mat) => {
    const [px, pz] = P(dx, dz);
    b.add(BOX, col, [px, y + dy, pz], [0, rotY, 0], [ww, hh, dd], null, mat);
  };
  add(w, h, 0.03, '#3f5a73', 0, 0, out * 0.15, 'plastic');
  add(w, h, 0.04, '#9ec9e8', 0, 0, out * 0.5, 'glass');
  add(w + 0.16, 0.08, 0.1, frame, 0, h / 2, out, 'paint');
  add(w + 0.16, 0.08, 0.1, frame, 0, -h / 2, out, 'paint');
  add(0.08, h, 0.1, frame, -w / 2, 0, out, 'paint');
  add(0.08, h, 0.1, frame, w / 2, 0, out, 'paint');
  add(0.05, h, 0.06, frame, 0, 0, out, 'paint');
  add(w, 0.05, 0.06, frame, 0, 0, out, 'paint');
  add(w + 0.3, 0.06, 0.2, frame, 0, -h / 2 - 0.06, out * 2, 'paint');
  if (shutters)
    for (const sd of [-1, 1])
      add(w * 0.38, h + 0.05, 0.05, shutters, sd * (w / 2 + w * 0.22), 0, out, 'wood');
}
/** Detailed suburban house facing +z (face=1) or -z (face=-1). Returns door/porch/window positions. */
function houseShape(b, x, z, opts = {}) {
  const w = opts.w || 8;
  const d = opts.d || 7;
  const h = opts.h || 3.0;
  const face = opts.face ?? 1;
  const wall = opts.wall || '#f2d6a2';
  const roof = opts.roof || '#7a3b2e';
  const trim = opts.trim || '#ffffff';
  const style = opts.style || 'ranch';
  const two = style === 'colonial';
  const H = two ? h * 1.75 : h;
  const wallMat = opts.brick ? 'brick' : 'siding';
  b.box(w + 0.3, 0.35, d + 0.3, '#a8a29a', x, 0, z, { mat: 'concrete' }); // foundation
  b.box(w, H, d, wall, x, 0.3, z, { collide: true, mat: wallMat });
  for (const cx of [-1, 1])
    for (const cz of [-1, 1])
      b.box(0.14, H, 0.14, trim, x + cx * (w / 2), 0.3, z + cz * (d / 2), { mat: 'paint' });
  // roof: two slabs + gable ends
  const rh = style === 'craftsman' ? 1.3 : 1.8;
  const over = 0.45;
  const slope = Math.atan2(rh, w / 2);
  const rl = Math.hypot(w / 2 + over, rh + over * Math.tan(slope));
  for (const sx of [-1, 1])
    b.box(rl, 0.16, d + over * 2, roof, x + sx * (w / 4 + over / 4), H + 0.3 + rh / 2 - 0.05, z, {
      rot: [0, 0, -sx * slope],
      center: true,
      mat: 'shingle',
    });
  b.add(GABLE, wall, [x, H + 0.3, z], [0, 0, 0], [w, rh, d - 0.02], null, wallMat);
  b.box(0.18, 0.18, d + over * 2 + 0.05, shade(roof, 0.8), x, H + 0.3 + rh, z, {
    center: true,
    mat: 'shingle',
  });
  // trim/fascia
  for (const sz of [-1, 1])
    b.box(w + 0.2, 0.12, 0.08, trim, x, H + 0.24, z + sz * (d / 2 + 0.04), { mat: 'paint' });
  // chimney
  if (opts.chimney !== false)
    b.box(0.75, rh + 1.3, 0.75, '#9b4a3a', x + w / 3, H, z - (face * d) / 5, { mat: 'brick' });
  const fz = z + (d / 2) * face;
  // front door + steps + porch
  const doorX = style === 'colonial' ? x : x - w * 0.18;
  b.box(1.05, 2.15, 0.1, opts.door || '#7a2e2e', doorX, 0.35, fz + 0.03 * face, { mat: 'wood' });
  b.box(1.25, 0.12, 0.14, trim, doorX, 2.5, fz + 0.05 * face, { mat: 'paint' });
  for (const sd of [-1, 1])
    b.box(0.1, 2.25, 0.12, trim, doorX + sd * 0.58, 0.35, fz + 0.05 * face, { mat: 'paint' });
  b.sphere(0.05, '#d4af37', doorX + 0.35, 1.35, fz + 0.1 * face, [1, 1, 1], { mat: 'metal' });
  const porchD = style === 'craftsman' || style === 'farm' ? 2.2 : 1.4;
  const porchW = style === 'farm' ? w : 2.8;
  const pcx = style === 'farm' ? x : doorX;
  b.box(porchW, 0.32, porchD, '#c9bba4', pcx, 0, fz + (porchD / 2) * face, { mat: 'wood' });
  for (let i = 0; i < 2; i++)
    b.box(1.3, 0.16, 0.35, '#b7aa94', doorX, 0, fz + (porchD + 0.17 + i * 0.3) * face, { mat: 'concrete' });
  if (style === 'craftsman' || style === 'farm') {
    for (const sd of [-1, 1])
      b.cyl(0.09, 0.11, 2.4, trim, pcx + sd * (porchW / 2 - 0.2), 0.32, fz + (porchD - 0.2) * face, {
        mat: 'paint',
      });
    b.box(porchW + 0.3, 0.14, porchD + 0.2, roof, pcx, 2.74, fz + (porchD / 2) * face, { mat: 'shingle' });
  } else {
    b.box(1.6, 0.1, 1.0, roof, doorX, 2.7, fz + 0.45 * face, { rot: [face * 0.25, 0, 0], mat: 'shingle' });
  }
  // windows
  const windows = [];
  const wy = 1.55;
  const slots = style === 'colonial' ? [-w * 0.32, w * 0.32] : [w * 0.18, w * 0.38 - 0.4];
  for (const sx of slots) {
    windowOn(b, x + sx, wy, fz, 1.2, 1.15, face, 'z', trim, opts.shutter);
    windows.push({ x: x + sx, z: fz });
  }
  if (style === 'colonial') {
    for (const sx of [-w * 0.32, 0, w * 0.32])
      windowOn(b, x + sx, wy + h * 0.85, fz, 1.1, 1.1, face, 'z', trim, opts.shutter);
  }
  for (const sd of [-1, 1]) windowOn(b, x + sd * (w / 2), wy, z, 1.0, 1.0, sd, 'x', trim, null);
  // garage
  if (opts.garage) {
    const gx = x + (w / 2 + 2.0) * opts.garage;
    b.box(4, 2.8, d - 1, wall, gx, 0.3, z - face * 0.5, { collide: true, mat: wallMat });
    b.box(4.4, 0.16, d - 0.4, roof, gx, 3.15, z - face * 0.5, { mat: 'shingle' });
    b.box(3.2, 2.1, 0.08, '#f2f2f2', gx, 0.35, z - face * 0.5 + face * ((d - 1) / 2 + 0.03), {
      mat: 'siding',
    });
    b.box(4.2, 0.06, 8, '#cfcac0', gx, 0, z + face * (d / 2 + 4), { mat: 'concrete' });
  }
  return {
    door: { x: doorX, z: fz + (porchD + 0.6) * face },
    porch: { x: doorX, z: fz + porchD * 0.6 * face },
    windows,
  };
}
function apartmentShape(b, x, z, opts = {}) {
  const w = opts.w || 14;
  const d = opts.d || 9;
  const floors = opts.floors || 3;
  const wall = opts.wall || '#c98b5e';
  const H = floors * 3;
  b.box(w, H, d, wall, x, 0, z, { collide: true, mat: 'brick' });
  b.box(w + 0.5, 0.4, d + 0.5, '#d8d2c4', x, H, z, { mat: 'concrete' });
  for (let f = 0; f < floors; f++) {
    for (let i = 0; i < 5; i++) {
      const wx = x - w / 2 + 1.6 + i * ((w - 3.2) / 4);
      windowOn(b, wx, f * 3 + 1.6, z + d / 2, 1.1, 1.3, 1, 'z', '#f4f1ea');
      if (f > 0 && i % 2 === 0) {
        b.box(1.9, 0.12, 0.9, '#9a9a9a', wx, f * 3 + 0.75, z + d / 2 + 0.45, { mat: 'concrete' });
        for (let k = 0; k < 5; k++)
          b.box(0.04, 0.8, 0.04, '#333', wx - 0.9 + k * 0.45, f * 3 + 0.8, z + d / 2 + 0.88, {
            mat: 'metal',
          });
        b.box(1.9, 0.05, 0.05, '#333', wx, f * 3 + 1.6, z + d / 2 + 0.88, { mat: 'metal' });
      }
    }
  }
  b.box(2.2, 2.6, 0.12, '#5d4037', x, 0, z + d / 2 + 0.03, { mat: 'wood' });
  b.box(3.0, 0.2, 1.4, '#3d5a80', x, 2.9, z + d / 2 + 0.6, { mat: 'metal' });
  for (let k = 0; k < 3; k++)
    b.box(0.6, 0.5, 0.4, '#cfcfcf', x + w / 2 - 1 - k * 1.2, H - 2.2, z + d / 2 + 0.25, { mat: 'metal' });
  return { door: { x, z: z + d / 2 + 1.2 } };
}
export function house(b, x, z, opts = {}) {
  const prev = b.grp;
  b.grp = `house:${x}:${z}`;
  try {
    return houseShape(b, x, z, opts);
  } finally {
    b.grp = prev;
  }
}
export function apartment(b, x, z, opts = {}) {
  const prev = b.grp;
  b.grp = `apt:${x}:${z}`;
  try {
    return apartmentShape(b, x, z, opts);
  } finally {
    b.grp = prev;
  }
}
