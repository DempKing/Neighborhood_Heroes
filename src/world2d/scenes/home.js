// The player's home and garden.
import { mulberry32 } from '../../game/rng.js';
import { Builder, shade, TORUS } from '../build.js';
import { finishArea, makeArea, wallPicture } from '../buildings.js';
import { buildField } from '../fields.js';
import * as P from '../props.js';
import { trophyModel } from '../props.js';
import { posterTexture } from '../textures.js';
import { act, base, finish, ground, road, sidewalk, zone } from './common.js';

// ======================================================== HOME ==========
export function buildHome(opts) {
  const { sport, upgrades, colors, trophies = [], playerShirt = '#e63946' } = opts;
  const sc = base({ minX: -24, maxX: 52, minZ: -34, maxZ: 38 });
  const b = sc.b;
  const rng = mulberry32(7);
  ground(sc, 6, 0, 110, 90);
  road(b, 6, -26, 110, 7);
  sidewalk(b, 6, -21.4, 110, 2);
  // neighbors across the street
  P.house(b, -18, -34, { face: 1, style: 'craftsman', wall: '#cfe0c3', roof: '#4a4f57', shutter: '#2d6a4f' });
  P.house(b, 2, -34, {
    face: 1,
    style: 'colonial',
    wall: '#f2e2c4',
    roof: '#6b3a2a',
    shutter: '#9d0208',
    garage: 1,
  });
  P.house(b, 26, -34, { face: 1, style: 'ranch', wall: '#d7e3f0', roof: '#3d405b' });
  // driveway + front path
  b.box(4.2, 0.08, 6.4, '#cfcac0', 5, 0, -17.2, { mat: 'concrete' });
  b.box(1.4, 0.08, 5.6, '#cfcac0', -4, 0, -17.2, { mat: 'concrete' });
  P.mailbox(b, -8, -19.6);
  P.tree(b, -15, -16, 1.15, 1);
  P.tree(b, 15, -17, 1.0, 0);
  for (const bx of [-8.5, -6.5, -1.6, 0.8]) P.bush(b, bx, -14.9, 0.8);
  P.flowers(b, -11.5, -15.2, 3, 1.2, rng);
  act(sc, 'lemonade', -5, -19.6, 'Set up lemonade stand here', { face: -1, walkZ: -21.4 });
  act(sc, 'exit', 0, -22, 'Leave (Town Map)', {}, 2.4);
  zone(sc, 'front yard', -4, -18, 10, 4);

  // The house
  const house = makeArea(sc, {
    id: 'house',
    x: 0,
    z: -8,
    w: 18,
    d: 12,
    wallH: 2.9,
    mode: 'cutaway',
    floor: false,
    ext: { color: '#bcd4e6', mat: 'siding' },
    int: { color: '#f6ecd8', mat: 'paint' },
    trim: '#ffffff',
    doors: [
      { side: 'N', at: -4, w: 1.3, color: '#b23a48' },
      { side: 'N', at: 5, w: 3.6, h: 2.4, roll: true },
      { side: 'S', at: -1, w: 1.3, glass: true },
    ],
    windows: { N: [-7.2, 1.2], S: [-6.5, 4, 7.3], W: [-3, 3], E: [-3, 3] },
    roof: { type: 'gable', color: '#5b4a42', h: 2.6, over: 0.6 },
  });
  const hb = house.b;
  // Inner walls stand full height; each one drops only while it's between the
  // camera and you (see the engine's area update), so rooms keep their walls.
  const innerWall = (x1, z1, x2, z2, doorAt = null, dw = 1.6) => {
    const iw = new Builder();
    const horiz = z1 === z2;
    const len = horiz ? x2 - x1 : z2 - z1;
    const parts =
      doorAt == null
        ? [[0, len]]
        : [
            [0, doorAt - dw / 2],
            [doorAt + dw / 2, len],
          ];
    for (const [a, c] of parts) {
      const l = c - a;
      if (l <= 0.05) continue;
      const mx = horiz ? x1 + (a + c) / 2 : x1;
      const mz = horiz ? z1 : z1 + (a + c) / 2;
      iw.box(horiz ? l : 0.16, 2.9, horiz ? 0.16 : l, '#f6ecd8', mx, 0, mz, { mat: 'paint', collide: true });
      iw.box(horiz ? l : 0.2, 0.13, horiz ? 0.2 : l, '#ffffff', mx, 0, mz, { mat: 'paint' });
    }
    if (doorAt != null) {
      const dx = horiz ? x1 + doorAt : x1;
      const dz = horiz ? z1 : z1 + doorAt;
      iw.box(horiz ? dw : 0.16, 0.5, horiz ? 0.16 : dw, '#f6ecd8', dx, 2.4, dz, { mat: 'paint' });
      // door trim so the opening reads as a doorway
      for (const sd of [-1, 1])
        iw.box(
          horiz ? 0.08 : 0.22,
          2.4,
          horiz ? 0.22 : 0.08,
          '#ffffff',
          dx + (horiz ? (sd * dw) / 2 : 0),
          0,
          dz + (horiz ? 0 : (sd * dw) / 2),
          { mat: 'paint' },
        );
      iw.box(horiz ? dw + 0.16 : 0.22, 0.08, horiz ? 0.22 : dw + 0.16, '#ffffff', dx, 2.36, dz, {
        mat: 'paint',
      });
    }
    const m = iw.mesh();
    sc.group.add(m);
    sc.colliders.push(...iw.colliders);
    house.walls.push({
      obj: m,
      nx: 0,
      nz: 0,
      side: 'inner',
      inner: horiz ? { axis: 'z', at: z1, min: x1, max: x2 } : { axis: 'x', at: x1, min: z1, max: z2 },
    });
    house.objs.push(m);
  };
  // Rooms: living room (NW), garage (NE), kitchen (SW), hall (S middle), bedroom (SE).
  innerWall(-9, -8, -3, -8, 4.8);
  innerWall(-3, -8, 1, -8, 2);
  innerWall(1, -8, 9, -8);
  innerWall(1, -14, 1, -8, 3);
  innerWall(1, -8, 1, -2, 3);
  innerWall(-3, -8, -3, -2, 3);
  // floors
  hb.box(10, 0.06, 6, '#c9935f', -4, 0, -11, { mat: 'wood' });
  hb.box(8, 0.06, 6, '#9a9a9a', 5, 0, -11, { mat: 'concrete' });
  hb.box(6, 0.06, 6, '#e8e3d8', -6, 0, -5, { mat: 'checker' });
  hb.box(4, 0.06, 6, '#c9935f', -1, 0, -5, { mat: 'wood' });
  hb.box(8, 0.06, 6, '#9cc3e6', 5, 0, -5, { mat: 'carpet' });
  // kitchen
  for (let i = 0; i < 3; i++)
    hb.rbox(1.3, 0.9, 0.62, '#5c8a6b', -8.3 + i * 1.32, 0, -7.55, { mat: 'wood', collide: true });
  hb.box(3.96, 0.06, 0.7, '#f1efe9', -6.98, 0.9, -7.55, { mat: 'tile' });
  hb.rbox(0.62, 0.05, 0.5, '#2b2b2f', -6.6, 0.95, -7.55, { mat: 'metal' });
  for (let i = 0; i < 3; i++) hb.rbox(1.2, 0.7, 0.4, '#5c8a6b', -8.3 + i * 1.3, 1.7, -7.75, { mat: 'wood' });
  hb.rbox(0.9, 2.0, 0.8, '#dfe5ea', -8.4, 0, -3.0, { mat: 'metal', collide: true });
  hb.box(0.04, 0.6, 0.04, '#9aa0a6', -8.0, 1.0, -2.6, { mat: 'metal' });
  const tx = -6.6;
  hb.rbox(1.7, 0.08, 1.1, '#a5673f', tx, 0.76, -4.0, { mat: 'wood' });
  for (const [dx, dz] of [
    [-0.7, -0.45],
    [0.7, -0.45],
    [-0.7, 0.45],
    [0.7, 0.45],
  ])
    hb.cyl(0.04, 0.04, 0.76, '#7a4f2b', tx + dx, 0, -4.0 + dz, { mat: 'wood' });
  for (const sd of [-1, 1]) {
    hb.rbox(0.45, 0.06, 0.45, '#c9935f', tx + sd * 1.1, 0.46, -4.0, { mat: 'wood' });
    hb.rbox(0.45, 0.5, 0.06, '#c9935f', tx + sd * 1.32, 0.7, -4.0, { mat: 'wood', rot: [0, Math.PI / 2, 0] });
  }
  sc.colliders.push({ minX: tx - 0.9, maxX: tx + 0.9, minZ: -4.6, maxZ: -3.4 });
  hb.sphere(0.18, '#f4a261', tx, 0.9, -4.0, [1, 0.5, 1], { mat: 'plastic' });
  zone(sc, 'kitchen', -6, -5, 5, 5);
  act(sc, 'parents', -5.5, -3.4, 'Talk to Mom & Dad');
  // living room
  const lx = -6.8;
  hb.rbox(3.4, 0.5, 1.0, '#6c5ce7', lx, 0.0, -13.2, { mat: 'fabric', collide: true });
  hb.rbox(3.4, 0.7, 0.3, '#5a4bd1', lx, 0.4, -13.65, { mat: 'fabric' });
  for (const sd of [-1, 1]) hb.rbox(0.3, 0.6, 1.0, '#5a4bd1', lx + sd * 1.6, 0.0, -13.2, { mat: 'fabric' });
  for (const sd of [-0.8, 0.8]) hb.rbox(1.5, 0.18, 0.9, '#7d6ef0', lx + sd, 0.5, -13.15, { mat: 'fabric' });
  hb.box(3.2, 0.03, 2.2, '#e76f51', lx, 0.06, -11.2, { mat: 'carpet' });
  hb.rbox(1.4, 0.4, 0.7, '#8d5a3b', lx, 0, -11.3, { mat: 'wood', collide: true });
  hb.rbox(2.2, 0.55, 0.45, '#3d3d42', lx, 0, -8.45, { mat: 'wood', collide: true });
  hb.rbox(1.8, 1.05, 0.08, '#111111', lx, 0.95, -8.45, { mat: 'plastic' });
  hb.box(1.68, 0.94, 0.02, '#3a86ff', lx, 1.0, -8.5, { mat: 'glow' });
  hb.cyl(0.25, 0.3, 0.45, '#b5651d', 0.3, 0, -13.4, { mat: 'plastic' });
  P.bush(hb, 0.3, -13.4, 0.6, '#3f8a46');
  zone(sc, 'living room', -4, -11, 8, 5);
  act(sc, 'tv', lx, -12.2, 'Couch: watch TV (pass time)');
  // garage
  P.car(hb, 5, -11.2, Math.PI, '#4a7bd0');
  hb.box(0.6, 2.2, 4.8, '#8d6e63', 8.55, 0, -11, { collide: true, mat: 'wood' });
  for (let i = 0; i < 4; i++)
    for (let k = 0; k < 3; k++)
      hb.rbox(
        0.45,
        0.4,
        0.5,
        ['#c9a227', '#a0522d', '#d4a373'][(i + k) % 3],
        8.5,
        0.15 + k * 0.7,
        -12.8 + i * 1.1,
        { mat: 'fabric' },
      );
  act(sc, 'garage', 7.6, -9.2, 'Garage shelf (equipment)');
  // bedroom
  hb.rbox(1.5, 0.45, 2.5, '#8d5a3b', 7.8, 0, -4.35, { collide: true, mat: 'wood' });
  hb.rbox(1.55, 1.0, 0.12, '#8d5a3b', 7.8, 0, -5.6, { mat: 'wood' });
  hb.rbox(1.42, 0.22, 2.0, playerShirt, 7.8, 0.45, -4.1, { mat: 'fabric' });
  hb.rbox(1.0, 0.18, 0.45, '#ffffff', 7.8, 0.52, -5.25, { mat: 'fabric' });
  hb.rbox(1.5, 0.07, 0.75, '#a5673f', 2.4, 0.74, -2.75, { mat: 'wood' });
  for (const sd of [-0.65, 0.65]) hb.box(0.06, 0.74, 0.65, '#7a4f2b', 2.4 + sd, 0, -2.75, { mat: 'wood' });
  hb.rbox(0.9, 0.58, 0.06, '#1a1a1a', 2.4, 1.08, -2.45, { mat: 'plastic' });
  hb.box(0.8, 0.48, 0.02, '#4cc9f0', 2.4, 1.13, -2.49, { mat: 'glow' });
  hb.rbox(0.5, 0.08, 0.5, '#e63946', 2.4, 0.46, -3.35, { mat: 'plastic' });
  hb.rbox(0.5, 0.55, 0.08, '#e63946', 2.4, 0.72, -3.62, { mat: 'plastic' });
  hb.box(2, 0.03, 1.4, '#ffd166', 5.2, 0.07, -5.2, { mat: 'carpet' });
  wallPicture(house.contents, posterTexture(11), 5.2, 1.7, -7.9, 1.1, 1.1);
  wallPicture(house.contents, posterTexture(23), 3.6, 1.6, -7.9, 0.8, 0.8);
  zone(sc, 'bedroom', 5, -5, 6, 5);
  act(sc, 'bed', 7.8, -2.9, 'Bed (sleep)');
  act(sc, 'computer', 2.4, -3.7, 'Computer: Team HQ & homework');
  // hall stairs
  hb.box(1.3, 0.03, 2.0, '#2b1d14', -2.2, 0.04, -7.0, { mat: 'wood' });
  for (let i = 0; i < 5; i++) hb.box(1.2, 0.05, 0.3, '#7a5c45', -2.2, 0.06, -7.8 + i * 0.38, { mat: 'wood' });
  act(sc, 'basement', -2.2, -6.6, 'Stairs to the basement (trophy room)');
  // Furnishings (doorways at x=-4.2/-1 on z=-8, z=-11 on x=1, z=-5 on x=-3 and x=1 stay clear)
  const frng = mulberry32(41);
  // kitchen: the middle counter becomes the range; an L of counters with the sink runs up the west wall
  const kf = P.frame(hb, -6.6, -7.55, 0);
  for (const [dx, dz] of [
    [-0.15, -0.12],
    [0.15, -0.12],
    [-0.15, 0.12],
    [0.15, 0.12],
  ]) {
    kf.cyl(0.1, 0.1, 0.012, '#4a4a50', dx, 1.0, dz, 'metal');
    kf.cyl(0.05, 0.05, 0.014, '#2b2b2f', dx, 1.0, dz, 'metal');
  }
  kf.box(0.6, 0.56, 0.03, '#d9dde2', 0, 0.12, 0.33, 'metal')
    .box(0.42, 0.22, 0.01, '#1d2733', 0, 0.36, 0.35, 'plastic')
    .box(0.46, 0.03, 0.03, '#9aa0a6', 0, 0.62, 0.37, 'metal');
  for (let i = 0; i < 4; i++) kf.hcyl(0.028, 0.03, '#2b2b2f', -0.21 + i * 0.14, 0.8, 0.33, 'z', 'plastic');
  kf.box(0.72, 0.22, 0.42, '#c0c7cf', 0, 1.46, -0.12, 'metal').box(
    0.6,
    0.02,
    0.34,
    '#2b2b2f',
    0,
    1.45,
    -0.1,
    'metal',
  );
  kf.cyl(0.11, 0.1, 0.12, '#9aa0a6', -0.15, 1.012, 0.12, 'metal').box(
    0.2,
    0.015,
    0.02,
    '#2b2b2f',
    -0.36,
    1.1,
    0.12,
    'plastic',
  );
  kf.ball(0.09, '#e63946', 0.15, 1.08, -0.12, 'plastic', [1, 0.8, 1]).hcyl(
    0.012,
    0.1,
    '#2b2b2f',
    0.15,
    1.16,
    -0.12,
    'x',
    'plastic',
  );
  // microwave, utensil crock, toaster, coffee maker
  hb.box(0.55, 0.32, 0.38, '#2b2b2f', -8.45, 0.96, -7.66, { mat: 'plastic' });
  hb.box(0.36, 0.22, 0.01, '#1d2733', -8.52, 1.01, -7.465, { mat: 'glass' });
  hb.box(0.1, 0.24, 0.01, '#9aa0a6', -8.25, 1.0, -7.465, { mat: 'metal' });
  hb.cyl(0.07, 0.07, 0.16, '#e9c46a', -7.85, 0.96, -7.72, { mat: 'plastic' });
  for (const [dx, c] of [
    [-0.03, '#c0c7cf'],
    [0.02, '#e63946'],
    [0.04, '#2b2b2f'],
  ])
    hb.cyl(0.012, 0.012, 0.24, c, -7.85 + dx, 1.0, -7.72 + dx, { mat: 'plastic' });
  hb.box(0.12, 0.22, 0.18, '#8d5a3b', -7.55, 0.96, -7.74, { mat: 'wood' });
  hb.rbox(0.28, 0.2, 0.18, '#c0c7cf', -5.85, 0.96, -7.66, { mat: 'metal' });
  hb.box(0.2, 0.01, 0.03, '#1a1a1a', -5.85, 1.16, -7.69, { mat: 'plastic' });
  hb.box(0.2, 0.01, 0.03, '#1a1a1a', -5.85, 1.16, -7.62, { mat: 'plastic' });
  hb.box(0.22, 0.36, 0.24, '#1a1a1a', -5.3, 0.96, -7.72, { mat: 'plastic' });
  hb.cyl(0.065, 0.06, 0.13, '#cfe8ff', -5.3, 0.97, -7.58, { mat: 'glass' });
  hb.cyl(0.055, 0.055, 0.06, '#4a2c1a', -5.3, 0.98, -7.58, { mat: 'plastic' });
  hb.box(0.03, 0.03, 0.01, '#e63946', -5.22, 1.26, -7.6, { mat: 'glow' });
  // west run: two cabinets, sink under the window, dishwasher, upper cabinet, fruit bowl, paper towels
  for (const cz of [-6.555, -5.185])
    hb.rbox(0.62, 0.9, 1.36, '#5c8a6b', -8.56, 0, cz, { mat: 'wood', collide: true });
  hb.box(0.7, 0.06, 2.74, '#f1efe9', -8.55, 0.9, -5.87, { mat: 'tile' });
  hb.box(0.44, 0.03, 0.62, '#c0c7cf', -8.55, 0.95, -5.0, { mat: 'metal' });
  hb.box(0.36, 0.01, 0.52, '#7d848c', -8.55, 0.975, -5.0, { mat: 'metal' });
  const sf = P.frame(hb, -8.8, -5.0, Math.PI / 2);
  sf.cyl(0.022, 0.022, 0.26, '#c0c7cf', 0, 0.96, 0, 'metal').box(
    0.03,
    0.03,
    0.2,
    '#c0c7cf',
    0,
    1.2,
    0.09,
    'metal',
  );
  for (const sd of [-0.13, 0.13]) sf.cyl(0.02, 0.02, 0.08, '#c0c7cf', sd, 0.96, 0, 'metal');
  hb.box(0.02, 0.76, 0.6, '#d9dde2', -8.24, 0.08, -5.78, { mat: 'metal' });
  hb.box(0.03, 0.03, 0.44, '#9aa0a6', -8.22, 0.76, -5.78, { mat: 'metal' });
  hb.rbox(0.4, 0.7, 1.2, '#5c8a6b', -8.68, 1.7, -6.55, { mat: 'wood' });
  hb.cyl(0.16, 0.1, 0.08, '#ffffff', -8.55, 0.96, -6.25, { mat: 'plastic' });
  for (const [dx, dz, c] of [
    [-0.05, -0.04, '#e63946'],
    [0.06, 0.02, '#f4a261'],
    [-0.02, 0.07, '#8ac926'],
    [0.05, -0.07, '#e63946'],
  ])
    hb.add(P.ICO, c, [-8.55 + dx, 1.08, -6.25 + dz], [0, 0, 0], [0.065, 0.065, 0.065], null, 'plastic');
  hb.add(P.ICO, '#ffd23f', [-8.53, 1.13, -6.25], [0, 0, 0.4], [0.16, 0.04, 0.05], null, 'plastic');
  hb.cyl(0.08, 0.08, 0.015, '#8d5a3b', -8.6, 0.96, -7.05, { mat: 'wood' });
  hb.cyl(0.06, 0.06, 0.24, '#ffffff', -8.6, 0.975, -7.05, { mat: 'fabric' });
  P.rug(hb, -7.85, -5.4, 0.7, 1.6, '#e9c46a', '#e76f51');
  // trash + recycling by the hall wall, wall clock, fridge art
  P.trashCan(hb, -3.38, -2.42, '#9aa0a6', 0.9);
  P.trashCan(hb, -3.85, -2.42, '#1982c4', 0.9, true);
  sc.colliders.push({ minX: -4.05, maxX: -3.08, minZ: -2.62, maxZ: -2.12 });
  P.wallClock(hb, -3.08, 2.1, -3.1, -Math.PI / 2);
  hb.box(0.012, 0.02, 0.76, '#9aa0a6', -7.945, 1.45, -3.0, { mat: 'metal' });
  for (const [y, z0, c] of [
    [1.25, -3.18, '#ffffff'],
    [1.7, -2.98, '#fff3b0'],
    [0.8, -3.15, '#bde0fe'],
  ]) {
    hb.box(0.01, 0.28, 0.22, c, -7.94, y - 0.14, z0, { mat: 'plain' });
    hb.box(
      0.012,
      0.1,
      0.12,
      ['#e63946', '#2a9d8f', '#f4a261'][Math.floor(y * 3) % 3],
      -7.935,
      y - 0.12,
      z0 + 0.02,
      { mat: 'plain' },
    );
    hb.box(0.02, 0.04, 0.04, '#e63946', -7.93, y + 0.08, z0, { mat: 'plastic' });
  }
  for (let i = 0; i < 6; i++)
    hb.box(
      0.02,
      0.05,
      0.05,
      ['#ffd23f', '#3a86ff', '#8ac926', '#ff006e'][i % 4],
      -7.93,
      0.55 + (i % 3) * 0.5,
      -3.3 + Math.floor(i / 3) * 0.16,
      { mat: 'plastic' },
    );

  // living room: pillows, armchair, side table + lamp, bookshelf, floor lamp, console + speakers, art, curtains
  const pf = P.frame(hb, lx, -13.42, 0);
  for (const [dx, c] of [
    [-1.2, '#ffd166'],
    [-0.95, '#ef476f'],
    [1.15, '#06d6a0'],
  ])
    pf.rbox(0.38, 0.36, 0.13, c, dx, 0.6, 0, 'fabric', { rx: -0.25, rz: dx * 0.08 });
  P.armchair(hb, -8.35, -10.6, Math.PI / 2, '#2a9d8f');
  P.table(hb, -8.5, -9.4, 0.45, 0.45, 0.55, '#8d5a3b');
  sc.colliders.push({ minX: -8.75, maxX: -8.25, minZ: -9.65, maxZ: -9.15 });
  P.tableLamp(hb, -8.5, 0.55, -9.4, '#fff1c9', '#e76f51');
  P.bookshelf(hb, -1.6, -13.55, 2, 0, frng);
  hb.cyl(0.08, 0.06, 0.25, '#457b9d', -2.3, 2.0, -13.6, { mat: 'plastic' });
  hb.cyl(0.05, 0.05, 0.12, '#f7c948', -0.95, 2.0, -13.6, { mat: 'metal' });
  hb.cyl(0.13, 0.06, 0.18, '#f7c948', -0.95, 2.12, -13.6, { mat: 'metal' });
  P.floorLamp(hb, -0.3, -13.55);
  hb.box(0.36, 0.07, 0.25, '#1a1a1a', -6.3, 0.55, -8.4, { mat: 'plastic' });
  hb.box(0.04, 0.01, 0.01, '#4cc9f0', -6.2, 0.6, -8.27, { mat: 'glow' });
  for (const [cx, c] of [
    [-7.35, '#2b2d42'],
    [-7.05, '#e63946'],
  ])
    hb.rbox(0.16, 0.05, 0.1, c, cx, 0.55, -8.32, { mat: 'plastic' });
  for (const sx of [-7.78, -5.82]) {
    hb.box(0.2, 0.42, 0.2, '#2b2b2f', sx, 0.55, -8.45, { mat: 'wood' });
    hb.cyl(0.06, 0.06, 0.01, '#555', sx, 0.7, -8.345, { rot: [Math.PI / 2, 0, 0], mat: 'fabric' });
  }
  P.wallFrame(hb, lx, 2.25, -13.86, 1.4, 0.8, 0, ['#9bd5ff', '#7bc96f', '#ffd23f']);
  P.wallFrame(hb, -2.4, 1.85, -8.1, 0.6, 0.45, Math.PI, ['#ffafcc', '#bde0fe']);
  P.wallFrame(hb, -3.0 + 0.1, 2.3, -8.1, 0.4, 0.5, Math.PI, ['#caffbf', '#ffd6a5']);
  for (const cz of [-11.85, -10.15]) hb.box(0.05, 1.7, 0.28, '#b56576', -8.84, 0.7, cz, { mat: 'fabric' });
  hb.box(0.06, 0.05, 1.9, '#6d4630', -8.84, 2.42, -11, { mat: 'wood' });

  // hall: coat hooks + coats, shoe rack, console table, family photos, runner
  hb.box(0.04, 0.1, 1.3, '#8d5a3b', 0.9, 1.55, -3.1, { mat: 'wood' });
  for (let i = 0; i < 4; i++)
    hb.box(0.1, 0.03, 0.03, '#d4af37', 0.85, 1.55, -3.6 + i * 0.33, { mat: 'metal' });
  hb.rbox(0.14, 0.72, 0.42, '#2a9d8f', 0.8, 0.85, -3.45, { mat: 'fabric' });
  hb.rbox(0.14, 0.62, 0.4, '#e63946', 0.8, 0.95, -2.8, { mat: 'fabric' });
  hb.rbox(0.16, 0.34, 0.28, '#ffbe0b', 0.76, 1.15, -3.12, { mat: 'fabric' });
  hb.box(0.3, 0.32, 1.0, '#8d5a3b', 0.75, 0, -3.1, { mat: 'wood', collide: true });
  for (let i = 0; i < 3; i++)
    for (const sd of [-0.06, 0.06])
      hb.box(0.24, 0.08, 0.1, ['#1d3557', '#e63946', '#ffffff'][i], 0.72, 0.32, -3.45 + i * 0.33 + sd, {
        mat: 'shoe',
      });
  P.table(hb, -2.4, -2.32, 0.9, 0.32, 0.8, '#6d4630');
  sc.colliders.push({ minX: -2.85, maxX: -1.95, minZ: -2.48, maxZ: -2.12 });
  hb.cyl(0.1, 0.06, 0.05, '#e9c46a', -2.6, 0.8, -2.3, { mat: 'plastic' });
  P.tableLamp(hb, -2.15, 0.8, -2.3, '#ffe5ec', '#b5838d');
  for (const [z0, y, w, h, c] of [
    [-3.5, 1.65, 0.45, 0.55, ['#bde0fe', '#ffd6a5']],
    [-2.85, 1.75, 0.55, 0.42, ['#caffbf', '#9bd5ff']],
    [-3.2, 2.3, 0.7, 0.4, ['#ffafcc', '#7bc96f']],
  ])
    P.wallFrame(hb, -2.92, y, z0, w, h, Math.PI / 2, c, '#2b2b2f');
  P.rug(hb, -1.0, -4.0, 0.9, 2.4, '#457b9d', '#a8dadc');

  // bedroom: closet, low bookshelf, toy box, dresser, nightstand + lamp, beanbag, balls, pennant, desk lamp
  const cf = P.frame(hb, 1.95, -7.6, 0);
  cf.box(1.5, 2.3, 0.6, '#e9dcc9', 0, 0, 0, 'wood');
  for (const sd of [-1, 1]) {
    cf.box(0.72, 2.1, 0.03, '#d9c7ad', sd * 0.37, 0.08, 0.31, 'wood');
    cf.box(0.03, 0.22, 0.04, '#9aa0a6', sd * 0.06, 1.0, 0.34, 'metal');
  }
  cf.solid(1.5, 0.6);
  P.shelfUnit(hb, 3.7, -7.7, {
    w: 1.1,
    h: 1.0,
    d: 0.4,
    shelves: 2,
    fill: 'books',
    color: '#f4f1ea',
    rng: frng,
  });
  hb.rbox(0.9, 0.48, 0.5, '#3a86ff', 5.2, 0, -7.62, { mat: 'plastic', collide: true });
  hb.rbox(0.94, 0.08, 0.54, '#ffbe0b', 5.2, 0.46, -7.62, { mat: 'plastic' });
  hb.add(P.ICO, '#e8742b', [4.65, 0.13, -7.4], [0, 0, 0], [0.13, 0.13, 0.13], null, 'rubber');
  hb.add(P.ICO, '#ffffff', [5.95, 0.12, -7.5], [0, 0, 0], [0.12, 0.12, 0.12], null, 'rubber');
  const df = P.frame(hb, 7.5, -7.65, 0);
  df.box(1.4, 0.95, 0.5, '#a5673f', 0, 0, 0, 'wood');
  for (let r = 0; r < 3; r++)
    for (const sd of [-1, 1]) {
      df.box(0.62, 0.26, 0.02, '#b77b4f', sd * 0.34, 0.06 + r * 0.3, 0.255, 'wood');
      df.box(0.12, 0.03, 0.03, '#d4af37', sd * 0.34, 0.2 + r * 0.3, 0.27, 'metal');
    }
  df.box(0.6, 0.8, 0.04, '#cfe8ff', 0, 0.98, -0.2, 'glass').box(
    0.66,
    0.86,
    0.03,
    '#8d5a3b',
    0,
    0.95,
    -0.23,
    'wood',
  );
  df.ball(0.1, '#ff8fab', -0.45, 1.05, 0.05, 'plastic', [1.2, 0.9, 0.9]);
  df.solid(1.4, 0.5);
  hb.cyl(0.04, 0.04, 0.1, '#f7c948', 7.95, 0.95, -7.6, { mat: 'metal' });
  hb.cyl(0.1, 0.05, 0.14, '#f7c948', 7.95, 1.05, -7.6, { mat: 'metal' });
  P.table(hb, 6.62, -5.36, 0.44, 0.42, 0.55, '#a5673f');
  sc.colliders.push({ minX: 6.4, maxX: 6.84, minZ: -5.57, maxZ: -5.15 });
  P.tableLamp(hb, 6.55, 0.55, -5.42, '#bde0fe', '#457b9d');
  hb.box(0.14, 0.08, 0.06, '#e63946', 6.7, 0.55, -5.28, { mat: 'plastic' });
  hb.box(0.1, 0.04, 0.005, '#ff6b6b', 6.7, 0.57, -5.25, { mat: 'glow' });
  P.beanbag(hb, 3.1, -6.45, '#8338ec');
  P.pennant(hb, 8.86, 2.3, -6.6, 1.0, 0.45, -Math.PI / 2, '#1d3557', '#ffd166');
  wallPicture(house.contents, posterTexture(31), 8.86, 1.55, -7.3, 0.6, 0.8, -Math.PI / 2);
  P.tableLamp(hb, 1.85, 0.81, -2.55, '#ffd166', '#2a9d8f');
  for (let i = 0; i < 3; i++)
    hb.box(0.22, 0.05, 0.3, ['#e63946', '#457b9d', '#e9c46a'][i], 2.95, 0.81 + i * 0.05, -2.6, {
      mat: 'fabric',
    });
  hb.cyl(0.04, 0.04, 0.1, '#ffbe0b', 2.75, 0.81, -2.45, { mat: 'plastic' });

  // garage: workbench + pegboard, wheelie bins, ball bin, bikes, mower, rake & shovel, hose
  const wf = P.frame(hb, 1.45, -13.15, Math.PI / 2);
  wf.box(1.5, 0.06, 0.6, '#b08968', 0, 0.86, 0, 'wood');
  for (const [sx, sz] of [
    [-0.7, -0.26],
    [0.7, -0.26],
    [-0.7, 0.26],
    [0.7, 0.26],
  ])
    wf.box(0.06, 0.86, 0.06, '#7a5233', sx, 0, sz, 'wood');
  wf.box(1.42, 0.04, 0.52, '#7a5233', 0, 0.25, 0, 'wood');
  for (let i = 0; i < 3; i++)
    wf.cyl(0.09, 0.09, 0.18, ['#e63946', '#3a86ff', '#ffffff'][i], -0.5 + i * 0.3, 0.29, 0.02, 'metal');
  wf.box(1.5, 0.9, 0.03, '#d4a373', 0, 1.15, -0.28, 'wood');
  for (let i = 0; i < 5; i++) {
    const tx2 = -0.55 + i * 0.27;
    wf.box(
      0.03,
      0.26,
      0.02,
      ['#e63946', '#2b2b2f', '#ffbe0b', '#3a86ff', '#2b2b2f'][i],
      tx2,
      1.35 + (i % 2) * 0.2,
      -0.25,
      'plastic',
    );
    wf.box(0.12, 0.05, 0.03, '#9aa0a6', tx2, 1.6 + (i % 2) * 0.2, -0.25, 'metal');
  }
  wf.box(0.45, 0.2, 0.02, '#9aa0a6', 0.35, 1.25, -0.25, 'metal', { rz: 0.1 });
  wf.rbox(0.42, 0.2, 0.22, '#c1121f', -0.4, 0.89, 0.05, 'metal').box(
    0.16,
    0.12,
    0.16,
    '#3d3d42',
    0.55,
    0.89,
    0.14,
    'metal',
  );
  wf.solid(1.5, 0.6);
  for (const [bx, c] of [
    [2.25, '#2d6a4f'],
    [2.85, '#1982c4'],
  ]) {
    hb.rbox(0.55, 1.0, 0.6, c, bx, 0, -13.55, { mat: 'plastic', collide: true });
    hb.rbox(0.58, 0.06, 0.64, shade(c, 0.8), bx, 1.0, -13.55, { mat: 'plastic' });
  }
  P.ballBin(hb, 2.4, -12.75);
  P.bike(hb, 2.2, -8.38, 0, '#e63946');
  P.lawnMower(hb, 7.5, -13.1, 0, '#2a9d8f');
  for (const [rx2, c] of [
    [7.9, '#8d5a3b'],
    [8.08, '#6c757d'],
  ])
    hb.box(0.04, 1.5, 0.04, c, rx2, 0, -8.2, { mat: 'wood', rot: [0.12, 0, 0] });
  hb.box(0.3, 0.06, 0.04, '#6c757d', 7.9, 1.5, -8.28, { mat: 'metal' });
  hb.box(0.16, 0.24, 0.03, '#6c757d', 8.08, 0.05, -8.2, { mat: 'metal' });
  hb.add(TORUS, '#2d6a4f', [1.15, 1.2, -9.1], [0, Math.PI / 2, 0], [0.28, 0.28, 0.5], null, 'rubber');
  hb.box(1.0, 0.005, 0.6, '#3d3d42', 5.2, 0.065, -11.4, { mat: 'concrete' });
  finishArea(house);

  // Backyard
  b.box(6, 0.1, 3.2, '#cfcac0', -1, 0, 0, { mat: 'concrete' });
  b.rbox(0.9, 0.9, 0.6, '#2b2b2f', 2.4, 0, 0.4, { mat: 'metal' });
  b.cyl(0.8, 0.8, 0.06, '#e9e3d6', -2.5, 0.72, 0.5, { mat: 'plastic' });
  b.cyl(0.05, 0.05, 2.3, '#cfcfcf', -2.5, 0, 0.5, { mat: 'metal' });
  b.cone(1.3, 0.5, '#e63946', -2.5, 2.2, 0.5, { mat: 'fabric' });
  P.fence(b, -20, -2, -20, 36);
  P.fence(b, 20, -2, 20, 36);
  P.fence(b, -20, 36, 20, 36);
  P.fence(b, -20, -2, -9.3, -2);
  P.fence(b, 9.3, -2, 20, -2);
  P.flowers(b, -15, 1, 6, 1.6, rng);
  P.addSign(sc.group, "Mom's Flowers: KEEP OUT", -15, 1.0, 2.0, 2.2, 0, { bg: '#ffe5ec' });
  P.tree(b, 17, 33, 1.25, 2);
  P.tree(b, -17.5, 33, 1.05, 3);
  P.tree(b, -17.5, 5, 0.9, 0);
  const field = buildField(sport, upgrades, colors, 0, 17, { label: 'Backyard' });
  sc.group.add(field.group);
  sc.colliders.push(...field.colliders);
  sc.fieldInfo = field.info;
  sc.setScore = field.setScore;
  zone(sc, 'backyard', 0, 17, 26, 18);
  act(sc, 'field', 0, 1.8, 'Team: tryouts / practice', {}, 2.0);
  P.streetLamp(b, -12, -20.6);
  P.streetLamp(b, 18, -20.6);
  sc.grass.push(
    { x: -14, z: -17.5, w: 12, d: 5 },
    { x: 14, z: -17.5, w: 12, d: 5 },
    { x: -16, z: 16, w: 7, d: 36 },
    { x: 16, z: 16, w: 7, d: 36 },
    { x: 0, z: 31, w: 38, d: 9 },
    { x: -30, z: 0, w: 18, d: 40 },
    { x: 34, z: 0, w: 22, d: 40 },
  );
  sc.grassCount = 6000;

  // Basement trophy room (a focus room: only it is drawn while you're down there)
  const base2 = makeArea(sc, {
    id: 'basement',
    x: 46,
    z: -10,
    w: 12,
    d: 8,
    wallH: 2.6,
    mode: 'cutaway',
    focus: true,
    ext: { color: '#8a8f96', mat: 'concrete' },
    int: { color: '#c8c2b8', mat: 'concrete' },
    floor: { color: '#8a8f96', mat: 'concrete' },
  });
  const bb = base2.b;
  bb.rbox(1.0, 1.8, 1.0, '#a6abb2', 50.5, 0, -12.5, { collide: true, mat: 'metal' });
  bb.box(8, 0.1, 0.6, '#8d5a3b', 44, 1.0, -13.5, { mat: 'wood' });
  bb.box(8, 0.1, 0.6, '#8d5a3b', 44, 0.2, -13.5, { mat: 'wood' });
  for (const sd of [-3.9, 3.9]) bb.box(0.1, 1.1, 0.6, '#8d5a3b', 44 + sd, 0.2, -13.5, { mat: 'wood' });
  bb.rbox(2.4, 0.5, 0.9, '#7a6a5e', 46, 0, -7.2, { mat: 'fabric' });
  for (let i = 0; i < 10; i++)
    bb.sphere(
      0.06,
      ['#ffd166', '#ff6b9a', '#4cc9f0'][i % 3],
      41 + i * 1.1,
      2.4 - Math.sin(i) * 0.1,
      -13.7,
      [1, 1, 1],
      { mat: 'glow' },
    );
  for (let i = 0; i < 3; i++) bb.rbox(0.6, 0.5, 0.6, '#c9a227', 41 + i * 0.7, 0, -7.5, { mat: 'fabric' });
  wallPicture(base2.contents, posterTexture(5), 41.5, 1.8, -13.85, 1.0, 0.8);
  sc.extra.trophySlots = [];
  for (let i = 0; i < 6; i++) sc.extra.trophySlots.push({ x: 41 + i * 1.2, y: 1.06, z: -13.5 });
  for (const t of trophies) {
    if (t.slot == null || t.slot >= 6) continue;
    const m = trophyModel(
      t.name.includes('Game Ball') ? 'ball' : t.name.includes('Runner') ? 'silver' : 'gold',
    );
    const s = sc.extra.trophySlots[t.slot];
    m.position.set(s.x, s.y, s.z);
    base2.contents.add(m);
  }
  // more basement fun: rug, foosball, TV corner with a couch, mini fridge, beanbags, dartboard, lamp
  P.rug(bb, 45.8, -10.0, 5, 3, '#2a9d8f', '#e9c46a');
  const ff = P.frame(bb, 45.6, -10.4, 0);
  ff.box(1.3, 0.22, 0.75, '#2d6a4f', 0, 0.62, 0, 'wood').box(1.2, 0.02, 0.65, '#57cc99', 0, 0.8, 0, 'plain');
  for (const [sx, sz] of [
    [-0.58, -0.3],
    [0.58, -0.3],
    [-0.58, 0.3],
    [0.58, 0.3],
  ])
    ff.box(0.08, 0.62, 0.08, '#1b4332', sx, 0, sz, 'wood');
  for (let i = 0; i < 6; i++) {
    ff.hcyl(0.015, 1.1, '#c0c7cf', -0.5 + i * 0.2, 0.86, 0, 'z', 'metal');
    ff.box(
      0.06,
      0.1,
      0.06,
      i % 2 ? '#e63946' : '#3a86ff',
      -0.5 + i * 0.2,
      0.8,
      ((i % 3) - 1) * 0.15,
      'plastic',
    );
  }
  ff.ball(0.03, '#ffffff', 0.1, 0.84, 0.05).solid(1.3, 0.75);
  const tf = P.frame(bb, 51.6, -9.6, -Math.PI / 2);
  tf.box(1.6, 0.5, 0.45, '#3d3d42', 0, 0, 0, 'wood')
    .box(1.5, 0.85, 0.06, '#111111', 0, 0.85, -0.05, 'plastic')
    .box(1.4, 0.75, 0.01, '#ff6b9a', 0, 0.9, -0.015, 'glow');
  tf.box(0.36, 0.07, 0.25, '#f4f1ea', 0.45, 0.5, 0.05, 'plastic').solid(1.6, 0.45);
  P.sofa(bb, 49.3, -9.6, Math.PI / 2, '#c1121f', 2.2);
  act(sc, 'tv', 50.4, -9.6, 'Couch: watch TV (pass time)');
  bb.box(0.55, 0.85, 0.55, '#e9ecef', 51.5, 0, -7.0, { mat: 'metal', collide: true });
  bb.box(0.02, 0.6, 0.03, '#9aa0a6', 51.2, 0.15, -6.8, { mat: 'metal' });
  for (let i = 0; i < 3; i++)
    bb.cyl(0.04, 0.04, 0.13, ['#e63946', '#06d6a0', '#ffbe0b'][i], 51.35 + i * 0.12, 0.85, -7.0, {
      mat: 'metal',
    });
  P.beanbag(bb, 42.4, -9.2, '#3a86ff');
  P.beanbag(bb, 41.3, -10.2, '#ff595e');
  const dart = P.frame(bb, 40.12, -10.2, Math.PI / 2);
  for (const [r, c] of [
    [0.3, '#1a1a1a'],
    [0.24, '#e9dcc9'],
    [0.17, '#d62828'],
    [0.1, '#e9dcc9'],
    [0.04, '#d62828'],
  ])
    dart.hcyl(r, 0.03 + (0.3 - r) * 0.06, c, 0, 1.6, 0.02, 'z', 'fabric');
  P.floorLamp(bb, 50.3, -7.0, '#ffd166');
  P.pennant(bb, 40.12, 2.3, -8.2, 1.0, 0.45, Math.PI / 2, '#e63946', '#ffffff');
  finishArea(base2);
  act(sc, 'trophy', 44, -12, 'Trophy shelf');
  act(sc, 'upstairs', 46, -6.8, 'Go back upstairs');
  zone(sc, 'basement', 46, -10, 10, 6);

  sc.spawn = { x: 0, z: -21, rot: 0 };
  sc.spawnBed = { x: 6.4, z: -3.2, rot: Math.PI };
  sc.spawnBasement = { x: 46, z: -8, rot: Math.PI };
  sc.spawnUpstairs = { x: -1.6, z: -5.4, rot: 0 };
  return finish(sc, [{ minX: -13, maxX: 13, minZ: 8, maxZ: 26 }]);
}
