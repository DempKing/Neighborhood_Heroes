// The neighbourhood: streets, houses and the park.
import { hashString, mulberry32 } from '../../game/rng.js';
import { PRISM } from '../build.js';
import * as P from '../props.js';
import * as THREE from '../three2d.js';
import { act, base, finish, ground, road, sidewalk, zone } from './common.js';

// ======================================================== NEIGHBORHOOD ==
const HOOD_STYLE = {
  maple: {
    walls: ['#f2d6a2', '#e8b78e', '#f6e2b3', '#d9a87a', '#cfe0c3'],
    roofs: ['#7a3b2e', '#5b4a42', '#4a4f57'],
    tree: 4,
    styles: ['ranch', 'craftsman', 'colonial'],
  },
  sunnyside: {
    walls: ['#fff1a8', '#ffd6a5', '#fdffb6', '#caffbf', '#bde0fe'],
    roofs: ['#c0503a', '#e76f51', '#8c4a3a'],
    tree: 3,
    styles: ['ranch', 'craftsman'],
  },
  pickle: {
    walls: ['#d8f3dc', '#b7e4c7', '#e9f5db', '#cfe1b9', '#f1f1e6'],
    roofs: ['#386641', '#4f5d4a', '#6a5a4a'],
    tree: 2,
    styles: ['farm', 'ranch'],
  },
  oakridge: {
    walls: ['#f8f9fa', '#e9ecef', '#f1e3d3', '#e2ece9'],
    roofs: ['#3b3f47', '#2f3238', '#5b4a42'],
    tree: 0,
    styles: ['colonial'],
    big: true,
  },
  riverside: { walls: ['#c98b5e', '#b97a52', '#a96a48'], roofs: ['#6d4c41'], tree: 1, apts: true },
  oldtown: {
    walls: ['#c96a4e', '#b85c38', '#d08c60', '#a44a3f'],
    roofs: ['#3d2b26', '#4a3a32'],
    tree: 1,
    styles: ['colonial'],
    brick: true,
  },
};
export function buildNeighborhood(hoodId, residents, opts = {}) {
  const st = HOOD_STYLE[hoodId];
  const sc = base({ minX: -74, maxX: 86, minZ: -38, maxZ: 30 });
  const b = sc.b;
  const rng = mulberry32(hashString(hoodId));
  ground(sc, 6, -4, 190, 90);
  road(b, 2, 0, 150, 7);
  for (const sd of [-1, 1]) sidewalk(b, 2, sd * 4.75, 150, 2);
  // cul-de-sac
  b.cyl(10, 10, 0.05, '#55585e', 80, 0, 0, { mat: 'asphalt' });
  b.cyl(3, 3, 0.18, '#83c35a', 80, 0, 0, { mat: 'grass' });
  P.tree(b, 80, 0, 0.9, st.tree);
  zone(sc, 'cul-de-sac', 80, 0, 12, 12);
  // creek with a little bridge
  b.box(170, 0.06, 4.5, '#3f8cc4', 6, -0.1, -31, { mat: 'water' });
  b.box(170, 0.04, 6.5, '#9c8f74', 6, -0.12, -31, { mat: 'dirt' });
  sc.colliders.push(
    { minX: -80, maxX: -3, minZ: -33.5, maxZ: -28.5 },
    { minX: 3, maxX: 92, minZ: -33.5, maxZ: -28.5 },
  );
  b.box(5, 0.3, 6, '#8d5a3b', 0, 0.05, -31, { mat: 'wood' });
  for (const sd of [-2.4, 2.4]) {
    b.box(0.12, 0.9, 6, '#6e4a2c', sd, 0.35, -31, { mat: 'wood' });
  }
  for (let i = 0; i < 18; i++)
    b.sphere(0.35 + rng() * 0.4, '#8f948c', -60 + rng() * 140, 0.0, -28.4 - rng() * 0.6, [1.3, 0.55, 1], {
      low: true,
      mat: 'concrete',
    });
  zone(sc, 'creek', 10, -26.5, 30, 3);
  if (opts.tire) {
    act(sc, 'tire', 18, -26.8, 'An old tire! (take it)');
    b.add(
      new THREE.TorusGeometry(0.45, 0.18, 10, 20),
      '#1d1d1d',
      [18, 0.2, -26.8],
      [Math.PI / 2, 0, 0],
      [1, 1, 1],
      null,
      'rubber',
    );
  }

  const houses = [];
  if (st.apts) {
    const blocks = {
      'Building A': [-44, -16],
      'Building B': [-12, -16],
      'Building C': [20, -16],
      'Building D': [52, -16],
    };
    for (const [name, [x, z]] of Object.entries(blocks)) {
      P.apartment(b, x, z, {
        wall: st.walls[Math.floor(rng() * st.walls.length)],
        floors: 3 + Math.floor(rng() * 2),
      });
      P.addSign(sc.group, name, x, 3.4, z + 4.62, 2.6, 0, { bg: '#1d3557', color: '#ffffff' });
      houses.push({
        address: name,
        x,
        z,
        face: 1,
        door: { x, z: z + 6 },
        porch: { x, z: z + 5.4 },
        lawn: { x, z: z + 8.2, w: 12, d: 3 },
      });
      P.bench(b, x - 4.5, z + 8, 0);
      P.bush(b, x + 5, z + 5.6);
      P.bush(b, x - 6, z + 5.6);
    }
    b.box(30, 0.08, 14, '#55585e', 40, 0, 15, { mat: 'asphalt' });
    P.car(b, 32, 14, Math.PI / 2, '#f4a261');
    P.car(b, 44, 17, Math.PI / 2, '#457b9d');
    P.swingSet(b, -20, 16);
    P.slide(b, -10, 14);
    b.box(18, 0.06, 10, '#c9b38f', -15, 0, 15, { mat: 'dirt' });
    zone(sc, 'driveway hoop', -6, 12, 6, 4);
    sc.grass.push({ x: 2, z: -10, w: 140, d: 5 }, { x: 0, z: 22, w: 120, d: 10 });
  } else {
    const n = Math.max(12, residents.length + (opts.playerHome ? 1 : 0));
    const slots = [];
    for (let i = 0; i < n && i < 20; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      // Every house faces the camera (south), like a classic 2D town: the north row
      // fronts the street; the south row turns its back to the street and is
      // reached by a side walkway.
      slots.push({
        x: -58 + Math.floor(i / 2) * 14,
        z: side < 0 ? -16 : 16 + (st.big ? 3 : 1.5),
        face: 1,
        toStreet: side < 0 ? 1 : -1,
      }); // south row set back so its roofs clear the sidewalk
    }
    const assign = [];
    if (opts.playerHome) assign.push({ address: 'Your house', you: true });
    for (const r of residents) assign.push(r);
    while (assign.length < slots.length)
      assign.push({ address: `${100 + assign.length * 10} ${hoodId} Ln`, empty: true });
    slots.forEach((s, i) => {
      const a = assign[i];
      const wall = a.you ? '#ffd6e0' : st.walls[Math.floor(rng() * st.walls.length)];
      const big = st.big ? 1.25 : 1;
      const style = st.styles[Math.floor(rng() * st.styles.length)];
      const garage = st.big ? (rng() < 0.5 ? 1 : -1) : 0;
      const h = P.house(b, s.x, s.z, {
        w: 8.4 * big,
        d: 7 * big,
        wall,
        roof: st.roofs[Math.floor(rng() * st.roofs.length)],
        face: s.face,
        style,
        brick: st.brick,
        shutter: ['#4a6fa5', '#2d6a4f', '#9d0208', '#5a189a', null][Math.floor(rng() * 5)],
        garage,
      });
      const frontZ = s.z + s.face * (3.5 * big);
      const st2 = s.toStreet; // which way the street is (+1 = south)
      const fronting = st2 === s.face; // front yard on the street side?
      const lawn = { x: s.x, z: frontZ + s.face * 5.8 + s.face * 0 - s.face * 2.6, w: 10, d: 4.2 };
      const walkEdge = st2 > 0 ? 4.75 + 1 : -4.75 - 1; // street-side edge of the sidewalk
      let drop = h.porch;
      if (fronting)
        b.box(
          1.3,
          0.06,
          Math.abs(s.z + s.face * 5.75 - frontZ) - 2,
          '#cfcac0',
          h.door.x,
          0,
          (frontZ + s.face * 1.6 + s.z + s.face * 5.75) / 2,
          { mat: 'concrete' },
        );
      else {
        // side walkway from the sidewalk around to the front door
        const sideX = s.x + (garage ? -garage : 1) * (4.2 * big + 0.9);
        const zEnd = h.door.z + s.face * 0.2;
        b.box(1.2, 0.06, Math.abs(zEnd - walkEdge), '#cfcac0', sideX, 0, (zEnd + walkEdge) / 2, {
          mat: 'concrete',
        });
        b.box(Math.abs(sideX - h.door.x) + 1.2, 0.06, 1.2, '#cfcac0', (sideX + h.door.x) / 2, 0, h.door.z, {
          mat: 'concrete',
        });
        // the backyard faces the street, behind a fence with a gap for the walkway
        const fz = s.z - s.face * (3.5 * big + 1.2);
        const col = st.big ? '#2b2d42' : '#f4ead5';
        const x0 = s.x - 6.5;
        const x1 = s.x + 6.5;
        if (sideX - 0.9 > x0) P.fence(b, x0, fz, sideX - 0.9, fz, col, 0.9);
        if (sideX + 0.9 < x1) P.fence(b, sideX + 0.9, fz, x1, fz, col, 0.9);
        drop = { x: sideX, z: walkEdge + st2 * -1.2 }; // papers land on the walkway by the sidewalk
      }
      const mail = { x: s.x + 3.6, z: s.z + st2 * 10.6 };
      P.mailbox(b, mail.x, mail.z);
      if (rng() < 0.7)
        P.tree(b, s.x - 4.3, s.z + st2 * 8.6, 0.95 + rng() * 0.35, st.tree + (rng() < 0.3 ? 1 : 0));
      for (let k = 0; k < 3; k++) P.bush(b, s.x + 1.2 + k * 1.1, frontZ + s.face * 0.7, 0.7);
      if (fronting && rng() < 0.5)
        P.fence(
          b,
          s.x - 5,
          s.z + st2 * 11.4,
          s.x - 1.5,
          s.z + st2 * 11.4,
          st.big ? '#2b2d42' : '#f4ead5',
          0.9,
        );
      const number = a.you ? 'HOME' : String(a.address).split(' ')[0];
      P.addSign(sc.group, number, mail.x, 1.62, mail.z + st2 * 0.27, 0.55, st2 > 0 ? 0 : Math.PI, {
        bg: '#ffffff',
      });
      houses.push({
        address: a.address,
        you: !!a.you,
        x: s.x,
        z: s.z,
        face: s.face,
        toStreet: st2,
        door: h.door,
        porch: h.porch,
        drop,
        mail,
        windows: h.windows,
        lawn,
      });
      if (a.you) {
        act(sc, 'go-home', h.door.x, h.door.z, 'Go inside your house');
        P.addSign(
          sc.group,
          `${opts.playerName || 'Your'}'s House`,
          s.x,
          6.6,
          s.z + s.face * 3.7,
          3,
          s.face > 0 ? 0 : Math.PI,
          { bg: '#ffe5ec' },
        );
      }
      sc.grass.push(
        { x: s.x, z: s.z + s.face * 8.5, w: 13, d: 6 },
        { x: s.x, z: s.z - s.face * 7, w: 13, d: 5 },
      );
    });
    const hh = houses[3] || houses[0];
    b.box(3.4, 0.07, 5, '#cfcac0', hh.x + 5.2, 0, hh.z + hh.face * 7.6, { mat: 'concrete' });
    b.cyl(0.07, 0.08, 3.05, '#8a8f96', hh.x + 5.2, 0, hh.z + hh.face * 5.2, { collide: true, mat: 'metal' });
    b.box(1.2, 0.85, 0.06, '#ffffff', hh.x + 5.2, 2.6, hh.z + hh.face * 5.3, { mat: 'plastic' });
    b.add(
      new THREE.TorusGeometry(0.23, 0.035, 8, 18),
      '#ff6b00',
      [hh.x + 5.2, 2.65, hh.z + hh.face * 5.6],
      [Math.PI / 2, 0, 0],
      [1, 1, 1],
      null,
      'metal',
    );
    zone(sc, 'driveway hoop', hh.x + 5.2, hh.z + hh.face * 8, 3, 3);
    if (st.brick) {
      b.box(3.2, 10, 3.2, '#8c5a3c', -66, 0, -12, { collide: true, mat: 'brick' });
      b.add(PRISM, '#4a3a32', [-66, 10, -12], [0, 0, 0], [3.6, 2.2, 3.6], null, 'shingle');
      b.cyl(1.0, 1.0, 0.2, '#fff8e7', -66, 7.8, -10.3, { rot: [Math.PI / 2, 0, 0], mat: 'glow' });
      P.addSign(sc.group, 'OLD TOWN', -66, 9.4, -10.35, 2.6, 0, { bg: '#3d2b26', color: '#ffd166' });
    }
  }
  for (let i = -6; i <= 7; i++) P.streetLamp(b, i * 12 + 4, i % 2 ? 5.9 : -5.9);
  zone(sc, 'street', 0, 0, 90, 8);
  act(sc, 'lemonade', -8, 6.7, 'Set up lemonade stand here', { face: -1, walkZ: 4.75 });
  act(sc, 'exit', -70, 0, 'Leave (Town Map)', {}, 2.6);
  if (opts.paperRoute) act(sc, 'paper', -60, -4.8, 'Start paper route');
  if (opts.mowJob) {
    const target = houses[1 + (hashString(opts.mowJob.id) % Math.max(1, houses.length - 1))] || houses[0];
    sc.extra.mowLawn = { ...target.lawn, job: opts.mowJob };
    act(sc, 'mow', target.lawn.x, target.lawn.z, `Mow ${opts.mowJob.who}'s lawn ($${opts.mowJob.pay})`);
  }
  sc.houses = houses;
  sc.spawn = { x: -66, z: 0, rot: Math.PI / 2 };
  sc.grassCount = 7000;
  sc.grassSeed = hashString(hoodId);
  const avoidLawn = sc.extra.mowLawn
    ? [
        {
          minX: sc.extra.mowLawn.x - 5,
          maxX: sc.extra.mowLawn.x + 5,
          minZ: sc.extra.mowLawn.z - 2.2,
          maxZ: sc.extra.mowLawn.z + 2.2,
        },
      ]
    : [];
  return finish(sc, [{ minX: -80, maxX: 92, minZ: -6, maxZ: 6 }, ...avoidLawn]);
}
