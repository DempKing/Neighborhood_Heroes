// The grocery store.
import { mulberry32 } from '../../game/rng.js';
import { makeArea } from '../buildings.js';
import * as P from '../props.js';
import { act, base, finish, ground, zone } from './common.js';
import { PAL8 } from './school.js';

// ======================================================== GROCERY =======
export function buildGrocery() {
  const sc = base({ minX: -28, maxX: 28, minZ: -18, maxZ: 36 });
  const b = sc.b;
  const rng = mulberry32(13);
  ground(sc, 0, 10, 90, 80);
  b.box(50, 0.06, 26, '#55585e', 0, 0, 22, { mat: 'asphalt' });
  for (let k = 0; k < 9; k++) b.box(0.15, 0.065, 5, '#ffffff', -16 + k * 4, 0.005, 22, { mat: 'plain' });
  P.car(b, -10, 22, 0, '#2a9d8f');
  P.car(b, 6, 22.5, 0, '#ffbe0b');
  P.car(b, 14, 22.5, Math.PI, '#e63946');
  for (let k = 0; k < 4; k++) b.rbox(0.6, 0.9, 1.0, '#c0c7cf', -20 + k * 0.4, 0, 14, { mat: 'metal' });
  P.streetLamp(b, -18, 30);
  P.streetLamp(b, 18, 30);
  const gro = makeArea(sc, {
    id: 'grocery',
    x: 0,
    z: -3,
    w: 40,
    d: 22,
    wallH: 4.5,
    mode: 'cutaway',
    ext: { color: '#f2ede4', mat: 'stucco' },
    int: { color: '#f8f9fa', mat: 'paint' },
    floor: { color: '#f1f1f1', mat: 'tile' },
    doors: [{ side: 'S', at: 0, w: 4, glass: true, h: 3 }],
    windows: { S: [-14, -8, 8, 14] },
    windowW: 4,
    windowH: 2.4,
    windowY: 1.6,
    roof: {
      type: 'flat',
      color: '#8a8f96',
      units: [
        [-10, -3],
        [10, -6],
      ],
    },
  });
  const gb = gro.b;
  b.box(42, 0.25, 3, '#e63946', 0, 3.6, 9.4, {
    mat: 'fabric',
    shade: (x) => (Math.floor((x + 0.5) * 30) % 2 ? '#ffffff' : null),
  });
  P.addSign(sc.group, 'GRUB-N-GO', 0, 5.2, 8.25, 7, 0, { bg: '#e63946', color: '#fff', stroke: '#7a1020' });
  const candy = (r) => ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'][Math.floor(r() * 5)];
  const cereal = (r) => ['#f4a261', '#e9c46a', '#e63946', '#2a9d8f'][Math.floor(r() * 4)];
  P.groceryShelf(gb, -12, -6, 10, rng, candy);
  P.groceryShelf(gb, -4, -6, 10, rng, cereal);
  P.groceryShelf(gb, 4, -6, 10, rng);
  P.groceryShelf(gb, 12, -6, 10, rng);
  P.addSign(gro.contents, 'Candy', -12, 2.6, -11.2, 1.4);
  P.addSign(gro.contents, 'Cereal', -4, 2.6, -11.2, 1.4);
  zone(sc, 'candy aisle', -8, -6, 2, 8);
  zone(sc, 'cereal aisle', 0, -6, 2, 8);
  gb.rbox(1.4, 0.9, 0.8, '#ffffff', 16, 0, 1, { collide: true, mat: 'plastic' });
  gb.box(1.5, 0.05, 0.9, '#e63946', 16, 0.9, 1, { mat: 'fabric' });
  for (let k = 0; k < 6; k++)
    gb.sphere(0.05, '#f4a261', 15.5 + (k % 3) * 0.4, 0.97, 0.8 + Math.floor(k / 3) * 0.3, [1, 0.6, 1], {
      mat: 'plastic',
    });
  act(sc, 'sample', 16, 2.3, 'Free samples!');
  zone(sc, 'free samples', 16, 3, 4, 2, { boss: { x: 17, z: 0.2 } });
  gb.rbox(1.4, 2.0, 1.0, '#06d6a0', 18, 0, 6.5, { collide: true, mat: 'plastic' });
  P.addSign(gro.contents, 'BOTTLE RETURN 5¢', 18, 2.3, 7.05, 1.6, 0, { bg: '#06d6a0', color: '#fff' });
  act(sc, 'recycle', 16.5, 6.8, 'Bottle return machine');
  zone(sc, 'bottle return', 16, 7, 3, 2);
  for (let k = 0; k < 3; k++) {
    P.counter(gb, -6 + k * 5, 4, 2.5, Math.PI / 2, '#adb5bd');
    gb.box(0.3, 1.2, 0.3, '#3a86ff', -6 + k * 5, 1.0, 2.8, { mat: 'glow' });
  }
  act(sc, 'shop', -1, 5.5, 'Checkout (buy stuff)', { shop: 'grocery' });
  zone(sc, 'checkout', -1, 6, 10, 2, { boss: { x: -4, z: 4 } });
  gb.box(3, 2, 0.15, '#c9a227', -16, 0.5, 7.6, { mat: 'wood' });
  for (let k = 0; k < 6; k++)
    gb.box(
      0.4,
      0.5,
      0.02,
      ['#ffffff', '#fff3b0', '#bde0fe'][k % 3],
      -17 + (k % 3) * 0.9,
      1.2 + Math.floor(k / 3) * 0.7,
      7.5,
      { mat: 'plain' },
    );
  P.addSign(gro.contents, 'Community Board', -16, 2.9, 7.5, 2.4, Math.PI);
  act(sc, 'bulletin', -16, 6.4, 'Bulletin board (jobs)');
  // departments: produce along the west wall + an island, freezers along the back, dairy cooler on the east wall,
  // bakery case, aisle endcaps, checkout belts and registers, carts, baskets, gumball machines, signs
  const fruit = [
    ['#e63946', '#8ac926', '#ffca3a'],
    ['#f4a261', '#6a994e', '#9d0208'],
    ['#ffd23f', '#e63946', '#2d6a4f'],
    ['#ff924c', '#8ac926', '#6a4c93'],
  ];
  P.produceStand(gb, -19.4, -8.6, Math.PI / 2, 3, fruit[0], rng);
  P.produceStand(gb, -19.4, -4.6, Math.PI / 2, 3, fruit[1], rng);
  P.produceStand(gb, -16.45, -6.6, Math.PI / 2, 3, fruit[2], rng);
  P.produceStand(gb, -15.55, -6.6, -Math.PI / 2, 3, fruit[3], rng);
  P.addSign(gro.contents, 'Produce', -17.6, 3.0, -10.8, 2.0, 0, { bg: '#2d6a4f', color: '#ffffff' });
  P.freezerCase(gb, 0, -13.45, 0, 16, rng);
  P.addSign(gro.contents, 'Frozen', 0, 3.0, -13.0, 2.0, 0, { bg: '#3a86ff', color: '#ffffff' });
  P.freezerCase(gb, 19.45, -8, -Math.PI / 2, 6, rng, ['#ffffff', '#ffffff', '#fff3b0', '#bde0fe', '#ffafcc']);
  P.addSign(gro.contents, 'Dairy', 19.0, 3.0, -8, 1.6, -Math.PI / 2, { bg: '#ffffff', color: '#1d3557' });
  const bk = P.frame(gb, 14.2, -13.35, 0);
  bk.box(4, 0.8, 0.9, '#8d5a3b', 0, 0, 0, 'wood')
    .box(4, 0.4, 0.9, '#cfe8ff', 0, 0.8, 0, 'glass')
    .solid(4, 0.9);
  for (let k = 0; k < 8; k++)
    bk.ball(0.16, k % 2 ? '#d4a373' : '#c68b59', -1.6 + k * 0.45, 0.92, 0, 'plastic', [1.4, 0.6, 0.8]);
  for (let k = 0; k < 3; k++)
    bk.cyl(0.22, 0.22, 0.2, ['#ffafcc', '#ffffff', '#ffd6a5'][k], -1.2 + k * 1.2, 1.2, -0.25, 'plastic');
  P.addSign(gro.contents, 'Bakery', 14.2, 3.0, -13.2, 1.8, 0, { bg: '#c68b59', color: '#ffffff' });
  P.addSign(gro.contents, 'Snacks', 4, 2.6, -11.2, 1.4);
  P.addSign(gro.contents, 'Drinks', 12, 2.6, -11.2, 1.4);
  for (const ex of [-12, -4, 4, 12]) {
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < 3 - r; k++)
        gb.box(
          0.28,
          0.24,
          0.5,
          PAL8[(Math.abs(ex) + r + k) % 8],
          ex - 0.28 + k * 0.29 + r * 0.145,
          r * 0.24,
          -0.62,
          { mat: 'plastic' },
        );
    sc.colliders.push({ minX: ex - 0.45, maxX: ex + 0.45, minZ: -0.9, maxZ: -0.35 });
  }
  for (let k = 0; k < 3; k++) {
    const cx = -6 + k * 5;
    gb.box(0.5, 0.02, 1.6, '#1a1a1a', cx, 1.07, 3.55, { mat: 'rubber' });
    gb.box(0.36, 0.22, 0.3, '#2b2d42', cx + 0.12, 1.07, 4.75, { mat: 'plastic' });
    gb.box(0.3, 0.22, 0.03, '#4cc9f0', cx + 0.18, 1.32, 4.75, { mat: 'glow', rot: [0, Math.PI / 2, 0] });
    gb.box(0.4, 0.15, 0.3, '#ffffff', cx - 0.1, 1.07, 5.05, { mat: 'fabric' });
    const ir = P.frame(gb, cx, 2.35, 0);
    ir.box(0.6, 1.1, 0.3, '#adb5bd', 0, 0, 0, 'metal');
    for (let r = 0; r < 3; r++)
      for (let q = 0; q < 3; q++)
        ir.box(
          0.14,
          0.18,
          0.05,
          PAL8[(r * 3 + q + k) % 8],
          -0.18 + q * 0.18,
          0.15 + r * 0.32,
          0.16,
          'plastic',
        );
    ir.solid(0.6, 0.3);
  }
  for (let k = 0; k < 4; k++) P.shoppingCart(gb, 7.6 + k * 0.32, 6.7, Math.PI / 2);
  sc.colliders.push({ minX: 7.15, maxX: 9.35, minZ: 6.25, maxZ: 7.15 });
  for (let k = 0; k < 4; k++)
    gb.box(0.5, 0.12, 0.34, '#e63946', 3.0, k * 0.12, 7.3, {
      mat: 'plastic',
      shade: (px, py) => (py > 0.3 ? '#c1121f' : null),
    });
  for (const gx of [-2.9, -3.45]) {
    gb.cyl(0.12, 0.16, 0.9, '#c1121f', gx, 0, 7.4, { mat: 'metal' });
    gb.sphere(0.2, '#cfe8ff', gx, 1.1, 7.4, [1, 1, 1], { mat: 'glass' });
    for (let q = 0; q < 5; q++)
      gb.add(
        P.ICO,
        PAL8[q],
        [gx - 0.08 + (q % 3) * 0.08, 1.02 + Math.floor(q / 3) * 0.09, 7.4],
        [0, 0, 0],
        [0.04, 0.04, 0.04],
        null,
        'plastic',
      );
  }
  sc.colliders.push({ minX: -3.65, maxX: -2.7, minZ: 7.2, maxZ: 7.6 });
  P.rug(gb, 0, 6.9, 3.4, 1.4, '#3d405b', '#2b2d42');
  act(sc, 'exit', 0, 33, 'Leave (Town Map)', {}, 2.6);
  sc.spawn = { x: 0, z: 30, rot: Math.PI };
  sc.grass.push({ x: -26, z: 10, w: 6, d: 40 }, { x: 26, z: 10, w: 6, d: 40 });
  return finish(sc);
}
