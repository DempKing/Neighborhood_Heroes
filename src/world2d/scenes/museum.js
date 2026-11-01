// The museum.
import { mulberry32 } from '../../game/rng.js';
import { CYL, TORUS } from '../build.js';
import { makeArea, wallPicture } from '../buildings.js';
import * as P from '../props.js';
import { posterTexture } from '../textures.js';
import { act, base, finish, ground, portico, zone } from './common.js';
import { PAL8 } from './school.js';

// ======================================================== MUSEUM ========
export function buildMuseum() {
  const sc = base({ minX: -40, maxX: 40, minZ: -20, maxZ: 34 });
  const b = sc.b;
  ground(sc, 0, 6, 110, 70);
  const mus = makeArea(sc, {
    id: 'museum',
    x: 0,
    z: 0,
    w: 60,
    d: 30,
    wallH: 6,
    mode: 'cutaway',
    ext: { color: '#f1ede4', mat: 'stucco' },
    int: { color: '#efe9e1', mat: 'paint' },
    floor: { color: '#e3d5ca', mat: 'tile' },
    doors: [{ side: 'S', at: 0, w: 4, glass: true, h: 3.4 }],
    windows: { S: [-22, -14, 14, 22] },
    windowH: 3,
    windowW: 1.6,
    windowY: 2.8,
    roof: {
      type: 'flat',
      color: '#cfcac0',
      skylights: [
        [-15, 0, 12, 8],
        [15, 0, 12, 8],
      ],
    },
    trim: '#d4c9b5',
  });
  const mb = mus.b;
  portico(b, 0, 16.8, 14, 6, 4.5, '#f4f1ea', 1);
  P.addSign(sc.group, 'MUSEUM OF NEAT STUFF', 0, 5.8, 16.85, 7, 0, { bg: '#1d3557', color: '#ffd166' });
  for (const sx of [-10, 10]) {
    b.box(1.6, 4, 0.04, sx < 0 ? '#e63946' : '#3a86ff', sx, 1.5, 15.2, { mat: 'fabric' });
  }
  P.dinoSkeleton(mb, -15, -6);
  P.addSign(mus.contents, 'DINOSAUR HALL', -15, 4.4, -14.75, 4);
  zone(sc, 'dinosaur hall', -15, -2, 14, 6);
  act(sc, 'trivia', -9, -1.5, 'Dino trivia plaque');
  for (const [x, y, z, r, c, ring] of [
    [10, 3.5, -8, 1.0, '#f4a261', false],
    [15, 4.2, -9, 1.6, '#e9c46a', true],
    [20, 3.2, -7, 0.7, '#2a9d8f', false],
    [24, 3.8, -9, 1.2, '#e76f51', false],
  ]) {
    P.planet(mb, x, y, z, r, c, ring);
    mb.box(0.03, 6 - y, 0.03, '#999', x, y + r, z, { mat: 'metal' });
  }
  P.addSign(mus.contents, 'SPACE WING', 17, 4.4, -14.75, 3.4);
  zone(sc, 'space wing', 17, -4, 12, 6);
  for (let k = 0; k < 4; k++) {
    mb.rbox(1.6, 0.9, 0.9, '#6c757d', 11 + k * 3, 0, 9, { collide: true, mat: 'wood' });
    mb.box(1.5, 0.8, 0.8, '#b7e4c7', 11 + k * 3, 0.9, 9, { mat: 'glass' });
    mb.sphere(0.12, '#2b2d42', 11 + k * 3, 1.2, 9, [1.5, 0.6, 1], { mat: 'plastic' });
  }
  P.addSign(mus.contents, 'BUG ZOO', 16, 2.4, 11, 2.4, Math.PI);
  zone(sc, 'bug zoo', 16, 6, 12, 3);
  P.counter(mb, -18, 10, 6, 0, '#9d4edd');
  act(sc, 'shop', -18, 8.6, 'Museum Gift Shop', { shop: 'gift shop' });
  zone(sc, 'gift shop', -18, 7, 10, 3);
  // exhibits: ropes + plaques round the dino, fossil plinths, a rocket, astronaut, meteorite and telescope in the
  // space wing, a painting gallery with benches, bug zoo plaques, gift shop shelves, ticket desk, plants and bins
  P.ropeLine(
    mb,
    [
      [-20.2, -8.3],
      [-9.8, -8.3],
      [-9.8, -3.7],
      [-20.2, -3.7],
    ],
    true,
  );
  sc.colliders.push({ minX: -20.25, maxX: -9.75, minZ: -8.35, maxZ: -3.65 });
  P.infoPlaque(mb, -12.4, -3.1, 0);
  P.infoPlaque(mb, -17.6, -3.1, 0, '#6a4c93');
  const fossil = (fx, fz, kind) => {
    P.plinth(mb, fx, fz, 0.9, 1.0, '#e9e4dc');
    mb.box(0.8, 0.7, 0.8, '#cfe8ff', fx, 1.06, fz, { mat: 'glass' });
    if (kind === 0) {
      mb.add(P.ICO, '#efe6cc', [fx, 1.3, fz], [0, 0.4, 0], [0.32, 0.2, 0.2], null, 'plastic');
      mb.box(0.3, 0.06, 0.16, '#efe6cc', fx + 0.18, 1.12, fz, { mat: 'plastic' });
    } else if (kind === 1) {
      mb.cyl(0.3, 0.3, 0.08, '#a5673f', fx, 1.06, fz, { mat: 'dirt' });
      for (let k = 0; k < 3; k++)
        mb.add(
          P.ICO,
          '#f4f1de',
          [fx - 0.12 + k * 0.12, 1.24, fz + (k % 2) * 0.08],
          [0, 0, 0],
          [0.09, 0.13, 0.09],
          null,
          'plastic',
        );
    } else {
      mb.add(TORUS, '#c9a66b', [fx, 1.3, fz], [0, 0, 0], [0.2, 0.2, 0.4], null, 'plastic');
      mb.add(TORUS, '#b08d57', [fx + 0.05, 1.3, fz], [0, 0, 0], [0.1, 0.1, 0.5], null, 'plastic');
    }
    P.infoPlaque(mb, fx + 0.9, fz, Math.PI / 2, '#5a6370');
  };
  fossil(-27.5, -10, 0);
  fossil(-27.5, -6, 1);
  fossil(-27.5, -2, 2);
  const panel = P.frame(mb, -6.5, -14.88, 0);
  panel.box(4, 2.2, 0.06, '#5a6370', 0, 1.2, 0.03, 'stucco');
  for (let k = 0; k < 7; k++)
    panel.box(
      0.5 - (k % 3) * 0.1,
      0.1,
      0.04,
      '#efe6cc',
      -1.4 + k * 0.45,
      1.6 + Math.sin(k) * 0.5,
      0.08,
      'plastic',
      { center: true, rz: k * 0.7 },
    );
  panel.ball(0.35, '#efe6cc', 1.2, 2.6, 0.1, 'plastic', [1.3, 0.8, 0.3]);
  const rk = P.frame(mb, 26.5, -11.5, 0);
  rk.cyl(1.2, 1.3, 0.3, '#5a6370', 0, 0, 0, 'stucco')
    .cyl(0.5, 0.5, 3.6, '#f4f1ea', 0, 0.3, 0, 'metal')
    .cone(0.5, 1.1, '#e63946', 0, 3.9, 0, 'metal');
  for (let k = 0; k < 3; k++) {
    const a = k * 2.094;
    rk.box(0.06, 0.9, 0.6, '#e63946', Math.cos(a) * 0.55, 0.3, Math.sin(a) * 0.55, 'metal', {
      ry: -a + Math.PI / 2,
    });
  }
  rk.hcyl(0.14, 0.06, '#1d2733', 0, 2.8, 0.5, 'z', 'glass')
    .cyl(0.35, 0.25, 0.3, '#3d405b', 0, 0.3, 0, 'metal')
    .solid(2.6, 2.6);
  P.plinth(mb, 7.5, -12.8, 1.0, 0.5, '#2b2d42');
  const as = P.frame(mb, 7.5, -12.8, 0);
  for (const sd of [-0.12, 0.12]) as.rbox(0.18, 0.75, 0.22, '#f4f1ea', sd, 0.56, 0, 'fabric');
  as.rbox(0.5, 0.65, 0.34, '#f4f1ea', 0, 1.3, 0, 'fabric').rbox(
    0.36,
    0.42,
    0.18,
    '#d0d7df',
    0,
    1.35,
    -0.25,
    'metal',
  );
  for (const sd of [-1, 1]) as.rbox(0.14, 0.55, 0.16, '#f4f1ea', sd * 0.34, 1.35, 0, 'fabric');
  as.ball(0.26, '#f4f1ea', 0, 2.15, 0, 'plastic')
    .ball(0.2, '#e0b84a', 0, 2.15, 0.1, 'metal', [1, 0.85, 0.6])
    .box(0.12, 0.1, 0.02, '#e63946', -0.12, 1.5, 0.17, 'plain');
  P.infoPlaque(mb, 8.9, -12.4, 0);
  P.plinth(mb, 14, -3.6, 0.8, 0.8, '#2b2d42');
  mb.add(P.ICO, '#4a4e57', [14, 1.1, -3.6], [0.4, 0.7, 0], [0.32, 0.24, 0.28], null, 'concrete');
  P.ropeLine(mb, [
    [13, -2.6],
    [15, -2.6],
  ]);
  P.infoPlaque(mb, 15.6, -2.8, 0);
  const tsf = P.frame(mb, 23.5, -3.2, 0);
  for (let k = 0; k < 3; k++) {
    const a = k * 2.094;
    tsf.box(0.04, 1.3, 0.04, '#2b2b2f', Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3, 'metal', {
      rx: Math.sin(a) * 0.2,
      rz: -Math.cos(a) * 0.2,
    });
  }
  tsf
    .hcyl(0.12, 1.2, '#f4f1ea', 0, 1.45, 0, 'x', 'metal')
    .hcyl(0.14, 0.1, '#2b2b2f', 0.6, 1.45, 0, 'x', 'metal');
  for (let k = 0; k < 3; k++)
    wallPicture(mus.contents, posterTexture(90 + k, 'art'), -4 + k * 4, 2.6, -14.86, 2.0, 1.6, 0);
  for (let k = 0; k < 3; k++) mb.box(2.3, 2.0, 0.06, '#d4af37', -4 + k * 4, 1.6, -14.9, { mat: 'metal' });
  P.ropeLine(mb, [
    [-6, -13.6],
    [-2, -13.6],
    [2, -13.6],
    [6, -13.6],
  ]);
  for (const bx of [-3, 3]) {
    mb.rbox(2.0, 0.42, 0.55, '#3d405b', bx, 0, -9.0, { mat: 'fabric', collide: true });
  }
  for (let k = 0; k < 4; k++) P.infoPlaque(mb, 11 + k * 3, 7.9, Math.PI, '#2d6a4f');
  const bf = P.frame(mb, 29.88, 9, -Math.PI / 2);
  bf.box(2.0, 1.4, 0.05, '#6d4630', 0, 1.6, 0.025, 'wood').box(
    1.85,
    1.25,
    0.01,
    '#fdf6e3',
    0,
    1.675,
    0.055,
    'plain',
  );
  for (let k = 0; k < 9; k++) {
    const px = -0.7 + (k % 3) * 0.7;
    const py = 1.95 + Math.floor(k / 3) * 0.38;
    bf.box(0.24, 0.14, 0.01, PAL8[k % 8], px - 0.06, py, 0.065, 'plain', { center: true, rz: 0.4 });
    bf.box(0.24, 0.14, 0.01, PAL8[k % 8], px + 0.06, py, 0.065, 'plain', { center: true, rz: -0.4 });
  }
  P.shelfUnit(mb, -24.5, 14.45, {
    w: 2.6,
    h: 1.25,
    d: 0.45,
    shelves: 3,
    rot: Math.PI,
    fill: 'toys',
    rng: mulberry32(17),
    palette: ['#57cc99', '#38a3a5', '#ffd166', '#e76f51'],
  });
  P.shelfUnit(mb, -16.5, 14.45, {
    w: 2.6,
    h: 1.25,
    d: 0.45,
    shelves: 3,
    rot: Math.PI,
    fill: 'products',
    rng: mulberry32(18),
  });
  P.table(mb, -24.5, 8.0, 1.8, 0.9, 0.8, '#9d4edd');
  sc.colliders.push({ minX: -25.4, maxX: -23.6, minZ: 7.55, maxZ: 8.45 });
  for (let k = 0; k < 5; k++) {
    const dx = -24.5 - 0.7 + k * 0.35;
    mb.add(
      P.ICO,
      ['#57cc99', '#80ed99', '#38a3a5'][k % 3],
      [dx, 0.95, 8.0],
      [0, k, 0],
      [0.12, 0.12, 0.2],
      null,
      'fabric',
    );
    mb.add(
      P.ICO,
      ['#57cc99', '#80ed99', '#38a3a5'][k % 3],
      [dx, 1.08, 7.88],
      [0, 0, 0],
      [0.07, 0.07, 0.09],
      null,
      'fabric',
    );
  }
  mb.cyl(0.03, 0.03, 1.6, '#9aa0a6', -12.3, 0, 8.4, { mat: 'metal' });
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      mb.box(
        0.16,
        0.22,
        0.01,
        PAL8[(r + k) % 8],
        -12.3 + Math.cos(a) * 0.1,
        0.7 + r * 0.25,
        8.4 + Math.sin(a) * 0.1,
        { mat: 'plain', rot: [0, -a + Math.PI / 2, 0] },
      );
    }
  P.clothesRack(mb, -27.6, 11.5, Math.PI / 2, 1.6, mulberry32(19), [
    '#1d3557',
    '#57cc99',
    '#ffd166',
    '#ffffff',
  ]);
  P.counter(mb, 6.5, 12.6, 3, 0, '#1d3557');
  P.addSign(mus.contents, 'TICKETS', 6.5, 2.0, 13.2, 1.4, 0, { bg: '#ffd166', color: '#1d3557' });
  mb.box(0.4, 0.3, 0.3, '#2b2b2f', 7.4, 1.07, 12.6, { mat: 'plastic' });
  for (const sx of [-1, 1]) {
    P.plant(mb, sx * 3.0, 14.3, 1.6);
    P.trashCan(mb, sx * 4.0, 14.4, '#6c757d');
  }
  sc.colliders.push(
    { minX: -4.3, maxX: -2.7, minZ: 14.0, maxZ: 14.88 },
    { minX: 2.7, maxX: 4.3, minZ: 14.0, maxZ: 14.88 },
  );
  // T-rex statue on the plaza
  b.box(36, 0.08, 14, '#d6d2ca', 0, 0, 25, { mat: 'concrete' });
  P.fountain(b, -12, 26, 2.4);
  b.box(4, 1, 2, '#8a8f96', 12, 0, 26, { collide: true, mat: 'concrete' });
  b.sphere(0.9, '#5a7d3a', 12, 2.6, 26, [1.6, 1, 0.9], { mat: 'shoe' });
  b.sphere(0.55, '#5a7d3a', 13.6, 3.4, 26, [1.3, 0.9, 0.8], { mat: 'shoe' });
  for (const sd of [-0.5, 0.5]) b.cyl(0.25, 0.3, 1.6, '#5a7d3a', 11.6, 1, 26 + sd, { mat: 'shoe' });
  b.add(CYL, '#5a7d3a', [10.2, 2.4, 26], [0, 0, 1.2], [0.25, 2, 0.25], null, 'shoe');
  act(sc, 'exit', 0, 31, 'Leave the museum (Town Map)', {}, 2.6);
  sc.spawn = { x: 0, z: 28, rot: Math.PI };
  sc.grass.push({ x: -30, z: 26, w: 20, d: 12 }, { x: 30, z: 26, w: 20, d: 12 });
  return finish(sc);
}
