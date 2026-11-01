// Furniture: chairs, tables, plants, lamps, sofas, shelves, desks.
import { mulberry32 } from '../../game/rng.js';
import { BOX, CYL, PRISM, RBOX, shade } from '../build.js';
import * as THREE from '../three2d.js';

// Furniture
// Indoor furnishings. Most take (b, x, z, rot): local +z is the object's
// front, so rot = 0 faces +z (south), PI faces -z, PI/2 faces +x, -PI/2 faces -x.
const _eu = new THREE.Euler();
const _qu = new THREE.Quaternion();
/** Euler (XYZ, as Builder.add expects) for "tilt locally by rx/rz, then yaw by rot". */
export function yawTilt(rot, rx = 0, rz = 0) {
  if (!rx && !rz) return [0, rot, 0];
  _eu.set(rx, rot, rz, 'YXZ');
  _qu.setFromEuler(_eu);
  _eu.setFromQuaternion(_qu, 'XYZ');
  return [_eu.x, _eu.y, _eu.z];
}
/** Cheap round shape for fruit, balls and other small round things. */
export const ICO = new THREE.IcosahedronGeometry(1, 1);
/** A local frame for building rotated furniture. y is the bottom unless o.center. */
export function frame(b, x, z, rot = 0) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const at = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
  const put = (geom, col, w, h, d, dx, y, dz, mat, o = {}) => {
    const [px, pz] = at(dx, dz);
    b.add(
      geom,
      col,
      [px, y + (o.center ? 0 : h / 2), pz],
      yawTilt(rot + (o.ry || 0), o.rx || 0, o.rz || 0),
      [w, h, d],
      o.shade || null,
      mat,
    );
  };
  const f = {
    at,
    rot,
    box: (w, h, d, col, dx, y, dz, mat = 'plain', o) => {
      put(BOX, col, w, h, d, dx, y, dz, mat, o);
      return f;
    },
    rbox: (w, h, d, col, dx, y, dz, mat = 'plain', o) => {
      put(RBOX, col, w, h, d, dx, y, dz, mat, o);
      return f;
    },
    cyl: (rt, rb, h, col, dx, y, dz, mat = 'plain') => {
      const [px, pz] = at(dx, dz);
      b.cyl(rt, rb, h, col, px, y, pz, { mat });
      return f;
    },
    cone: (r, h, col, dx, y, dz, mat = 'plain') => {
      const [px, pz] = at(dx, dz);
      b.cone(r, h, col, px, y, pz, { mat });
      return f;
    },
    /** cylinder lying along local x ('x') or local z ('z'), centered at y */
    hcyl: (r, len, col, dx, y, dz, axis = 'x', mat = 'plain') => {
      const [px, pz] = at(dx, dz);
      b.add(
        CYL,
        col,
        [px, y, pz],
        yawTilt(rot, axis === 'z' ? Math.PI / 2 : 0, axis === 'x' ? Math.PI / 2 : 0),
        [r, len, r],
        null,
        mat,
      );
      return f;
    },
    ball: (r, col, dx, y, dz, mat = 'plastic', sc = [1, 1, 1]) => {
      const [px, pz] = at(dx, dz);
      b.add(ICO, col, [px, y, pz], [0, rot, 0], [r * sc[0], r * sc[1], r * sc[2]], null, mat);
      return f;
    },
    /** collider for a w x d footprint centered at local (dx, dz) */
    solid: (w, d, dx = 0, dz = 0) => {
      const xs = [];
      const zs = [];
      for (const [ox, oz] of [
        [-w / 2, -d / 2],
        [w / 2, -d / 2],
        [-w / 2, d / 2],
        [w / 2, d / 2],
      ]) {
        const [px, pz] = at(dx + ox, dz + oz);
        xs.push(px);
        zs.push(pz);
      }
      b.colliders.push({
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minZ: Math.min(...zs),
        maxZ: Math.max(...zs),
      });
      return f;
    },
  };
  return f;
}
export const PAL = [
  '#e63946',
  '#457b9d',
  '#f4a261',
  '#2a9d8f',
  '#e9c46a',
  '#8338ec',
  '#ff006e',
  '#264653',
  '#06d6a0',
  '#3a86ff',
];
export function chair(b, x, z, rot = 0, color = '#2f6fb5', mat = 'plastic') {
  const f = frame(b, x, z, rot);
  f.box(0.44, 0.05, 0.42, color, 0, 0.42, 0, mat);
  f.box(0.44, 0.4, 0.05, color, 0, 0.5, -0.2, mat);
  const leg = mat === 'wood' ? shade(color, 0.8) : '#8b939c';
  for (const [dx, dz] of [
    [-0.19, -0.18],
    [0.19, -0.18],
    [-0.19, 0.18],
    [0.19, 0.18],
  ])
    f.box(0.035, 0.42, 0.035, leg, dx, 0, dz, mat === 'wood' ? 'wood' : 'metal');
}
export function stool(b, x, z, h = 0.65, color = '#e63946') {
  b.cyl(0.19, 0.19, 0.07, color, x, h, z, { mat: 'plastic' });
  b.cyl(0.03, 0.03, h, '#9aa0a6', x, 0, z, { mat: 'metal' });
  b.cyl(0.18, 0.2, 0.03, '#6c757d', x, 0, z, { mat: 'metal' });
}
export function table(b, x, z, w, d, h = 0.75, color = '#a5673f', rot = 0, mat = 'wood') {
  const f = frame(b, x, z, rot);
  f.box(w, 0.06, d, color, 0, h - 0.06, 0, mat);
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ])
    f.box(
      0.06,
      h - 0.06,
      0.06,
      shade(color, 0.75),
      sx * (w / 2 - 0.08),
      0,
      sz * (d / 2 - 0.08),
      mat === 'wood' ? 'wood' : 'metal',
    );
  return f;
}
export function plant(b, x, z, s = 1, pot = '#c8693c', leaf = '#3f8a46', y0 = 0) {
  b.cyl(0.2 * s, 0.15 * s, 0.36 * s, pot, x, y0, z, { mat: 'plastic' });
  b.cyl(0.18 * s, 0.18 * s, 0.02, '#4a3426', x, y0 + 0.35 * s, z, { mat: 'dirt' });
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26;
    const r = i ? 0.13 * s : 0;
    b.add(
      ICO,
      i % 2 ? shade(leaf, 1.15) : leaf,
      [x + Math.cos(a) * r, y0 + (0.55 + (i ? 0 : 0.18)) * s, z + Math.sin(a) * r],
      [0, a, 0],
      [0.19 * s, 0.26 * s, 0.19 * s],
      null,
      'leaves',
    );
  }
}
/** Store mannequin on a stand, facing local +z. */
export function mannequin(b, x, z, rot = 0, shirt = '#e63946', pants = '#264653') {
  const f = frame(b, x, z, rot);
  f.cyl(0.22, 0.24, 0.04, '#2b2b2f', 0, 0, 0, 'metal').cyl(0.02, 0.02, 0.5, '#9aa0a6', 0, 0, 0, 'metal');
  for (const sd of [-0.09, 0.09]) f.rbox(0.13, 0.5, 0.14, pants, sd, 0.42, 0, 'fabric');
  f.rbox(0.42, 0.55, 0.24, shirt, 0, 0.9, 0, 'fabric');
  for (const sd of [-1, 1]) f.rbox(0.1, 0.45, 0.12, shirt, sd * 0.26, 1.0, 0, 'fabric', { rz: sd * 0.12 });
  f.cyl(0.05, 0.05, 0.08, '#e9e4dc', 0, 1.45, 0, 'plastic');
  f.ball(0.14, '#e9e4dc', 0, 1.64, 0, 'plastic', [0.9, 1.1, 1]);
}
export function trashCan(b, x, z, color = '#5c6670', s = 1, recycle = false) {
  b.cyl(0.2 * s, 0.16 * s, 0.6 * s, color, x, 0, z, { mat: 'plastic' });
  b.cyl(0.21 * s, 0.21 * s, 0.04, shade(color, 0.8), x, 0.6 * s, z, { mat: 'plastic' });
  if (recycle) b.cyl(0.185 * s, 0.17 * s, 0.1, '#ffffff', x, 0.32 * s, z, { mat: 'plastic' });
  else b.cyl(0.19 * s, 0.19 * s, 0.02, '#2b2b2f', x, 0.6 * s + 0.01, z, { mat: 'plastic' });
}
/** Wall clock centered at height y, its back against a wall behind it (local -z). */
export function wallClock(b, x, y, z, rot = 0, r = 0.24, rim = '#2b2d42') {
  const f = frame(b, x, z, rot);
  f.hcyl(r, 0.05, rim, 0, y, 0.025, 'z', 'plastic');
  f.hcyl(r * 0.85, 0.02, '#ffffff', 0, y, 0.055, 'z', 'plastic');
  f.box(0.02, r * 0.55, 0.01, '#1a1a1a', 0, y + r * 0.27, 0.07, 'plastic', { center: true });
  f.box(r * 0.45, 0.02, 0.01, '#1a1a1a', r * 0.2, y, 0.072, 'plastic', { center: true });
  f.box(0.012, r * 0.7, 0.008, '#d62828', 0, y, 0.074, 'plastic', { center: true, rz: 0.9 });
}
/** A framed picture hung at center height y (back against the wall). */
export function wallFrame(b, x, y, z, w, h, rot = 0, cols = ['#9bd5ff', '#7bc96f'], frameCol = '#6d4630') {
  const f = frame(b, x, z, rot);
  f.box(w, h, 0.04, frameCol, 0, y - h / 2, 0.02, 'wood');
  f.box(w - 0.1, (h - 0.1) * 0.55, 0.012, cols[0], 0, y - h / 2 + 0.05 + (h - 0.1) * 0.45, 0.045, 'plain');
  f.box(w - 0.1, (h - 0.1) * 0.45, 0.012, cols[1], 0, y - h / 2 + 0.05, 0.045, 'plain');
  if (cols[2])
    f.box(
      (w - 0.1) * 0.3,
      (h - 0.1) * 0.35,
      0.014,
      cols[2],
      -w * 0.12,
      y - h / 2 + 0.05 + (h - 0.1) * 0.3,
      0.048,
      'plain',
    );
}
/** Cork bulletin board with pinned papers, centered at height y. */
export function bulletinBoard(b, x, y, z, w, h, rot = 0, seed = 1) {
  const f = frame(b, x, z, rot);
  const rng = mulberry32(seed);
  f.box(w, h, 0.04, '#7a5233', 0, y - h / 2, 0.02, 'wood');
  f.box(w - 0.1, h - 0.1, 0.02, '#c9955a', 0, y - h / 2 + 0.05, 0.05, 'fabric');
  const n = Math.max(3, Math.floor(w * 2.4));
  for (let i = 0; i < n; i++) {
    const pw = 0.22 + rng() * 0.14;
    const ph = 0.26 + rng() * 0.12;
    const px = -w / 2 + 0.2 + (i + 0.5) * ((w - 0.4) / n) + (rng() - 0.5) * 0.08;
    const py = y - h / 2 + 0.1 + ph / 2 + rng() * Math.max(0.01, h - ph - 0.25);
    f.box(
      Math.min(pw, (w - 0.4) / n),
      ph,
      0.01,
      ['#ffffff', '#fff3b0', '#bde0fe', '#ffc8dd', '#caffbf'][Math.floor(rng() * 5)],
      px,
      py,
      0.065,
      'plain',
      { center: true, rz: (rng() - 0.5) * 0.15 },
    );
    f.ball(0.02, PAL[Math.floor(rng() * PAL.length)], px, py + ph / 2 - 0.03, 0.075);
  }
}
/** Hanging pennant banner (triangle pointing down), top edge at y. */
export function pennant(b, x, y, z, w, h, rot = 0, color = '#e63946', stripe = '#ffffff') {
  const [ex, ey, ez] = yawTilt(rot, 0, Math.PI);
  b.add(PRISM, color, [x, y, z], [ex, ey, ez], [w, h, 0.03], null, 'fabric');
  const f = frame(b, x, z, rot);
  f.box(w, 0.06, 0.035, stripe, 0, y - 0.06, 0, 'fabric');
}
export function floorLamp(b, x, z, shadeCol = '#fff1c9', h = 1.6) {
  b.cyl(0.18, 0.2, 0.04, '#2b2b2f', x, 0, z, { mat: 'metal' });
  b.cyl(0.02, 0.02, h, '#3a3a3f', x, 0, z, { mat: 'metal' });
  b.cyl(0.08, 0.08, 0.12, '#fff4d6', x, h - 0.12, z, { mat: 'glow' });
  b.cyl(0.14, 0.24, 0.3, shadeCol, x, h - 0.15, z, { mat: 'fabric' });
}
export function tableLamp(b, x, y, z, shadeCol = '#fff1c9', baseCol = '#6d8fb3') {
  b.add(ICO, baseCol, [x, y + 0.1, z], [0, 0, 0], [0.09, 0.11, 0.09], null, 'plastic');
  b.cyl(0.012, 0.012, 0.16, '#d4af37', x, y + 0.18, z, { mat: 'metal' });
  b.cyl(0.05, 0.05, 0.06, '#fff4d6', x, y + 0.28, z, { mat: 'glow' });
  b.cyl(0.09, 0.14, 0.17, shadeCol, x, y + 0.26, z, { mat: 'fabric' });
}
export function armchair(b, x, z, rot = 0, color = '#2a9d8f', solid = true) {
  const f = frame(b, x, z, rot);
  f.rbox(0.9, 0.42, 0.85, shade(color, 0.85), 0, 0, 0, 'fabric');
  f.rbox(0.62, 0.14, 0.62, color, 0, 0.4, 0.06, 'fabric');
  f.rbox(0.9, 0.62, 0.2, shade(color, 0.9), 0, 0.3, -0.34, 'fabric');
  for (const sd of [-1, 1]) f.rbox(0.16, 0.26, 0.82, shade(color, 0.92), sd * 0.38, 0.38, 0, 'fabric');
  if (solid) f.solid(0.9, 0.85);
}
export function sofa(b, x, z, rot = 0, color = '#7a6a5e', w = 2.2, solid = true) {
  const f = frame(b, x, z, rot);
  f.rbox(w, 0.42, 0.9, shade(color, 0.85), 0, 0, 0, 'fabric');
  for (const sd of [-1, 1]) f.rbox(w / 2 - 0.22, 0.14, 0.66, color, sd * (w / 4 - 0.05), 0.4, 0.07, 'fabric');
  f.rbox(w, 0.6, 0.22, shade(color, 0.9), 0, 0.3, -0.34, 'fabric');
  for (const sd of [-1, 1]) f.rbox(0.2, 0.3, 0.9, shade(color, 0.92), sd * (w / 2 - 0.1), 0.3, 0, 'fabric');
  if (solid) f.solid(w, 0.9);
}
export function beanbag(b, x, z, color = '#ff595e', s = 1) {
  b.add(ICO, color, [x, 0.26 * s, z], [0, x, 0], [0.5 * s, 0.3 * s, 0.48 * s], null, 'fabric');
  b.add(
    ICO,
    shade(color, 0.9),
    [x, 0.4 * s, z - 0.22 * s],
    [0.3, 0, 0],
    [0.38 * s, 0.28 * s, 0.2 * s],
    null,
    'fabric',
  );
}
export function rug(b, x, z, w, d, color = '#e76f51', border = '#f4d35e', rot = 0) {
  const f = frame(b, x, z, rot);
  f.box(w, 0.025, d, border, 0, 0.06, 0, 'carpet');
  f.box(w - 0.2, 0.03, d - 0.2, color, 0, 0.06, 0, 'carpet');
}
/** Generic shelving unit filled with books / products / toys / shoes / folded clothes. */
export function shelfUnit(
  b,
  x,
  z,
  {
    w = 1.6,
    h = 1.8,
    d = 0.45,
    rot = 0,
    shelves = 4,
    fill = 'books',
    color = '#8d5a3b',
    rng = Math.random,
    palette = PAL,
    solid = true,
    mat = 'wood',
  } = {},
) {
  const f = frame(b, x, z, rot);
  const gap = (h - 0.06) / shelves;
  f.box(w, h, 0.03, shade(color, 0.85), 0, 0, -d / 2 + 0.015, mat);
  for (const sd of [-1, 1]) f.box(0.04, h, d, color, sd * (w / 2 - 0.02), 0, 0, mat);
  for (let i = 0; i <= shelves; i++) f.box(w, 0.04, d, color, 0, Math.min(h - 0.04, i * gap), 0, mat);
  if (fill === 'none') {
    if (solid) f.solid(w, d);
    return f;
  }
  const pick = () => palette[Math.floor(rng() * palette.length)];
  for (let i = 0; i < shelves; i++) {
    const y0 = i * gap + 0.04;
    const ih = gap - 0.08;
    let off = -w / 2 + 0.07;
    while (off < w / 2 - 0.12) {
      let iw;
      if (fill === 'books') {
        iw = 0.05 + rng() * 0.07;
        const bh = ih * (0.7 + rng() * 0.25);
        f.box(iw, bh, d * 0.75, pick(), off + iw / 2, y0, 0.02, 'fabric');
        if (rng() < 0.07) off += 0.12;
      } else if (fill === 'shoes') {
        iw = 0.32;
        const col = pick();
        for (const sd of [-0.075, 0.075]) {
          f.box(0.12, 0.09, d * 0.6, col, off + 0.16 + sd, y0, 0.03, 'shoe');
          f.box(0.12, 0.02, d * 0.6, '#ffffff', off + 0.16 + sd, y0, 0.03, 'rubber');
        }
      } else if (fill === 'folded') {
        iw = 0.34;
        const col = pick();
        const n = 2 + Math.floor(rng() * 3);
        for (let k = 0; k < n; k++)
          f.box(
            0.3,
            0.06,
            d * 0.7,
            k % 2 ? shade(col, 1.08) : col,
            off + 0.17,
            y0 + k * 0.065,
            0.02,
            'fabric',
          );
      } else if (fill === 'toys') {
        iw = 0.2 + rng() * 0.12;
        const col = pick();
        if (rng() < 0.45)
          f.ball(
            Math.min(iw, ih) * 0.4,
            col,
            off + iw / 2,
            y0 + Math.min(iw, ih) * 0.4,
            0.02,
            rng() < 0.5 ? 'rubber' : 'plastic',
          );
        else f.box(iw * 0.85, ih * (0.4 + rng() * 0.4), d * 0.6, col, off + iw / 2, y0, 0.02, 'plastic');
      } else {
        // products: boxes, cans and bottles
        iw = 0.13 + rng() * 0.1;
        const col = pick();
        const ph = ih * (0.55 + rng() * 0.35);
        const r = rng();
        if (r < 0.5) f.box(iw * 0.9, ph, d * 0.6, col, off + iw / 2, y0, 0.03, 'plastic');
        else if (r < 0.8) f.cyl(iw * 0.4, iw * 0.4, ph * 0.8, col, off + iw / 2, y0, 0.03, 'plastic');
        else {
          f.cyl(iw * 0.32, iw * 0.38, ph, col, off + iw / 2, y0, 0.03, 'plastic');
          f.cyl(0.03, 0.03, 0.06, '#ffffff', off + iw / 2, y0 + ph, 0.03, 'plastic');
        }
      }
      off += iw + 0.01;
    }
  }
  if (solid) f.solid(w, d);
  return f;
}
export function fileCabinet(b, x, z, rot = 0, drawers = 4, color = '#8d99a6') {
  const f = frame(b, x, z, rot);
  const h = drawers * 0.33;
  f.box(0.48, h, 0.6, color, 0, 0, 0, 'metal');
  for (let i = 0; i < drawers; i++) {
    f.box(0.42, 0.28, 0.02, shade(color, 1.08), 0, 0.03 + i * 0.33, 0.3, 'metal');
    f.box(0.14, 0.03, 0.03, '#d9dde2', 0, 0.22 + i * 0.33, 0.32, 'metal');
  }
  f.solid(0.48, 0.6);
}
/** Desk with a computer, keyboard and chair (sitter faces local -z toward the screen). */
export function computerDesk(b, x, z, rot = 0, chairCol = '#2b2d42', w = 1.2) {
  const f = table(b, x, z, w, 0.65, 0.74, '#b08968', rot);
  f.box(0.06, 0.32, 0.18, '#2b2b2f', 0, 0.74, -0.18, 'plastic');
  f.box(0.62, 0.4, 0.04, '#1a1a1a', 0, 0.9, -0.2, 'plastic');
  f.box(0.55, 0.32, 0.01, '#4cc9f0', 0, 0.94, -0.177, 'glow');
  f.box(0.5, 0.02, 0.16, '#3a3a3f', 0, 0.74, 0.06, 'plastic');
  f.box(0.08, 0.02, 0.11, '#3a3a3f', 0.36, 0.74, 0.08, 'plastic');
  f.box(0.2, 0.42, 0.42, '#2b2b2f', w / 2 - 0.2, 0, -0.08, 'plastic');
  const [cx, cz] = f.at(0, 0.62);
  chair(b, cx, cz, rot + Math.PI, chairCol);
  f.solid(w, 0.65);
  return f;
}
