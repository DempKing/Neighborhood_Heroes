// School service rooms: office, nurse, gym, cafeteria, library and the rest.
import { hashString, mulberry32 } from '../../../game/rng.js';
import { makeArea, wallPicture } from '../../buildings.js';
import * as P from '../../props.js';
import { posterTexture } from '../../textures.js';
import { act, zone } from '../common.js';
import { SLOT } from './classroom.js';

export function serviceRoom(sc, school, name, x, north, span = 1) {
  const z = north ? -8 : 8;
  const cx = x + ((span - 1) * SLOT) / 2;
  const w = span * SLOT;
  const col =
    {
      office: '#e9ecef',
      detention: '#d6d6d6',
      cafeteria: '#fff1c1',
      'band room': '#ffe8a3',
      'school library': '#e2f0cb',
      'after-care room': '#e8fff0',
      nurse: '#e0f2f1',
      "teachers' lounge": '#efe0d0',
    }[name] || '#f1e3c8';
  const floor = {
    color: name === 'cafeteria' ? '#e8e3d8' : '#d8c6a8',
    mat:
      name === 'cafeteria'
        ? 'checker'
        : name === 'school library' || name === 'after-care room'
          ? 'carpet'
          : name === 'nurse'
            ? 'tile'
            : 'wood',
  };
  const a = makeArea(sc, {
    id: `s-${name}`,
    x: cx,
    z,
    w: w - 0.2,
    d: 9.8,
    wallH: 3.4,
    parent: 'school',
    mode: 'cutaway',
    focus: true,
    lid: true,
    ext: { color: '#e9e2d0', mat: 'paint' },
    int: { color: col, mat: 'paint' },
    floor,
    doors:
      span > 1
        ? [
            { side: north ? 'S' : 'N', at: -w / 4, w: 2.4, glass: true },
            { side: north ? 'S' : 'N', at: w / 4, w: 2.4, glass: true },
          ]
        : [{ side: north ? 'S' : 'N', at: 3.5, w: 1.6, color: '#7a5233' }],
  });
  const ab = a.b;
  const hz = north ? -2.95 : 2.95;
  P.addSign(
    school.contents,
    name.replace(/\b\w/g, (m) => m.toUpperCase()),
    span > 1 ? cx : x + 3.5,
    2.48,
    hz + (north ? 0.03 : -0.03),
    Math.min(3.2, name.length * 0.2 + 0.8),
    north ? 0 : Math.PI,
    { bg: '#ffd166', color: '#1d3557' },
  );
  const back = north ? z - 3.8 : z + 3.8;
  const extra = {};
  const hs = north ? 1 : -1; // toward the hallway wall
  const hw = z + hs * 4.77;
  const fwall = z - hs * 4.77; // inside faces: hallway wall, far wall
  const rotIn = north ? Math.PI : 0;
  const rotOut = north ? 0 : Math.PI; // facing into the room / toward the hallway
  const xl = cx - w / 2 + 0.22;
  const xr = cx + w / 2 - 0.22; // inside faces of the side walls
  if (name === 'cafeteria') {
    extra.seats = [];
    for (let r2 = 0; r2 < 3; r2++)
      for (let c = 0; c < 4; c++) {
        const tx = cx - 11 + c * 6.5;
        const tz = z - 2.4 + r2 * 2.6;
        P.lunchTable(ab, tx, tz, ['#8ecae6', '#ffb703', '#90be6d'][r2]);
        for (const off of [-1, -0.3, 0.4, 1.1]) {
          extra.seats.push({ x: tx + off, z: tz - 0.85, rot: 0 });
          extra.seats.push({ x: tx + off, z: tz + 0.85, rot: Math.PI });
        }
      }
    P.counter(ab, cx + 14, z, 5, Math.PI / 2, '#adb5bd');
    for (let k = 0; k < 4; k++)
      ab.rbox(
        0.5,
        0.3,
        0.35,
        ['#e63946', '#f4a261', '#90be6d', '#ffd166'][k],
        cx + 14,
        1.08,
        z - 1.8 + k * 1.1,
        { mat: 'plastic' },
      );
  }
  if (name === 'school library') {
    const rng = mulberry32(31);
    for (let k = 0; k < 3; k++)
      P.shelfUnit(ab, cx - 7 + k * 7, z - hs * 4.4, { w: 4, h: 2.0, d: 0.5, rot: rotOut, rng });
  }
  if (name === 'band room')
    ab.rbox(1.8, 1.0, 0.7, '#1a1a1a', x + 2.5, 0, back, { collide: true, mat: 'wood' });
  if (name === 'office') {
    ab.rbox(2.2, 0.8, 1.0, '#6d4c41', x, 0, back + (north ? 1.4 : -1.4), { collide: true, mat: 'wood' });
    ab.rbox(0.6, 0.4, 0.5, '#2b2b2f', x - 0.5, 0.8, back + (north ? 1.4 : -1.4), { mat: 'plastic' });
    act(sc, 'principal', x, z + (north ? -1 : 1), "Principal Plunkett's desk");
    zone(sc, 'office', x, z, 8, 6, { boss: { x, z: back + (north ? 0.6 : -0.6) } });
  }
  if (name === 'nurse') {
    ab.rbox(1.0, 0.6, 2.2, '#ffffff', x + 2.5, 0, z, { collide: true, mat: 'fabric' });
    ab.rbox(1.2, 1.6, 0.6, '#d0d7df', x - 3.5, 0, back, { mat: 'metal' });
    act(sc, 'nurse', x - 1, z, 'Nurse (lie down: skip class... risky)');
  }
  if (name === 'detention')
    for (let k = 0; k < 6; k++) P.studentDesk(ab, x - 3 + (k % 3) * 3, z + (k < 3 ? -1.5 : 1.5), Math.PI / 2);
  if (name === 'after-care room')
    for (let k = 0; k < 4; k++)
      ab.sphere(0.5, ['#ff595e', '#ffca3a', '#8ac926', '#1982c4'][k], x - 3 + k * 2, 0.35, z, [1, 0.7, 1], {
        mat: 'fabric',
      });
  if (name === "teachers' lounge") {
    ab.rbox(2.4, 0.5, 1.0, '#6c5ce7', x, 0, back, { collide: true, mat: 'fabric' });
    ab.rbox(0.8, 1.7, 0.7, '#e9ecef', x + 3.5, 0, back, { mat: 'metal' });
  }
  // Furnishings per room (all against walls / clear of the door, desks and NPC spots)
  const frng = mulberry32(hashString(name) + Math.round(cx));
  const flag = (fx, fz) => {
    ab.cyl(0.015, 0.015, 1.7, '#b08d57', fx, 0, fz, { mat: 'metal' });
    ab.box(0.62, 0.42, 0.02, '#b22234', fx + 0.31, 1.2, fz, { mat: 'fabric' });
    ab.box(0.26, 0.22, 0.025, '#3c3b6e', fx + 0.13, 1.4, fz, { mat: 'fabric' });
  };
  if (name === 'office') {
    P.counter(ab, x - 2.5, z + hs * 2.4, 4.0, 0, '#6d8fb3');
    const cf = P.frame(ab, x - 3.4, z + hs * 2.4, rotOut);
    cf.box(0.5, 0.34, 0.04, '#1a1a1a', 0, 1.2, 0, 'plastic')
      .box(0.44, 0.28, 0.01, '#4cc9f0', 0, 1.23, 0.025, 'glow')
      .box(0.06, 0.13, 0.06, '#2b2b2f', 0, 1.07, 0, 'plastic');
    ab.cyl(0.07, 0.08, 0.06, '#d4af37', x - 1.2, 1.07, z + hs * 2.3, { mat: 'metal' });
    for (let k = 0; k < 3; k++)
      ab.box(0.3, 0.02, 0.22, '#ffffff', x - 2.2 + k * 0.05, 1.07 + k * 0.02, z + hs * 2.4, { mat: 'plain' });
    for (let k = 0; k < 3; k++) P.chair(ab, x + 0.2 + k * 0.62, hw - hs * 0.35, rotIn, '#457b9d');
    for (let k = 0; k < 2; k++) P.fileCabinet(ab, x + 3.0 + k * 0.55, fwall + hs * 0.32, rotOut);
    P.shelfUnit(ab, x - 2.8, fwall + hs * 0.22, { w: 1.8, h: 1.9, d: 0.4, rot: rotOut, rng: frng });
    flag(x + 1.6, fwall + hs * 0.5);
    for (const sd of [-0.75, 0.75]) P.chair(ab, x + sd, z - hs * 1.4, rotIn, '#6d4c41', 'wood');
    ab.box(0.3, 0.08, 0.05, '#d4af37', x + 0.45, 0.8, back + hs * 1.0, { mat: 'metal' });
    P.tableLamp(ab, x + 0.75, 0.8, back + hs * 1.25, '#2d6a4f', '#d4af37');
    P.plant(ab, x - 4.75, hw - hs * 0.4, 1.2);
    P.wallClock(ab, x - 1.2, 2.5, hw, rotIn);
    wallPicture(a.contents, posterTexture(43), x + 1.5, 1.9, hw - hs * 0.02, 0.9, 0.9, rotIn);
  }
  if (name === 'nurse') {
    ab.rbox(0.7, 0.12, 0.35, '#ffffff', x + 2.5, 0.6, z - hs * 0.8, { mat: 'fabric' });
    ab.box(0.96, 0.03, 1.4, '#bde0fe', x + 2.5, 0.6, z + hs * 0.3, { mat: 'fabric' });
    ab.box(0.04, 0.04, 2.8, '#c0c7cf', x + 1.75, 2.15, z, { mat: 'metal' });
    ab.box(0.04, 1.75, 1.0, '#a8dadc', x + 1.75, 0.38, z + hs * 0.85, { mat: 'fabric' });
    const ef = P.frame(ab, xl, z + hs * 0.8, Math.PI / 2);
    ef.box(0.5, 0.8, 0.02, '#ffffff', 0, 1.3, 0.01, 'plain');
    for (let k = 0; k < 6; k++)
      ef.box(0.36 - k * 0.055, 0.05, 0.01, '#1a1a1a', 0, 1.95 - k * 0.11, 0.022, 'plain');
    const nf = P.frame(ab, x - 1.5, fwall + hs * 0.3, rotOut);
    nf.box(1.0, 0.85, 0.55, '#f8f9fa', 0, 0, 0, 'wood')
      .box(1.05, 0.05, 0.6, '#adb5bd', 0, 0.85, 0, 'tile')
      .box(0.4, 0.02, 0.32, '#8a9199', 0, 0.9, 0.02, 'metal');
    nf.cyl(0.02, 0.02, 0.25, '#c0c7cf', 0, 0.9, -0.2, 'metal')
      .box(0.03, 0.03, 0.14, '#c0c7cf', 0, 1.13, -0.14, 'metal')
      .solid(1.0, 0.55);
    ab.box(0.36, 0.05, 0.36, '#e9ecef', xl + 0.35, 0, z + hs * 2.0, { mat: 'metal' });
    ab.box(0.05, 1.4, 0.05, '#adb5bd', xl + 0.2, 0, z + hs * 2.0, { mat: 'metal' });
    ab.box(0.12, 0.18, 0.2, '#e9ecef', xl + 0.24, 1.4, z + hs * 2.0, { mat: 'metal' });
    const af = P.frame(ab, x - 2.0, hw, rotIn);
    af.box(0.42, 0.36, 0.12, '#ffffff', 0, 1.3, 0.06, 'plastic')
      .box(0.06, 0.2, 0.01, '#e63946', 0, 1.38, 0.125, 'plastic')
      .box(0.2, 0.06, 0.01, '#e63946', 0, 1.45, 0.125, 'plastic');
    P.stool(ab, x + 1.3, z - hs * 1.3, 0.55, '#2b2d42');
    P.trashCan(ab, x - 0.4, fwall + hs * 0.3, '#e63946', 0.8);
    P.wallClock(ab, x - 0.5, 2.5, hw, rotIn);
  }
  if (name === 'detention') {
    P.teacherDesk(ab, x - 4.2, z - hs * 3.5, Math.PI / 2);
    P.wallClock(ab, xl, 2.55, z, Math.PI / 2, 0.32);
    P.addSign(a.contents, 'NO TALKING!', xl + 0.03, 1.75, z, 2.2, Math.PI / 2, {
      bg: '#1d3557',
      color: '#ffffff',
    });
    P.trashCan(ab, xl + 0.3, z + hs * 4.3, '#6c757d', 0.85);
    P.plant(ab, xr - 0.4, fwall + hs * 0.4, 0.9, '#9aa0a6', '#6b8f71');
  }
  if (name === 'school library') {
    P.counter(ab, cx, z + 1.0, 2.6, 0, '#8d5a3b');
    ab.box(0.5, 0.34, 0.04, '#1a1a1a', cx - 0.7, 1.12, z + 1.15, { mat: 'plastic' });
    ab.box(0.44, 0.28, 0.01, '#4cc9f0', cx - 0.7, 1.15, z + 1.175, { mat: 'glow' });
    for (let k = 0; k < 4; k++)
      ab.box(
        0.3,
        0.06,
        0.22,
        ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d'][k],
        cx + 0.6,
        1.07 + k * 0.06,
        z + 0.95,
        { mat: 'fabric', rot: [0, k * 0.15, 0] },
      );
    ab.cyl(2.2, 2.2, 0.03, '#ffafcc', cx - 7.5, 0.05, z + 0.3, { mat: 'carpet' });
    for (let k = 0; k < 4; k++) {
      const ang = -0.6 + k * 0.9;
      P.beanbag(
        ab,
        cx - 7.5 + Math.cos(ang) * 1.4,
        z + 0.3 + Math.sin(ang) * 1.4,
        ['#ff595e', '#ffca3a', '#8ac926', '#1982c4'][k],
      );
    }
    P.shelfUnit(ab, xl + 0.22, z + 0.5, { w: 3, h: 1.2, d: 0.4, shelves: 3, rot: Math.PI / 2, rng: frng });
    for (const zz of [z - 2, z - 0.5, z + 1]) P.computerDesk(ab, xr - 0.33, zz, -Math.PI / 2, '#e85d04');
    P.table(ab, cx + 5.5, z + 1.2, 2.2, 1.0, 0.72, '#c99a6b');
    ab.colliders.push({ minX: cx + 4.4, maxX: cx + 6.6, minZ: z + 0.7, maxZ: z + 1.7 });
    for (const sd of [-0.6, 0.6]) {
      P.chair(ab, cx + 5.5 + sd, z + 0.45, 0, '#2a9d8f');
      P.chair(ab, cx + 5.5 + sd, z + 1.95, Math.PI, '#2a9d8f');
    }
    const bc = P.shelfUnit(ab, cx + 2.4, z + 1.0, {
      w: 0.9,
      h: 0.75,
      d: 0.45,
      shelves: 2,
      rot: Math.PI / 2,
      rng: frng,
      solid: false,
      color: '#6c757d',
      mat: 'metal',
    });
    for (const [dx, dz] of [
      [-0.4, -0.18],
      [0.4, -0.18],
      [-0.4, 0.18],
      [0.4, 0.18],
    ])
      bc.ball(0.05, '#1a1a1a', dx, 0.0, dz, 'rubber');
    P.table(ab, cx - 3.0, z + 2.6, 0.5, 0.5, 0.8, '#8a5a3b');
    ab.cyl(0.04, 0.06, 0.2, '#8a5a3b', cx - 3.0, 0.8, z + 2.6, { mat: 'wood' });
    ab.sphere(0.24, '#3a86ff', cx - 3.0, 1.24, z + 2.6, [1, 1, 1], {
      mat: 'plastic',
      shade: (px, py, pz) => (Math.sin(px * 9) + Math.cos(pz * 7) > 0.6 ? '#57cc99' : null),
    });
    P.plant(ab, xl + 0.4, hw - hs * 0.4, 1.2);
    P.plant(ab, cx + 1.6, hw - hs * 0.4, 1.1);
    P.addSign(a.contents, 'READ!', cx, 2.75, fwall + hs * 0.03, 1.8, rotOut, {
      bg: '#2a9d8f',
      color: '#ffffff',
    });
    P.wallClock(ab, cx + 7, 2.75, fwall, rotOut);
  }
  if (name === 'cafeteria') {
    const sx = cx + 14;
    ab.box(0.04, 0.42, 4.8, '#cfe8ff', sx + 0.42, 1.12, z, { mat: 'glass' });
    for (const sd of [-2.3, 2.3])
      ab.box(0.04, 0.45, 0.04, '#c0c7cf', sx + 0.42, 1.07, z + sd, { mat: 'metal' });
    for (let k = 0; k < 6; k++)
      ab.box(0.42, 0.03, 0.32, '#90be6d', sx, 1.07 + k * 0.035, z - 2.25, { mat: 'plastic' });
    ab.box(0.3, 0.12, 0.2, '#adb5bd', sx, 1.07, z + 2.2, { mat: 'metal' });
    for (let k = 0; k < 3; k++)
      ab.box(0.015, 0.14, 0.015, '#c0c7cf', sx - 0.07 + k * 0.07, 1.14, z + 2.2, { mat: 'metal' });
    const rf = P.frame(ab, xr - 0.35, z - 1.0, -Math.PI / 2);
    rf.box(1.2, 0.9, 0.7, '#c0c7cf', 0, 0, 0, 'metal').box(1.2, 0.04, 0.7, '#2b2b2f', 0, 0.9, 0, 'metal');
    for (const dx of [-0.3, 0.3]) {
      rf.cyl(0.14, 0.14, 0.12, '#9aa0a6', dx, 0.94, 0, 'metal');
      rf.box(0.5, 0.45, 0.02, '#1d2733', dx, 0.25, 0.36, 'plastic');
    }
    rf.box(1.1, 0.04, 0.04, '#9aa0a6', 0, 0.78, 0.37, 'metal').solid(1.2, 0.7);
    const ff2 = P.frame(ab, xr - 0.4, z + 1.6, -Math.PI / 2);
    ff2
      .box(1.2, 2.1, 0.75, '#d9dde2', 0, 0, 0, 'metal')
      .box(0.02, 2.0, 0.02, '#9aa0a6', 0, 0.05, 0.38, 'metal');
    for (const sd of [-0.1, 0.1]) ff2.box(0.03, 0.6, 0.04, '#9aa0a6', sd, 0.9, 0.4, 'metal');
    ff2.solid(1.2, 0.75);
    const pf2 = P.frame(ab, xr - 0.35, z + 3.6, -Math.PI / 2);
    pf2
      .box(1.4, 0.05, 0.65, '#c0c7cf', 0, 0.86, 0, 'metal')
      .box(1.3, 0.04, 0.58, '#adb5bd', 0, 0.25, 0, 'metal');
    for (const [dx, dz] of [
      [-0.66, -0.28],
      [0.66, -0.28],
      [-0.66, 0.28],
      [0.66, 0.28],
    ])
      pf2.box(0.04, 0.86, 0.04, '#9aa0a6', dx, 0, dz, 'metal');
    pf2
      .cyl(0.18, 0.16, 0.3, '#9aa0a6', -0.3, 0.91, 0, 'metal')
      .cyl(0.12, 0.12, 0.14, '#adb5bd', 0.35, 0.91, 0.05, 'metal')
      .solid(1.4, 0.65);
    const mf = P.frame(ab, cx + 11.9, fwall + hs * 0.45, rotOut);
    mf.box(1.2, 0.9, 0.8, '#ffffff', 0, 0, 0, 'plastic').box(
      1.21,
      0.18,
      0.81,
      '#1982c4',
      0,
      0.55,
      0,
      'plastic',
    );
    for (let k = 0; k < 8; k++)
      mf.box(
        0.14,
        0.2,
        0.14,
        k % 3 ? '#ffffff' : '#ff8fab',
        -0.45 + (k % 4) * 0.3,
        0.9,
        -0.15 + Math.floor(k / 4) * 0.3,
        'plastic',
      );
    mf.box(1.1, 0.03, 0.7, '#cfe8ff', 0, 1.12, 0, 'glass').solid(1.2, 0.8);
    P.addSign(a.contents, 'MILK', cx + 11.9, 1.75, fwall + hs * 0.03, 1.0, rotOut, {
      bg: '#1982c4',
      color: '#ffffff',
    });
    const mb2 = P.frame(ab, xr - 0.02, z - 1.0, -Math.PI / 2);
    mb2.box(1.7, 0.95, 0.03, '#2b2d42', 0, 1.55, 0.015, 'plastic');
    for (let k = 0; k < 5; k++)
      mb2.box(
        1.2 - (k % 2) * 0.3,
        0.06,
        0.01,
        ['#ffd166', '#ffffff', '#8ac926', '#ffffff', '#ff8fab'][k],
        -0.1,
        2.3 - k * 0.15,
        0.035,
        'plain',
      );
    for (let k = 0; k < 3; k++)
      P.trashCan(ab, xl + 0.3, z - 1.2 + k * 0.6, ['#6c757d', '#1982c4', '#2a9d8f'][k], 1.05, k > 0);
    ab.colliders.push({ minX: xl, maxX: xl + 0.55, minZ: z - 1.45, maxZ: z + 0.25 });
    P.addSign(a.contents, 'TRASH  RECYCLE  COMPOST', xl + 0.03, 1.4, z - 0.6, 1.8, Math.PI / 2, {
      bg: '#2a9d8f',
      color: '#ffffff',
    });
    P.wallClock(ab, cx, 2.7, fwall, rotOut, 0.3);
    for (const [px, seed] of [
      [cx - 8, 61],
      [cx + 4, 62],
    ])
      wallPicture(a.contents, posterTexture(seed), px, 2.0, fwall + hs * 0.02, 1.1, 1.1, rotOut);
  }
  if (name === 'band room') {
    for (let k = 0; k < 5; k++) {
      P.chair(ab, x - 2.6 + k * 1.3, z + 0.1, 0, '#2b2d42');
      P.musicStand(ab, x - 2.6 + k * 1.3, z + 0.75, Math.PI);
    }
    for (let k = 0; k < 6; k++) {
      P.chair(ab, x - 3.2 + k * 1.3, z - 1.4, 0, '#2b2d42');
      P.musicStand(ab, x - 3.2 + k * 1.3, z - 0.75, Math.PI);
    }
    P.drumKit(ab, x - 4.0, z + 3.0, Math.PI);
    const kf2 = P.frame(ab, x + 2.5, back, rotOut);
    kf2.box(1.5, 0.06, 0.2, '#ffffff', 0, 0.72, 0.42, 'plastic');
    for (let k = 0; k < 10; k++)
      if (k % 7 !== 2 && k % 7 !== 6)
        kf2.box(0.06, 0.05, 0.12, '#1a1a1a', -0.66 + k * 0.145, 0.78, 0.38, 'plastic');
    kf2.box(0.5, 0.32, 0.02, '#ffffff', 0, 1.02, 0.12, 'plain', { rx: -0.2 });
    kf2.box(0.9, 0.45, 0.35, '#1a1a1a', 0, 0, 0.95, 'wood').solid(0.9, 0.35, 0, 0.95);
    const xf = P.frame(ab, xl + 0.45, z, Math.PI / 2);
    for (const sd of [-0.5, 0.5]) xf.box(0.04, 0.7, 0.4, '#6d4630', sd, 0, 0, 'wood');
    for (let k = 0; k < 8; k++)
      xf.box(
        0.09,
        0.03,
        0.4 - k * 0.025,
        ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#52a675', '#1982c4', '#4267ac', '#6a4c93'][k],
        -0.42 + k * 0.12,
        0.72,
        0,
        'wood',
      );
    xf.solid(1.1, 0.45);
    ab.box(2.2, 0.04, 0.3, '#8d5a3b', x - 0.5, 1.45, fwall + hs * 0.15, { mat: 'wood' });
    for (let k = 0; k < 3; k++) {
      const tf2 = P.frame(ab, x - 1.2 + k * 0.7, fwall + hs * 0.15, 0);
      tf2.hcyl(0.025, 0.45, '#e0b84a', 0, 1.56, 0, 'x', 'metal');
      ab.cone(0.08, 0.14, '#e0b84a', x - 1.2 + k * 0.7 + 0.28, 1.49, fwall + hs * 0.15, {
        rot: [0, 0, Math.PI / 2],
        mat: 'metal',
      });
    }
    const gf = P.frame(ab, xr - 0.45, z + 2.6, -Math.PI / 2);
    gf.ball(0.2, '#c1121f', 0, 0.42, 0, 'plastic', [1, 1.2, 0.35]).ball(
      0.15,
      '#c1121f',
      0,
      0.72,
      0,
      'plastic',
      [1, 1, 0.35],
    );
    gf.box(0.06, 0.6, 0.03, '#5b3a1e', 0, 0.85, 0, 'wood').box(0.3, 0.3, 0.3, '#2b2b2f', 0, 0, -0.1, 'metal');
    P.wallClock(ab, x - 2, 2.6, hw, rotIn);
    wallPicture(a.contents, posterTexture(55), x + 1.5, 1.9, hw - hs * 0.02, 0.9, 0.9, rotIn);
  }
  if (name === 'after-care room') {
    P.rug(ab, x - 0.5, z, 6.6, 2.4, '#90be6d', '#ffd166');
    for (const dx of [-3, 0])
      P.shelfUnit(ab, x + dx, fwall + hs * 0.22, {
        w: 2,
        h: 1.1,
        d: 0.4,
        shelves: 2,
        rot: rotOut,
        fill: 'toys',
        color: '#f4f1ea',
        rng: frng,
      });
    P.table(ab, x + 2.8, z - hs * 2.6, 1.4, 0.9, 0.55, '#ffbe0b', 0, 'plastic');
    ab.colliders.push({ minX: x + 2.1, maxX: x + 3.5, minZ: z - hs * 2.6 - 0.45, maxZ: z - hs * 2.6 + 0.45 });
    for (const [dx, dz, r] of [
      [-0.4, -0.7, 0],
      [0.4, -0.7, 0],
      [-0.4, 0.7, Math.PI],
      [0.4, 0.7, Math.PI],
    ])
      P.chair(
        ab,
        x + 2.8 + dx,
        z - hs * 2.6 + dz,
        r,
        ['#e63946', '#3a86ff', '#8ac926', '#8338ec'][Math.abs(Math.round(dx * 5 + dz * 3)) % 4],
      );
    ab.box(0.5, 0.02, 0.5, '#e9c46a', x + 2.8, 0.55, z - hs * 2.6, { mat: 'plain' });
    const ef2 = P.frame(ab, xl + 0.5, z - hs * 2.0, Math.PI / 2);
    ef2
      .box(0.04, 1.4, 0.04, '#8d5a3b', -0.3, 0, 0.1, 'wood')
      .box(0.04, 1.4, 0.04, '#8d5a3b', 0.3, 0, 0.1, 'wood')
      .box(0.04, 1.4, 0.04, '#8d5a3b', 0, 0, -0.3, 'wood');
    ef2
      .box(0.7, 0.8, 0.03, '#ffffff', 0, 0.7, 0.14, 'plain')
      .box(0.3, 0.3, 0.01, '#ff595e', -0.1, 0.95, 0.16, 'plain')
      .box(0.25, 0.15, 0.01, '#1982c4', 0.15, 0.8, 0.16, 'plain');
    P.wallClock(ab, x - 1, 2.6, hw, rotIn);
  }
  if (name === "teachers' lounge") {
    P.table(ab, x - 2.5, z - hs * 0.5, 1.1, 1.1, 0.75, '#c99a6b');
    ab.colliders.push({
      minX: x - 3.05,
      maxX: x - 1.95,
      minZ: z - hs * 0.5 - 0.55,
      maxZ: z - hs * 0.5 + 0.55,
    });
    for (const [dx, dz, r] of [
      [0, -0.85, 0],
      [0, 0.85, Math.PI],
      [-0.85, 0, Math.PI / 2],
    ])
      P.chair(ab, x - 2.5 + dx, z - hs * 0.5 + dz, r, '#6d4c41', 'wood');
    P.counter(ab, xl + 0.45, z - hs * 1.5, 2.4, Math.PI / 2, '#adb5bd');
    ab.box(0.4, 0.28, 0.5, '#2b2b2f', xl + 0.45, 1.07, z - hs * 2.2, { mat: 'plastic' });
    ab.box(0.24, 0.36, 0.24, '#1a1a1a', xl + 0.45, 1.07, z - hs * 1.2, { mat: 'plastic' });
    for (let k = 0; k < 3; k++)
      ab.cyl(
        0.04,
        0.04,
        0.09,
        ['#ffffff', '#e63946', '#ffd166'][k],
        xl + 0.4,
        1.07,
        z - hs * (0.6 - k * 0.12),
        { mat: 'plastic' },
      );
    P.vendingMachine(ab, xr - 0.45, z + hs * 0.5, -Math.PI / 2, '#d62828', frng);
    P.bulletinBoard(ab, x - 1.5, 1.9, hw, 1.6, 0.9, rotIn, Math.round(cx));
    P.plant(ab, x + 1.8, fwall + hs * 0.4, 1.1);
  }
  if (name !== 'office') zone(sc, name, cx, z, w - 2, 7, extra);
  return a;
}
