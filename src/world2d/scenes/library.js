// The library.
import { mulberry32 } from '../../game/rng.js';
import { makeArea } from '../buildings.js';
import * as P from '../props.js';
import { act, base, finish, ground, portico, zone } from './common.js';
import { PAL8 } from './school.js';

// ======================================================== LIBRARY =======
export function buildLibrary() {
  const sc = base({ minX: -34, maxX: 34, minZ: -20, maxZ: 32 });
  const b = sc.b;
  const rng = mulberry32(11);
  ground(sc, 0, 6, 100, 70);
  const lib = makeArea(sc, {
    id: 'library',
    x: 0,
    z: 0,
    w: 50,
    d: 30,
    wallH: 4.2,
    mode: 'cutaway',
    ext: { color: '#c98b5e', mat: 'brick' },
    int: { color: '#efe2cc', mat: 'paint' },
    floor: { color: '#a8774f', mat: 'wood' },
    doors: [{ side: 'S', at: 0, w: 3.2, glass: true, h: 3 }],
    windows: { S: [-18, -10, 10, 18], E: [-8, 0, 8], W: [-8, 0, 8] },
    windowH: 2.0,
    windowY: 2.1,
    roof: { type: 'gable', color: '#2d4a3e', h: 4, over: 0.7 },
    trim: '#f4f1ea',
  });
  const lb = lib.b;
  portico(b, 0, 16.6, 9, 4, 3.6, '#f4f1ea', 1);
  P.addSign(sc.group, 'PUBLIC LIBRARY', 0, 4.9, 16.65, 5, 0, { bg: '#2d4a3e', color: '#ffd166' });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) P.bookshelf(lb, -4 + c * 8, -6 + r * 4, 5, 0, rng);
  for (let k = 0; k < 4; k++) P.bookshelf(lb, -22 + k * 6, -14.3, 5, 0, rng);
  lb.cyl(4, 4, 0.03, '#ffafcc', -16, 0.05, -7, { mat: 'carpet' });
  for (let k = 0; k < 5; k++)
    lb.sphere(
      0.55,
      ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'][k],
      -18 + k * 1.2,
      0.4,
      -5.5 - (k % 2),
      [1, 0.7, 1],
      { mat: 'fabric' },
    );
  P.addSign(lib.contents, "Kids' Corner", -16, 2.6, -14.0, 2.4);
  zone(sc, "kids' corner", -16, -7, 7, 6);
  for (let k = 0; k < 5; k++) {
    const cx2 = 11 + k * 2.2;
    lb.rbox(1.4, 0.06, 0.75, '#6d4c41', cx2, 0.75, -11, { mat: 'wood' });
    lb.rbox(0.7, 0.48, 0.06, '#1a1a1a', cx2, 1.1, -11.25, { mat: 'plastic' });
    lb.box(0.62, 0.4, 0.02, '#4cc9f0', cx2, 1.12, -11.21, { mat: 'glow' });
    for (const [dx, dz] of [
      [-0.62, -0.3],
      [0.62, -0.3],
      [-0.62, 0.3],
      [0.62, 0.3],
    ])
      lb.box(0.05, 0.75, 0.05, '#4a3428', cx2 + dx, 0, -11 + dz, { mat: 'wood' });
    lb.box(0.04, 0.12, 0.04, '#1a1a1a', cx2, 0.81, -11.25, { mat: 'plastic' });
    lb.box(0.5, 0.02, 0.16, '#3a3a3f', cx2, 0.81, -10.85, { mat: 'plastic' });
    lb.box(0.2, 0.4, 0.4, '#2b2b2f', cx2 + 0.5, 0, -11.05, { mat: 'plastic' });
    P.chair(lb, cx2, -10.25, Math.PI, '#264653');
    sc.colliders.push({ minX: cx2 - 0.7, maxX: cx2 + 0.7, minZ: -11.38, maxZ: -10.62 });
  }
  zone(sc, 'computer row', 15, -9.5, 10, 2.5);
  for (let k = 0; k < 3; k++) {
    lb.rbox(1.2, 0.5, 1.1, '#6a994e', -20 + k * 2.5, 0, 8, { mat: 'fabric' });
    lb.rbox(1.2, 0.8, 0.3, '#6a994e', -20 + k * 2.5, 0.4, 7.5, { mat: 'fabric' });
  }
  lb.rbox(2, 1.0, 0.9, '#c9a227', -12, 0, 10, { collide: true, mat: 'wood' });
  act(sc, 'shop', -12, 11.2, 'Book sale cart & checkout', { shop: 'book sale' });
  zone(sc, 'reading nook', -17, 8, 9, 4);
  for (let k = 0; k < 3; k++) {
    lb.rbox(3, 0.08, 1.4, '#a5673f', 10 + k * 4, 0.75, 6, { mat: 'wood' });
    for (const dx of [-1.3, 1.3]) lb.box(0.08, 0.75, 1.2, '#7a4f2b', 10 + k * 4 + dx, 0, 6, { mat: 'wood' });
    lb.cyl(0.05, 0.12, 0.4, '#2d6a4f', 10 + k * 4, 0.79, 6, { mat: 'metal' });
    lb.sphere(0.12, '#fff1c9', 10 + k * 4, 1.2, 6, [1, 0.7, 1], { mat: 'glow' });
  }
  zone(sc, 'homework tables', 14, 6, 12, 4, {
    seats: Array.from({ length: 12 }, (_, i) => ({
      x: 9 + (i % 6) * 2,
      z: i < 6 ? 5 : 7,
      rot: i < 6 ? 0 : Math.PI,
    })),
  });
  act(sc, 'study', 14, 9, 'Study for quizzes (30 min)');
  P.counter(lb, 14, 1, 5, 0, '#264653');
  P.addSign(lib.contents, 'Suncrest Youth Sports League', 14, 2.4, 0.5, 4.2, 0, {
    bg: '#264653',
    color: '#ffffff',
  });
  act(sc, 'league', 14, 2.4, 'League desk (register / permits)');
  zone(sc, 'league desk', 14, -0.4, 2, 1, { boss: { x: 14, z: -0.2 } });
  P.counter(lb, -2, 10, 5, 0, '#8d5a3b');
  zone(sc, 'front desk', -2, 9, 2, 1, { boss: { x: -2, z: 9 } });
  // furnishings: chairs at the homework tables, low wall shelves, magazine rack, lamps + side tables in the nook,
  // kids' table and teddy, card catalog, entrance rug, book drop, new-books display, globe, plants, clock, signs
  for (let i = 0; i < 12; i++)
    P.chair(lb, 9 + (i % 6) * 2, i < 6 ? 4.95 : 7.05, i < 6 ? 0 : Math.PI, '#a5673f', 'wood');
  for (const lz of [-4, 4])
    P.shelfUnit(lb, 24.65, lz, { w: 4, h: 1.05, d: 0.4, shelves: 2, rot: -Math.PI / 2, rng });
  P.shelfUnit(lb, -24.65, 2, { w: 4, h: 1.05, d: 0.4, shelves: 2, rot: Math.PI / 2, rng });
  const mrf = P.frame(lb, -24.55, 10.6, Math.PI / 2);
  mrf.box(1.2, 1.2, 0.35, '#8d5a3b', 0, 0, -0.05, 'wood');
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 4; k++)
      mrf.box(0.24, 0.32, 0.02, PAL8[(r * 4 + k) % 8], -0.42 + k * 0.28, 0.15 + r * 0.36, 0.14, 'plain', {
        rx: -0.25,
      });
  mrf.solid(1.2, 0.4);
  P.floorLamp(lb, -21.3, 7.5, '#fff1c9');
  for (const sx2 of [-18.75, -16.25]) {
    P.table(lb, sx2, 7.9, 0.5, 0.5, 0.55, '#8d5a3b');
    P.tableLamp(lb, sx2, 0.55, 7.9);
  }
  P.table(lb, -22.4, -9.2, 1.2, 0.8, 0.5, '#ffbe0b', 0, 'plastic');
  sc.colliders.push({ minX: -23, maxX: -21.8, minZ: -9.6, maxZ: -8.8 });
  for (const [dx, dz, r] of [
    [-0.3, -0.65, 0],
    [0.3, -0.65, 0],
    [-0.3, 0.65, Math.PI],
    [0.3, 0.65, Math.PI],
  ])
    P.chair(
      lb,
      -22.4 + dx,
      -9.2 + dz,
      r,
      ['#e63946', '#3a86ff', '#8ac926', '#8338ec'][Math.round((dx + 0.3) / 0.6) + (dz > 0 ? 2 : 0)],
    );
  for (const [px, py, pz, r, sy] of [
    [0, 0.35, 0, 0.38, 1.1],
    [0, 0.92, 0, 0.26, 1],
    [-0.18, 1.12, 0, 0.09, 1],
    [0.18, 1.12, 0, 0.09, 1],
    [-0.32, 0.5, 0.05, 0.12, 1.4],
    [0.32, 0.5, 0.05, 0.12, 1.4],
  ])
    lb.add(P.ICO, '#a0522d', [-13 + px, py, -10 + pz], [0, 0, 0], [r, r * sy, r], null, 'fabric');
  lb.add(P.ICO, '#f4d6c6', [-13, 0.88, -9.78], [0, 0, 0], [0.11, 0.08, 0.06], null, 'fabric');
  const ccf = P.frame(lb, -7.5, 14.55, Math.PI);
  ccf.box(1.0, 1.2, 0.5, '#8d5a3b', 0, 0, 0, 'wood');
  for (let r = 0; r < 5; r++)
    for (let k = 0; k < 4; k++) {
      ccf.box(0.2, 0.18, 0.02, '#a5673f', -0.36 + k * 0.24, 0.12 + r * 0.21, 0.26, 'wood');
      ccf.box(0.06, 0.02, 0.02, '#d4af37', -0.36 + k * 0.24, 0.2 + r * 0.21, 0.275, 'metal');
    }
  ccf.solid(1.0, 0.5);
  P.rug(lb, 0, 13.6, 3.2, 1.8, '#9d0208', '#e9c46a');
  lb.rbox(0.7, 1.1, 0.6, '#1d4ed8', 3.4, 0, 13.8, { mat: 'metal', collide: true });
  lb.box(0.4, 0.06, 0.02, '#1a1a1a', 3.4, 0.85, 13.49, { mat: 'plastic' });
  P.addSign(lib.contents, 'BOOK DROP', 3.4, 1.35, 13.48, 0.7, 0, { bg: '#1d4ed8', color: '#ffffff' });
  P.table(lb, 6.2, 11.6, 1.6, 0.8, 0.8, '#a5673f');
  sc.colliders.push({ minX: 5.4, maxX: 7.0, minZ: 11.2, maxZ: 12.0 });
  for (let k = 0; k < 5; k++)
    lb.box(0.26, 0.34, 0.05, PAL8[k + 1], 5.65 + k * 0.28, 0.8, 11.6, { mat: 'fabric', rot: [-0.3, 0, 0] });
  P.addSign(lib.contents, 'NEW BOOKS', 6.2, 1.5, 11.25, 1.3, 0, { bg: '#e9c46a', color: '#1d3557' });
  lb.cyl(0.25, 0.3, 0.06, '#8a5a3b', 21.6, 0, 6, { mat: 'wood' });
  lb.cyl(0.04, 0.05, 0.85, '#8a5a3b', 21.6, 0, 6, { mat: 'wood' });
  lb.sphere(0.35, '#3a86ff', 21.6, 1.2, 6, [1, 1, 1], {
    mat: 'plastic',
    shade: (px, py, pz) => (Math.sin(px * 9) + Math.cos(pz * 7) > 0.6 ? '#57cc99' : null),
  });
  sc.colliders.push({ minX: 21.3, maxX: 21.9, minZ: 5.7, maxZ: 6.3 });
  for (const [px, pz] of [
    [-24.2, 14.2],
    [24.2, 14.2],
    [24.2, -14.2],
    [-0.8, -14.3],
  ])
    P.plant(lb, px, pz, 1.4);
  P.wallClock(lb, 10, 3.3, -14.86, 0, 0.35);
  P.addSign(lib.contents, 'SHHH! QUIET PLEASE', 15, 3.3, -14.84, 3.4, 0, { bg: '#2d4a3e', color: '#ffffff' });
  P.addSign(lib.contents, 'FICTION', -4, 2.4, -3.8, 1.4, 0, { bg: '#e63946', color: '#ffffff' });
  P.addSign(lib.contents, 'NON-FICTION', 4, 2.4, -3.8, 1.8, 0, { bg: '#457b9d', color: '#ffffff' });
  for (const sx of [-14, 14]) P.tree(b, sx, 22, 1.2, sx > 0 ? 0 : 2);
  b.box(2.4, 0.08, 10, '#cfcac0', 0, 0, 24, { mat: 'concrete' });
  for (let k = 0; k < 4; k++) b.box(0.08, 0.8, 1.2, '#2f3238', 5 + k * 0.6, 0, 20, { mat: 'metal' });
  act(sc, 'exit', 0, 28, 'Leave the library (Town Map)', {}, 2.6);
  sc.spawn = { x: 0, z: 25, rot: Math.PI };
  sc.grass.push(
    { x: -18, z: 24, w: 28, d: 12 },
    { x: 18, z: 24, w: 28, d: 12 },
    { x: -30, z: 0, w: 8, d: 36 },
    { x: 30, z: 0, w: 8, d: 36 },
  );
  return finish(sc, [{ minX: -6, maxX: 6, minZ: 15, maxZ: 30 }]);
}
