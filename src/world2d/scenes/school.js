// The school: one long hallway with classrooms (drawn one room at a time) and service rooms.
import { CORE_SUBJECTS, SUBJECT_TEACHERS } from '../../data/world.js';
import { TORUS } from '../build.js';
import { makeArea } from '../buildings.js';
import * as P from '../props.js';
import * as THREE from '../three2d.js';
import { act, base, finish, ground, sidewalk, zone } from './common.js';
import { classroom, LOCKER_BLUE, SLOT, slotX } from './school/classroom.js';
import { serviceRoom } from './school/serviceRoom.js';

export function buildSchool(opts) {
  const grade = opts.grade;
  const elementary = grade <= 5;
  const sc = base({ minX: -114, maxX: 108, minZ: -60, maxZ: 26 });
  const b = sc.b;
  ground(sc, -3, -16, 236, 100);
  const school = makeArea(sc, {
    id: 'school',
    x: 0,
    z: 0,
    w: 154,
    d: 26,
    wallH: 3.4,
    mode: 'down',
    floor: false,
    ext: { color: '#b5543c', mat: 'brick' },
    int: { color: '#efe6d2', mat: 'paint' },
    trim: '#f4f1ea',
    doors: [
      { side: 'W', at: 0, w: 3, glass: true },
      { side: 'E', at: 0, w: 3, glass: true },
      { side: 'N', at: slotX(7), w: 3, glass: true },
    ],
    windows: {
      N: Array.from({ length: 14 }, (_, i) => i)
        .filter((i) => i !== 7)
        .flatMap((i) => [slotX(i) - 3.2, slotX(i) - 0.6, slotX(i) + 2.0]),
      S: Array.from({ length: 14 }, (_, i) => i).flatMap((i) => [
        slotX(i) - 3.2,
        slotX(i) - 0.6,
        slotX(i) + 2.0,
      ]),
    },
    windowW: 1.8,
    windowH: 1.4,
    windowY: 1.1,
    roof: {
      type: 'flat',
      color: '#7d838a',
      units: [
        [-40, 0],
        [-10, 2],
        [25, -2],
        [50, 1],
      ],
    },
  });
  const hb = school.b;
  // Main hallway: speckled vinyl tile with a two-tone border, like every school ever.
  hb.box(154, 0.06, 6, '#e9e4d6', 0, 0, 0, { mat: 'tile' });
  for (const sz of [-1, 1]) hb.box(154, 0.065, 0.35, '#1d3557', 0, 0, sz * 2.3, { mat: 'tile' });
  for (const sz of [-1, 1]) hb.box(154, 0.065, 0.12, '#ffd166', 0, 0, sz * 2.0, { mat: 'tile' });
  hb.box(SLOT - 1, 0.06, 10, '#e9e4d6', slotX(7), 0, -8, { mat: 'tile' });
  zone(sc, 'hall-north', slotX(7), -8, 8, 8);
  zone(sc, 'hallway', 0, 0, 146, 3.4);

  // Who goes where. Classrooms first fill the north side, then the south.
  const grades = elementary ? [3, 4, 5, 2] : [6, 7, 8];
  const rooms = grades.flatMap((g) =>
    CORE_SUBJECTS.map((subject) => ({ grade: g, subject, teacher: SUBJECT_TEACHERS[g][subject] })),
  );
  const north = Array.from({ length: 14 }, (_, i) => (i === 7 ? { kind: 'passage' } : null));
  const south = [
    'office',
    'nurse',
    'detention',
    'school library',
    null,
    'cafeteria',
    null,
    null,
    'band room',
    'after-care room',
    'class',
    'class',
    'class',
    'gym door',
  ];
  let ri = 0;
  for (let i = 0; i < 14; i++)
    if (!north[i])
      north[i] = rooms[ri]
        ? { kind: 'class', ...rooms[ri++] }
        : { kind: 'service', name: "teachers' lounge" };
  for (let i = 0; i < 14; i++)
    if (south[i] === 'class')
      south[i] = rooms[ri]
        ? { kind: 'class', ...rooms[ri++] }
        : { kind: 'service', name: "teachers' lounge" };

  // Lockers line every stretch of hallway wall that isn't a door.
  const lockerRuns = [];
  north.forEach((r, i) => {
    const x = slotX(i);
    if (r.kind === 'passage') {
      P.addSign(school.contents, 'To Playground', x, 2.6, -3.15, 2.4);
      // Trophy case beside the playground doors: two old school awards, then a
      // Crest Cup for every time Suncrest has won it (read the plates with E).
      const cups = opts.crestCups || [];
      const slots = Math.max(4, Math.min(10, cups.length + 2));
      const cw = 0.6 * slots + 0.2;
      const cx = x + 2.5 + cw / 2;
      hb.box(cw, 0.9, 0.5, '#6d4630', cx, 0, -2.8, { mat: 'wood' });
      hb.box(cw, 1.3, 0.48, '#d6ecff', cx, 0.9, -2.8, { mat: 'glass' });
      for (let k = 0; k < slots; k++) {
        const tx = x + 2.9 + k * 0.6;
        if (k < 2) {
          hb.cyl(0.08, 0.12, 0.35 + (k % 2) * 0.15, '#c0c6cc', tx, 0.95, -2.8, { mat: 'metal' });
          continue;
        }
        if (k - 2 >= cups.length) continue;
        // a Crest Cup: base, stem, bowl, handles, and a navy plate
        hb.box(0.34, 0.1, 0.24, '#13294b', tx, 0.9, -2.8, { mat: 'wood' });
        hb.box(0.2, 0.05, 0.01, '#f2c14e', tx, 0.93, -2.67, { mat: 'metal' });
        hb.cyl(0.04, 0.07, 0.16, '#f2c14e', tx, 1.0, -2.8, { mat: 'metal' });
        hb.cyl(0.15, 0.06, 0.22, '#f2c14e', tx, 1.16, -2.8, { mat: 'metal' });
        for (const sd of [-1, 1])
          hb.add(
            TORUS,
            '#f2c14e',
            [tx + sd * 0.15, 1.28, -2.8],
            [0, 0, Math.PI / 2],
            [0.06, 0.06, 0.5],
            null,
            'metal',
          );
      }
      sc.colliders.push({ minX: cx - cw / 2, maxX: cx + cw / 2, minZ: -3.05, maxZ: -2.55 });
      act(
        sc,
        'trophycase',
        cx,
        -2.2,
        cups.length
          ? `Read the trophy case (${cups.length} Crest Cup${cups.length === 1 ? '' : 's'})`
          : 'Look at the trophy case',
        { cups },
      );
      lockerRuns.push([x - 5.3, x - 1.8, -2.98, 1]);
      return;
    }
    if (r.kind === 'class')
      classroom(sc, school, { x, north: true, teacher: r.teacher, subject: r.subject, grade: r.grade, i });
    else serviceRoom(sc, school, r.name, x, true);
    lockerRuns.push([x - 5.3, x + 1.75, -2.98, 1]);
  });
  south.forEach((r, i) => {
    const x = slotX(i);
    if (r === null) return;
    if (r === 'gym door') {
      hb.box(SLOT - 1, 0.06, 10, '#e9e4d6', x, 0, 8, { mat: 'tile' });
      P.addSign(school.contents, 'Gym ->', x, 2.6, 3.15, 1.6, Math.PI);
      // drinking fountain
      hb.rbox(0.6, 0.9, 0.45, '#c9ced4', x - 4.4, 0, 2.75, { mat: 'metal', collide: true });
      return;
    }
    if (typeof r === 'string') {
      const span = r === 'school library' ? 2 : r === 'cafeteria' ? 3 : 1;
      serviceRoom(sc, school, r, x, false, span);
      if (span === 1) lockerRuns.push([x - 5.3, x + 1.75, 2.98, -1]);
      return;
    }
    if (r.kind === 'class')
      classroom(sc, school, {
        x,
        north: false,
        teacher: r.teacher,
        subject: r.subject,
        grade: r.grade,
        i: i + 20,
      });
    else serviceRoom(sc, school, r.name, x, false);
    lockerRuns.push([x - 5.3, x + 1.75, 2.98, -1]);
  });
  for (const [x0, x1, z, face] of lockerRuns) {
    if (x1 - x0 < 1) continue;
    sc.colliders.push(P.lockerBank(hb, x0, x1, z, face, LOCKER_BLUE));
  }
  // hallway: bulletin boards and pennants above the lockers, clocks and fire extinguishers by the doors,
  // and the bare cafeteria/library walls get a fountain, bins and boards
  lockerRuns.forEach(([x0, x1, z, face], k) => {
    if (x1 - x0 < 3) return;
    const wz = z + face * 0.0;
    const rot = face > 0 ? 0 : Math.PI;
    if (k % 2 === 0)
      P.bulletinBoard(hb, (x0 + x1) / 2, 2.95, wz, Math.min(2.6, x1 - x0 - 1), 0.75, rot, k + 7);
    else
      for (let q = 0; q < 4; q++)
        P.pennant(
          hb,
          (x0 + x1) / 2 - 1.5 + q,
          2.95,
          wz + face * 0.02,
          0.7,
          0.55,
          rot,
          ['#1d3557', '#ffd166', '#e63946', '#2a9d8f'][(q + k) % 4],
          '#ffffff',
        );
    if (k % 3 === 0) P.wallClock(hb, x1 + 3.2, 2.75, wz, rot);
    if (k % 4 === 1) {
      const ef = P.frame(hb, x1 + 3.4, wz, rot);
      ef.box(0.34, 0.6, 0.12, '#c1121f', 0, 0.8, 0.06, 'metal')
        .box(0.26, 0.45, 0.01, '#cfe8ff', 0, 0.86, 0.125, 'glass')
        .cyl(0.08, 0.08, 0.4, '#e63946', 0, 0.88, 0.06, 'metal');
    }
  });
  for (const [bx, ws] of [
    [-17.8, 'LUNCH MENU'],
    [-33, 'BOOK FAIR FRIDAY!'],
  ]) {
    P.bulletinBoard(hb, bx, 2.3, 2.98, 3.0, 1.1, Math.PI, Math.round(-bx));
    P.addSign(school.contents, ws, bx, 2.62, 2.9, 2.0, Math.PI, { bg: '#e63946', color: '#ffffff' });
  }
  hb.rbox(0.9, 0.9, 0.45, '#c9ced4', -7.0, 0, 2.75, { mat: 'metal', collide: true });
  for (const sd of [-0.22, 0.22]) hb.cyl(0.15, 0.12, 0.05, '#adb5bd', -7.0 + sd, 0.9, 2.72, { mat: 'metal' });
  P.trashCan(hb, -0.2, 2.72);
  P.trashCan(hb, 0.35, 2.72, '#1982c4', 1, true);
  sc.colliders.push({ minX: -0.45, maxX: 0.6, minZ: 2.5, maxZ: 2.98 });
  P.plant(hb, -24.6, 2.6, 1.2);
  P.plant(hb, -42.6, 2.6, 1.2);
  // gym (its own building)
  const gym = makeArea(sc, {
    id: 'gym',
    x: 96,
    z: -8,
    w: 18,
    d: 16,
    wallH: 5,
    mode: 'cutaway',
    focus: true,
    ext: { color: '#b5543c', mat: 'brick' },
    int: { color: '#ffe8a3', mat: 'paint' },
    floor: { color: '#d9a066', mat: 'wood' },
    doors: [{ side: 'W', at: 6.5, w: 2.5, glass: true }],
    windows: { N: [-5, 0, 5], S: [-5, 5] },
    windowY: 3.4,
    roof: { type: 'gable', color: '#5b6168', h: 2.5 },
  });
  for (const sx of [-1, 1]) {
    gym.b.box(0.15, 3.2, 0.15, '#6c757d', 96 + sx * 8.4, 0, -8, { mat: 'metal' });
    gym.b.box(1.2, 0.9, 0.06, '#ffffff', 96 + sx * 8.2, 3.0, -8, {
      mat: 'plastic',
      rot: [0, Math.PI / 2, 0],
    });
  }
  gym.b.cyl(1.5, 1.5, 0.02, '#e63946', 96, 0.05, -8, { mat: 'plastic' });
  // gym furnishings: court lines, rims + nets, wall pads, bleachers, scoreboard, mats, ball carts, banners
  const gb2 = gym.b;
  const line = (w2, d2, lx2, lz2, c = '#ffffff') =>
    gb2.box(w2, 0.006, d2, c, lx2, 0.062, lz2, { mat: 'plain' });
  line(15, 0.08, 96, -14);
  line(15, 0.08, 96, -2.4);
  line(0.08, 11.6, 88.5, -8.2);
  line(0.08, 11.6, 103.5, -8.2);
  line(0.08, 11.6, 96, -8.2);
  for (const sx of [-1, 1]) {
    const kx = 96 + sx * 6.5;
    gb2.box(3, 0.005, 2.4, '#c0392b', kx, 0.06, -8, { mat: 'plain' });
    line(0.08, 2.4, 96 + sx * 5, -8);
    gb2.add(
      TORUS,
      '#ff6b00',
      [96 + sx * 7.75, 3.05, -8],
      [Math.PI / 2, 0, 0],
      [0.23, 0.23, 0.15],
      null,
      'metal',
    );
    gb2.cyl(0.21, 0.13, 0.42, '#f4f1ea', 96 + sx * 7.75, 2.63, -8, { mat: 'fabric' });
    gb2.box(0.3, 0.04, 0.05, '#ff6b00', 96 + sx * 7.98, 3.03, -8, { mat: 'metal' });
    gb2.box(0.03, 0.05, 0.5, '#e63946', 96 + sx * 8.16, 3.1, -8, { mat: 'plastic' });
    gb2.box(0.03, 0.4, 0.05, '#e63946', 96 + sx * 8.16, 3.1, -8.25, { mat: 'plastic' });
    gb2.box(0.03, 0.4, 0.05, '#e63946', 96 + sx * 8.16, 3.1, -7.75, { mat: 'plastic' });
    gb2.box(0.1, 1.6, 3.2, '#1d4ed8', 96 + sx * 8.82, 0.25, -8, { mat: 'fabric' });
  }
  P.bleachers(gb2, 96.5, -2.6, 10, 3, Math.PI);
  gb2.colliders.pop();
  gb2.colliders.push({ minX: 91.3, maxX: 101.7, minZ: -2.95, maxZ: -0.12 });
  const sbf = P.frame(gb2, 93.5, -15.88, 0);
  sbf.box(2.4, 1.1, 0.12, '#1a1a1a', 0, 2.95, 0.06, 'metal');
  for (const sd of [-1, 1]) {
    sbf.box(0.6, 0.4, 0.02, '#ff6b00', sd * 0.7, 3.2, 0.13, 'glow');
    sbf.box(0.7, 0.14, 0.02, '#ffffff', sd * 0.7, 3.75, 0.13, 'plain');
  }
  sbf.box(0.4, 0.22, 0.02, '#ffd60a', 0, 3.05, 0.13, 'glow');
  P.addSign(gym.contents, 'GO GRIFFINS!', 98.6, 3.45, -15.82, 2.8, 0, { bg: '#1d3557', color: '#ffd166' });
  for (let k = 0; k < 4; k++)
    P.pennant(
      gb2,
      89.6 + k * 0.9,
      4.6,
      -15.85,
      0.7,
      0.55,
      0,
      ['#e63946', '#ffd166', '#2a9d8f', '#3a86ff'][k],
      '#ffffff',
    );
  P.matStack(gb2, 102.6, -14.9, 0, 4, '#1d4ed8');
  P.matStack(gb2, 89.6, -14.9, 0, 3, '#e63946');
  P.ballCart(gb2, 98.3, -14.6, 0);
  P.ballCart(gb2, 93.7, -14.6, 0, ['#ffffff', '#e63946', '#3a86ff']);
  P.wallClock(gb2, 104.88, 4.1, -12, -Math.PI / 2, 0.32);
  zone(sc, 'gym', 96, -8, 14, 12);
  b.box(10, 0.1, 3, '#cfcac0', 82, 0, -0.8, { mat: 'concrete' });
  b.box(4, 0.1, 6, '#cfcac0', 85, 0, -4, { mat: 'concrete' });
  // playground
  b.box(92, 0.03, 34, '#83c35a', 0, 0, -33, { mat: 'grass' });
  P.fence(b, -46, -15, -46, -51, '#9aa0a6');
  P.fence(b, 46, -15, 46, -51, '#9aa0a6');
  P.fence(b, -46, -51, 46, -51, '#9aa0a6');
  const spots = {
    'tetherball pole': [-30, -22],
    swings: [-18, -24],
    'monkey bars': [-6, -24],
    'blacktop four square': [8, -22],
    'kickball diamond': [25, -36],
    'under the slide': [-30, -36],
    sandbox: [-16, -38],
    'the big oak tree': [8, -42],
  };
  b.box(16, 0.04, 10, '#55585e', 8, 0, -22, { mat: 'asphalt' });
  P.tetherball(b, ...spots['tetherball pole']);
  P.swingSet(b, ...spots.swings);
  P.monkeyBars(b, ...spots['monkey bars']);
  P.fourSquare(b, ...spots['blacktop four square']);
  P.slide(b, ...spots['under the slide']);
  P.sandbox(b, ...spots.sandbox);
  P.tree(b, ...spots['the big oak tree'], 1.7, 0);
  b.add(
    new THREE.CylinderGeometry(1, 1, 1, 4),
    '#c68b59',
    [30, 0.02, -36],
    [0, 0, 0],
    [6, 0.04, 6],
    null,
    'dirt',
  );
  for (const [bx, bz] of [
    [25, -36],
    [30, -31],
    [35, -36],
    [30, -41],
  ])
    b.box(0.6, 0.06, 0.6, '#ffffff', bx, 0.03, bz, { rot: [0, Math.PI / 4, 0], mat: 'rubber' });
  zone(sc, 'playground', 0, -33, 80, 30, {
    spots: Object.fromEntries(Object.entries(spots).map(([k, [x, z]]) => [k, { x, z }])),
  });
  sc.schoolField = { x: 30, z: -36 };
  // front: lawn, flag, sign, bus loop
  b.box(30, 0.06, 40, '#55585e', -94, 0, 0, { mat: 'asphalt' });
  sidewalk(b, -80, 0, 4, 8);
  b.box(4, 0.8, 0.6, '#b5543c', -86, 0, 8, { mat: 'brick' });
  P.addSign(sc.group, 'SUNCREST ACADEMY', -86, 1.5, 8.35, 4.6, 0, { bg: '#1d3557', color: '#ffd166' });
  b.cyl(0.07, 0.09, 9, '#d0d7df', -84, 0, -6, { mat: 'metal', collide: true });
  b.box(1.6, 1.0, 0.03, '#d62828', -83.2, 7.8, -6, {
    mat: 'fabric',
    shade: (x, y) => (Math.floor((y + 0.5) * 7) % 2 ? '#ffffff' : null),
  });
  b.box(0.7, 0.55, 0.035, '#1d3557', -83.55, 8.03, -6, { mat: 'fabric' });
  for (let k = 0; k < 4; k++) P.tree(b, -108 + k * 7, 18, 1.1, k % 3);
  for (let k = 0; k < 4; k++) P.tree(b, -60 + k * 30, 18, 1.0, (k + 1) % 4);
  b.rbox(2.6, 2.6, 9, '#ffbe0b', -98, 0, -10, { mat: 'shoe', collide: true });
  b.rbox(2.62, 0.9, 7, '#2b2d42', -98, 1.5, -10.3, { mat: 'glass' });
  for (const sd of [-3, 3])
    for (const sx of [-1.2, 1.2])
      b.cyl(0.42, 0.42, 0.35, '#1a1a1a', -98 + sx, 0.42, -10 + sd, {
        rot: [0, 0, Math.PI / 2],
        mat: 'rubber',
      });
  act(sc, 'exit', -100, 6, 'Leave school (Town Map)', {}, 2.6);
  sc.spawn = { x: -91, z: 0, rot: Math.PI / 2 };
  sc.grass.push(
    { x: -95, z: 18, w: 30, d: 12 },
    { x: 0, z: 19, w: 154, d: 10 },
    { x: 0, z: -33, w: 90, d: 32 },
    { x: 93, z: 12, w: 30, d: 20 },
  );
  sc.grassCount = 7000;
  return finish(sc, [
    { minX: 0, maxX: 16, minZ: -27, maxZ: -17 },
    { minX: 23, maxX: 37, minZ: -43, maxZ: -29 },
  ]);
}

export { PAL8 } from './school/classroom.js';
