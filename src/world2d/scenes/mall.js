// The mall.
import { mulberry32 } from '../../game/rng.js';
import { shade, TORUS } from '../build.js';
import { makeArea, wallPicture } from '../buildings.js';
import * as P from '../props.js';
import { posterTexture } from '../textures.js';
import { act, base, finish, ground, zone } from './common.js';
import { PAL8 } from './school.js';

// ======================================================== MALL ==========
export function buildMall() {
  const sc = base({ minX: -98, maxX: 56, minZ: -22, maxZ: 26 });
  const b = sc.b;
  const rng = mulberry32(5);
  ground(sc, -20, 0, 170, 70);
  b.box(42, 0.06, 46, '#55585e', -77, 0, 0, { mat: 'asphalt' });
  for (let i = 0; i < 9; i++) b.box(0.15, 0.065, 5, '#ffffff', -92 + i * 4, 0.005, -12, { mat: 'plain' });
  for (let i = 0; i < 9; i++) b.box(0.15, 0.065, 5, '#ffffff', -92 + i * 4, 0.005, 12, { mat: 'plain' });
  [
    ['#e63946', -90, -12],
    ['#457b9d', -82, 12],
    ['#f4a261', -74, -12],
    ['#2a9d8f', -86, 12],
    ['#ffffff', -66, -12],
  ].forEach(([c, x, z]) => P.car(b, x, z, 0, c));
  for (const z of [-20, 20]) for (let k = 0; k < 4; k++) P.streetLamp(b, -94 + k * 12, z);
  const mall = makeArea(sc, {
    id: 'mall',
    x: 0,
    z: 1,
    w: 108,
    d: 38,
    wallH: 4.2,
    mode: 'cutaway',
    ext: { color: '#e8dcc6', mat: 'stucco' },
    int: { color: '#f4efe6', mat: 'paint' },
    floor: { color: '#efe9de', mat: 'tile' },
    doors: [{ side: 'W', at: -1, w: 5, glass: true, h: 3.2 }],
    windows: { W: [-12, 10] },
    windowW: 3,
    windowH: 2.2,
    windowY: 1.8,
    roof: {
      type: 'flat',
      color: '#9aa0a6',
      skylights: [
        [-30, 0, 16, 6],
        [0, 0, 16, 6],
        [30, 0, 16, 6],
      ],
      units: [
        [-40, -12],
        [20, 14],
      ],
    },
  });
  const mb = mall.b;
  P.addSign(sc.group, 'SUNCREST MALL', -54.4, 5.0, 1, 9, -Math.PI / 2, {
    bg: '#e63946',
    color: '#ffffff',
    stroke: '#7a1020',
  });
  const stores = [
    ['sporting goods', -40, 16, 'Sporting Goods', '#2a9d8f'],
    ['game shop', -22, 14, 'Level Up Games', '#8338ec'],
    ['shoe store', -6, 12, 'Sole Patrol', '#e76f51'],
    ['dollar store', 8, 12, 'Dollar Dreams', '#ffbe0b'],
    ['pet store', 22, 12, 'Pawsome Pets', '#06d6a0'],
    ['arcade', 40, 16, 'ARCADE', '#ff006e'],
  ];
  for (const [id, x, w, label, color] of stores) {
    // store walls (side partitions + back), glass storefront with an opening
    mb.box(0.2, 3.2, 12, '#f4efe6', x - w / 2, 0, -11, { mat: 'paint', collide: true });
    mb.box(0.2, 3.2, 12, '#f4efe6', x + w / 2, 0, -11, { mat: 'paint', collide: true });
    mb.box(w, 0.06, 12, shade(color, 1.5), x, 0.01, -11, { mat: id === 'arcade' ? 'carpet' : 'wood' });
    for (const sd of [-1, 1])
      mb.box(w / 2 - 2, 2.8, 0.08, '#cfe8ff', x + sd * (w / 4 + 1), 0, -5.05, { mat: 'glass' });
    for (const sd of [-1, 1])
      sc.colliders.push({
        minX: x + sd * 2 - (sd > 0 ? 0 : w / 2 - 2),
        maxX: x + sd * 2 + (sd > 0 ? w / 2 - 2 : 0),
        minZ: -5.2,
        maxZ: -4.9,
      });
    mb.box(w, 0.6, 0.3, color, x, 2.9, -5.05, { mat: 'paint' });
    P.addSign(mall.contents, label, x, 3.2, -4.85, Math.min(w - 2, 5.5), 0, {
      bg: color,
      color: '#ffffff',
      border: '#ffffff',
    });
    zone(sc, id, x, -11, w - 3, 8);
    if (id !== 'arcade') {
      P.counter(mb, x + w / 2 - 3, -14, 3.2, 0, shade(color, 0.9));
      act(sc, 'shop', x + w / 2 - 3, -12.6, `Shop: ${label}`, { shop: id });
      const fill = {
        'sporting goods': 'toys',
        'game shop': 'products',
        'shoe store': 'shoes',
        'dollar store': 'products',
        'pet store': 'products',
      }[id];
      for (let k = 0; k < 2; k++)
        P.shelfUnit(mb, x - w / 2 + 2.5 + k * 3.5, -16.55, {
          w: 3,
          h: 2.0,
          d: 0.5,
          fill,
          rng,
          color: shade(color, 0.7),
        });
      if (id === 'sporting goods')
        for (let k = 0; k < 6; k++)
          mb.sphere(0.12, ['#e8742b', '#ffffff', '#8b4a24'][k % 3], x - 4 + k * 0.6, 1.1, -12, [1, 1, 1], {
            mat: 'rubber',
          });
    } else {
      for (let k = 0; k < 5; k++) {
        mb.rbox(
          0.95,
          1.95,
          0.85,
          ['#3a0ca3', '#f72585', '#4361ee', '#7209b7', '#4cc9f0'][k],
          x - 6 + k * 2.4,
          0,
          -15.9,
          { collide: true, mat: 'plastic' },
        );
        mb.box(0.75, 0.55, 0.04, '#80ffdb', x - 6 + k * 2.4, 1.3, -15.45, { mat: 'glow' });
      }
      mb.rbox(1.4, 2.2, 1.4, '#ffd60a', x + 5, 0, -9, { collide: true, mat: 'plastic' });
      mb.box(1.2, 1.0, 1.2, '#cfeeff', x + 5, 1.15, -9, { mat: 'glass' });
      for (let k = 0; k < 6; k++)
        mb.sphere(
          0.13,
          ['#ff006e', '#ffbe0b', '#3a86ff'][k % 3],
          x + 4.7 + (k % 3) * 0.25,
          1.25,
          -9.2 + Math.floor(k / 3) * 0.3,
          [1, 1, 1],
          { mat: 'fabric' },
        );
      act(sc, 'claw', x + 5, -7.6, 'Claw machine (50¢)');
    }
    // per-store fixtures (kept clear of the entrance x-2..x+2 and the walk to the counter)
    const L = x - w / 2 + 0.1;
    const R = x + w / 2 - 0.1; // inside faces of the partitions
    if (id === 'sporting goods') {
      P.table(mb, x - 2.5, -12, 3.8, 0.8, 0.98, '#c9a227');
      mb.colliders.push({ minX: x - 4.4, maxX: x - 0.6, minZ: -12.4, maxZ: -11.6 });
      P.clothesRack(mb, x - 5.2, -9.0, 0, 1.8, rng, ['#e63946', '#1d3557', '#2a9d8f', '#ffbe0b', '#ffffff']);
      mb.cyl(0.3, 0.28, 0.7, '#8d5a3b', L + 0.45, 0, -12.6, { mat: 'wood', collide: true });
      for (let k = 0; k < 5; k++)
        mb.cyl(
          0.035,
          0.05,
          0.95,
          ['#c9a227', '#a0522d', '#d4a373'][k % 3],
          L + 0.35 + (k % 3) * 0.1,
          0.5,
          -12.7 + Math.floor(k / 3) * 0.18,
          { mat: 'wood' },
        );
      P.ballCart(mb, x - 1.2, -8.6, 0);
      P.bike(mb, R - 0.8, -8.6, Math.PI / 2, '#3a86ff');
      P.mannequin(mb, x - 4.5, -5.75, 0, '#2a9d8f', '#1d3557');
      P.mannequin(mb, x + 4.5, -5.75, 0, '#e63946', '#ffffff');
      const hf = P.frame(mb, L, -10.5, Math.PI / 2);
      hf.box(1.0, 0.7, 0.04, '#ffffff', 0, 2.1, 0.02, 'plastic');
      mb.add(TORUS, '#ff6b00', [L + 0.35, 2.15, -10.5], [Math.PI / 2, 0, 0], [0.2, 0.2, 0.15], null, 'metal');
    } else if (id === 'game shop') {
      const tvf = P.frame(mb, x - 4.5, -10.8, 0);
      tvf
        .box(1.6, 0.7, 0.5, '#2b2d42', 0, 0, 0, 'wood')
        .box(1.5, 0.85, 0.06, '#111111', 0, 0.95, -0.1, 'plastic')
        .box(1.4, 0.75, 0.01, '#80ffdb', 0, 1.0, -0.065, 'glow');
      tvf
        .box(0.36, 0.07, 0.25, '#f4f1ea', 0.45, 0.7, 0.05, 'plastic')
        .rbox(0.18, 0.05, 0.11, '#e63946', -0.3, 0.7, 0.12, 'plastic')
        .rbox(0.18, 0.05, 0.11, '#3a86ff', 0.0, 0.7, 0.12, 'plastic')
        .solid(1.6, 0.5);
      P.armchair(mb, x - 4.5, -9.3, Math.PI, '#8338ec');
      for (const dz of [-12.6, -8.6]) {
        P.table(mb, x - 1.6, dz, 1.6, 0.8, 0.8, '#3d405b');
        mb.colliders.push({ minX: x - 2.4, maxX: x - 0.8, minZ: dz - 0.4, maxZ: dz + 0.4 });
        for (let k = 0; k < 8; k++)
          mb.box(
            0.14,
            0.2,
            0.03,
            PAL8[(k + Math.abs(Math.round(dz))) % 8],
            x - 2.2 + (k % 4) * 0.4,
            0.8,
            dz - 0.15 + Math.floor(k / 4) * 0.3,
            { mat: 'plastic', rot: [-0.4, 0, 0] },
          );
      }
      P.plinth(mb, x + 4.4, -5.8, 0.8, 0.9, '#2b2d42');
      mb.box(0.7, 0.6, 0.7, '#cfe8ff', x + 4.4, 0.96, -5.8, { mat: 'glass' });
      mb.box(0.36, 0.08, 0.26, '#f4f1ea', x + 4.4, 0.96, -5.8, { mat: 'plastic' });
      wallPicture(mall.contents, posterTexture(81), L + 0.02, 2.0, -9.5, 1.1, 1.1, Math.PI / 2);
    } else if (id === 'shoe store') {
      P.shelfUnit(mb, L + 0.25, -11, {
        w: 3,
        h: 1.8,
        d: 0.4,
        rot: Math.PI / 2,
        fill: 'shoes',
        rng,
        color: '#f4f1ea',
      });
      for (const dz of [-10.6, -8.4]) {
        mb.rbox(1.6, 0.45, 0.5, '#2b2d42', x - 2.2, 0, dz, { mat: 'fabric', collide: true });
      }
      mb.box(0.3, 0.03, 0.12, '#1d3557', x - 2.2, 0, -9.5, { mat: 'metal' });
      const mf = P.frame(mb, L + 0.08, -7.0, Math.PI / 2);
      mf.box(0.6, 1.6, 0.04, '#8d5a3b', 0, 0.1, 0.02, 'wood').box(
        0.5,
        1.5,
        0.01,
        '#e6f4ff',
        0,
        0.15,
        0.045,
        'glass',
      );
      for (let k = 0; k < 6; k++)
        mb.box(0.36, 0.2, 0.26, ['#e76f51', '#ffffff', '#264653'][k % 3], x + 5.0, k * 0.2, -16.6, {
          mat: 'plastic',
        });
      for (const sd of [-1, 1]) {
        P.plinth(mb, x + sd * 4, -5.75, 0.6, 0.8);
        mb.box(0.12, 0.1, 0.28, sd > 0 ? '#e63946' : '#3a86ff', x + sd * 4 - 0.08, 0.86, -5.75, {
          mat: 'shoe',
        });
        mb.box(0.12, 0.1, 0.28, sd > 0 ? '#e63946' : '#3a86ff', x + sd * 4 + 0.08, 0.86, -5.7, {
          mat: 'shoe',
        });
      }
    } else if (id === 'dollar store') {
      P.groceryShelf(mb, x - 3.5, -11, 4, rng);
      for (const bx of [x - 4.5, x - 2.8]) {
        mb.rbox(1.2, 0.6, 0.8, '#ffbe0b', bx, 0, -7.6, { mat: 'plastic', collide: true });
        for (let k = 0; k < 8; k++)
          mb.box(
            0.18,
            0.12,
            0.18,
            PAL8[(k * 3 + Math.round(bx)) % 8],
            bx - 0.4 + (k % 4) * 0.27,
            0.6,
            -7.8 + Math.floor(k / 4) * 0.35,
            { mat: 'plastic', rot: [0, k, 0] },
          );
      }
      for (let k = 0; k < 4; k++) {
        const by = 2.2 + (k % 2) * 0.3;
        mb.box(0.006, by - 1.05, 0.006, '#ffffff', R - 0.5 + k * 0.08, 1.05, -13.3 + (k % 2) * 0.12, {
          mat: 'plain',
        });
        mb.add(
          P.ICO,
          ['#ff006e', '#3a86ff', '#ffbe0b', '#06d6a0'][k],
          [R - 0.5 + k * 0.08, by + 0.2, -13.3 + (k % 2) * 0.12],
          [0, 0, 0],
          [0.17, 0.21, 0.17],
          null,
          'plastic',
        );
      }
      P.addSign(mall.contents, 'EVERYTHING $1!', x - 2, 2.6, -17.8, 3, 0, {
        bg: '#ffbe0b',
        color: '#1d3557',
      });
    } else if (id === 'pet store') {
      P.fishTank(mb, L + 0.3, -10.0, Math.PI / 2, 1.6, rng);
      P.fishTank(mb, L + 0.3, -12.4, Math.PI / 2, 1.6, rng);
      P.table(mb, x - 2, -11.5, 1.2, 0.7, 0.8, '#8d5a3b');
      mb.colliders.push({ minX: x - 2.6, maxX: x - 1.4, minZ: -11.85, maxZ: -11.15 });
      mb.box(0.9, 0.5, 0.5, '#cfe8ff', x - 2, 0.8, -11.5, { mat: 'glass' });
      mb.box(0.86, 0.06, 0.46, '#e9c46a', x - 2, 0.8, -11.5, { mat: 'dirt' });
      mb.add(TORUS, '#ff7b00', [x - 1.75, 1.05, -11.5], [0, 0, 0], [0.16, 0.16, 0.2], null, 'plastic');
      mb.add(P.ICO, '#d4a373', [x - 2.25, 0.92, -11.45], [0, 0, 0], [0.07, 0.06, 0.09], null, 'fabric');
      for (let k = 0; k < 3; k++)
        mb.rbox(0.5, 0.16, 0.7, ['#e63946', '#2a9d8f', '#f4a261'][k], L + 1.0, k * 0.16, -7.2, {
          mat: 'fabric',
        });
      mb.cyl(0.45, 0.45, 0.14, '#8d5a3b', x - 3, 0, -8.2, { mat: 'fabric' });
      mb.cyl(0.33, 0.33, 0.15, '#f4d6c6', x - 3, 0.02, -8.2, { mat: 'fabric' });
      mb.cyl(0.03, 0.03, 1.5, '#9aa0a6', R - 0.5, 0, -9.0, { mat: 'metal' });
      mb.cyl(0.3, 0.3, 0.6, '#cfe8ff', R - 0.5, 1.5, -9.0, { mat: 'glass' });
      mb.cone(0.32, 0.25, '#d4af37', R - 0.5, 2.1, -9.0, { mat: 'metal' });
      mb.add(P.ICO, '#06d6a0', [R - 0.5, 1.75, -9.0], [0, 0, 0], [0.08, 0.1, 0.07], null, 'plastic');
    } else {
      P.airHockey(mb, x - 2.5, -10.8, 0);
      for (const lx2 of [L + 0.95, L + 2.05]) P.skeeBall(mb, lx2, -12.0);
      const pf = P.frame(mb, R - 0.55, -13, -Math.PI / 2);
      pf.box(3, 1.0, 0.8, '#3d405b', 0, 0, 0, 'wood')
        .box(2.9, 0.4, 0.75, '#cfe8ff', 0, 1.0, 0, 'glass')
        .solid(3, 0.8);
      for (let k = 0; k < 10; k++) pf.ball(0.13, PAL8[k % 8], -1.25 + k * 0.28, 1.15, 0, 'fabric');
      P.shelfUnit(mb, R - 0.08 - 0.01, -13, {
        w: 3,
        h: 2.2,
        d: 0.18,
        shelves: 3,
        rot: -Math.PI / 2,
        fill: 'toys',
        rng,
        solid: false,
        color: '#ff006e',
      });
      mb.box(0.6, 1.5, 0.5, '#2b2d42', R - 0.3, 0, -6.4, { mat: 'metal', collide: true });
      mb.box(0.02, 0.3, 0.3, '#ffd60a', R - 0.56, 1.0, -6.4, { mat: 'glow' });
      for (const sx of [L, R])
        mb.box(0.03, 0.08, 11, '#ff006e', sx + (sx === L ? 0.02 : -0.02), 2.75, -11, { mat: 'glow' });
    }
  }
  // food court
  mb.box(40, 0.06, 13, '#e8e3d8', -25, 0.01, 12.5, { mat: 'checker' });
  P.addSign(mall.contents, 'FOOD COURT', -25, 3.4, 5.6, 4, Math.PI, { bg: '#e63946', color: '#fff' });
  for (let k = 0; k < 6; k++) P.lunchTable(mb, -38 + (k % 3) * 9, 10 + Math.floor(k / 3) * 5, '#f4a261');
  P.counter(mb, -25, 18, 8, 0, '#e63946');
  mb.box(8, 1.2, 0.2, '#ffd166', -25, 2.2, 19.4, { mat: 'paint' });
  act(sc, 'shop', -25, 16.5, 'Pizza Palace (food court)', { shop: 'food court' });
  zone(sc, 'food court', -25, 12, 34, 9, {
    seats: Array.from({ length: 24 }, (_, i) => ({
      x: -39 + (i % 12) * 1.0 + Math.floor((i % 12) / 4) * 5.8,
      z: 10 + Math.floor(i / 12) * 5 + 0.85,
      rot: Math.PI,
    })),
  });
  P.fountain(mb, 12, 0);
  zone(sc, 'fountain', 12, 0, 10, 8);
  act(sc, 'fountain', 12, 2.8, 'Fountain (fish for coins?)');
  for (let k = 0; k < 4; k++) P.bench(mb, -8 + k * 10, 4.2, Math.PI);
  for (let k = 0; k < 6; k++) {
    mb.cyl(0.45, 0.55, 0.7, '#c9b79c', -48 + k * 18, 0, -4.2, { mat: 'concrete' });
    P.bush(mb, -48 + k * 18, -4.2, 0.7, '#2d6a4f');
  }
  // commons: kiosks, directory, trash cans by the benches; two more food stalls and a condiment station
  P.kiosk(mb, -30, 0.6, 0, '#3a86ff', rng);
  P.kiosk(mb, 29, 0.6, 0, '#ff006e', rng);
  P.addSign(mall.contents, 'PHONE CASES', -30, 2.9, 0.6, 1.8, 0, { bg: '#3a86ff', color: '#ffffff' });
  P.addSign(mall.contents, 'PRETZELS', 29, 2.9, 0.6, 1.6, 0, { bg: '#ff006e', color: '#ffffff' });
  const dirf = P.frame(mb, -50.5, -3.6, -Math.PI / 2);
  dirf
    .box(1.1, 1.8, 0.2, '#2b2d42', 0, 0, 0, 'metal')
    .box(0.9, 1.2, 0.01, '#f4f1ea', 0, 0.45, -0.105, 'plain', { ry: Math.PI });
  for (let k = 0; k < 6; k++)
    dirf.box(
      0.36,
      0.12,
      0.012,
      PAL8[k],
      -0.2 + (k % 2) * 0.4,
      0.6 + Math.floor(k / 2) * 0.32,
      -0.11,
      'plain',
    );
  dirf.solid(1.1, 0.2);
  for (let k = 0; k < 4; k++) {
    P.trashCan(mb, -6.7 + k * 10, 4.6, '#6c757d');
    sc.colliders.push({ minX: -6.95 + k * 10, maxX: -6.45 + k * 10, minZ: 4.35, maxZ: 4.85 });
  }
  for (const [fx, label, c] of [
    [-38, 'BURGER BARN', '#c1121f'],
    [-12, 'TACO TOWN', '#2a9d8f'],
  ]) {
    P.counter(mb, fx, 18, 6, 0, c);
    mb.box(6, 1.2, 0.2, shade(c, 1.3), fx, 2.2, 19.4, { mat: 'paint' });
    P.addSign(mall.contents, label, fx, 3.0, 19.25, 3.6, Math.PI, { bg: c, color: '#ffffff' });
    for (let k = 0; k < 4; k++)
      mb.box(0.5, 0.25, 0.4, ['#e9c46a', '#f4a261', '#ffffff', '#8ac926'][k], fx - 2 + k * 1.3, 1.07, 18.1, {
        mat: 'plastic',
      });
    mb.box(0.8, 0.9, 0.5, '#adb5bd', fx + 2.2, 0, 19.1, { mat: 'metal' });
  }
  P.table(mb, -6.6, 12, 0.6, 1.4, 0.9, '#adb5bd', 0, 'metal');
  sc.colliders.push({ minX: -6.9, maxX: -6.3, minZ: 11.3, maxZ: 12.7 });
  for (let k = 0; k < 4; k++)
    mb.cyl(0.05, 0.05, 0.18, ['#e63946', '#ffd60a', '#ffffff', '#6c757d'][k], -6.6, 0.9, 11.5 + k * 0.3, {
      mat: 'plastic',
    });
  for (const tz of [8, 16]) {
    P.trashCan(mb, -6.6, tz, '#6c757d');
    sc.colliders.push({ minX: -6.85, maxX: -6.35, minZ: tz - 0.25, maxZ: tz + 0.25 });
  }
  act(sc, 'exit', -66, 3, 'Leave the mall (Town Map)', {}, 2.6);
  sc.spawn = { x: -62, z: 0, rot: Math.PI / 2 };
  sc.grass.push({ x: -20, z: -24, w: 150, d: 6 }, { x: -20, z: 25, w: 150, d: 4 });
  return finish(sc);
}
