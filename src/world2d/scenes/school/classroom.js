// School classrooms: one per teacher, with chalkboard, desks and posters.
import { roomNumber } from '../../../data/world.js';
import { mulberry32 } from '../../../game/rng.js';
import { makeArea, wallPicture } from '../../buildings.js';
import * as P from '../../props.js';
import { chalkboardTexture, posterTexture, subjectPoster } from '../../textures.js';
import { zone } from '../common.js';

// ======================================================== SCHOOL ========
// One long building: a lockers-lined main hallway with classrooms on both
// sides. Every grade has a Math, Language Arts, Science and History teacher,
// each in their own room. Rooms face west: the chalkboard is on the west wall,
// desks face it, and the door is in the hallway wall near the back.
export const SLOT = 11;
export const slotX = (i) => -71.5 + i * SLOT;
export const LOCKER_BLUE = '#4f78a6';
export const PAL8 = ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#e9c46a', '#8338ec', '#ff006e', '#06d6a0'];
export function classroom(sc, school, { x, north, teacher, subject, grade, i }) {
  const z = north ? -8 : 8;
  const doorSide = north ? 'S' : 'N';
  const DOOR_AT = 3.5;
  const wall =
    { Math: '#f3e6cf', 'Language Arts': '#e9efe0', Science: '#e2ecf4', History: '#f4e4dc' }[subject] ||
    '#efe6d2';
  const a = makeArea(sc, {
    id: `room-${teacher}`,
    x,
    z,
    w: SLOT - 0.2,
    d: 9.8,
    wallH: 3.4,
    parent: 'school',
    mode: 'cutaway',
    focus: true,
    lid: true,
    ext: { color: '#e9e2d0', mat: 'paint' },
    int: { color: wall, mat: 'paint' },
    floor: { color: '#d8cdb8', mat: 'tile' },
    doors: [{ side: doorSide, at: DOOR_AT, w: 1.6, color: '#7a5233' }],
    baseboard: '#6b5a4a',
  });
  const ab = a.b;
  const fw = x - (SLOT - 0.2) / 2 + 0.13; // inside face of the front (west) wall
  const rw = x + (SLOT - 0.2) / 2 - 0.13; // inside face of the back (east) wall
  const nW = z - 4.9 + 0.13;
  const sW = z + 4.9 - 0.13;
  const outer = north ? nW : sW; // exterior wall (windows)
  // Front: chalkboard with tray, alphabet strip, clock, flag, pull-down map.
  ab.box(0.08, 1.5, 5.6, '#7a5233', fw + 0.02, 0.85, z, { mat: 'wood' });
  wallPicture(a.contents, chalkboardTexture(subject), fw + 0.08, 1.6, z, 5.3, 1.3, Math.PI / 2);
  ab.box(0.16, 0.05, 5.4, '#9a6a44', fw + 0.1, 0.92, z, { mat: 'wood' });
  for (let k = 0; k < 4; k++)
    ab.box(0.03, 0.03, 0.12, '#ffffff', fw + 0.12, 0.97, z - 1.5 + k * 0.4, { mat: 'plastic' });
  ab.box(0.03, 0.22, 5.6, '#ffffff', fw + 0.04, 2.55, z, {
    mat: 'plastic',
    shade: (px, py, pz) =>
      ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'][Math.abs(Math.floor(pz * 26)) % 5],
  });
  ab.cyl(0.24, 0.24, 0.05, '#ffffff', fw + 0.06, 2.95, z + 3.4, { rot: [0, 0, Math.PI / 2], mat: 'plastic' });
  ab.cyl(0.26, 0.26, 0.04, '#2b2d42', fw + 0.04, 2.95, z + 3.4, { rot: [0, 0, Math.PI / 2], mat: 'plastic' });
  ab.cyl(0.015, 0.015, 1.6, '#b08d57', fw + 0.5, 0, z - 4.3, { mat: 'metal' });
  ab.box(0.02, 0.42, 0.62, '#b22234', fw + 0.5, 1.15, z - 3.98, {
    mat: 'fabric',
    shade: (px, py) => (Math.floor((py + 0.5) * 6.5) % 2 ? '#ffffff' : null),
  });
  ab.box(0.025, 0.22, 0.26, '#3c3b6e', fw + 0.5, 1.35, z - 3.79, { mat: 'fabric' });
  // Teacher's desk at the front, angled toward the class.
  P.teacherDesk(ab, fw + 1.3, z + (north ? 3.0 : -3.0), Math.PI / 2);
  // Subject touches
  if (subject === 'Science') {
    ab.rbox(0.7, 0.9, 2.2, '#3d4a57', fw + 0.5, 0, z + (north ? -2.4 : 2.4), { mat: 'metal', collide: true });
    for (let k = 0; k < 4; k++)
      ab.cyl(
        0.06,
        0.08,
        0.22,
        ['#8ac926', '#4cc9f0', '#ffca3a', '#ff595e'][k],
        fw + 0.5,
        0.9,
        z + (north ? -3.2 : 1.6) + k * 0.5,
        { mat: 'glass' },
      );
    ab.box(0.4, 0.3, 0.6, '#cfe8ff', rw - 0.6, 0.9, z + (north ? 2 : -2), { mat: 'glass' });
  } else if (subject === 'History') {
    ab.cyl(0.05, 0.08, 0.45, '#8a5a3b', rw - 0.6, 0.9, z + (north ? 2.6 : -2.6), { mat: 'wood' });
    ab.sphere(0.24, '#3a86ff', rw - 0.6, 1.58, z + (north ? 2.6 : -2.6), [1, 1, 1], {
      mat: 'plastic',
      shade: (px, py, pz) => (Math.sin(px * 9) + Math.cos(pz * 7) > 0.6 ? '#57cc99' : null),
    });
  } else if (subject === 'Language Arts') {
    ab.box(2.2, 0.02, 2.2, '#e76f51', rw - 1.6, 0.02, z + (north ? 2.6 : -2.6), { mat: 'carpet' });
    for (let k = 0; k < 3; k++)
      ab.sphere(
        0.32,
        ['#ffca3a', '#8ac926', '#1982c4'][k],
        rw - 2.4 + k * 0.8,
        0.2,
        z + (north ? 3.4 : -3.4),
        [1, 0.6, 1],
        { mat: 'fabric' },
      );
  } else {
    ab.rbox(0.5, 0.06, 2.4, '#e9c46a', rw - 0.4, 0.75, z + (north ? 2.5 : -2.5), { mat: 'wood' });
    for (let k = 0; k < 6; k++)
      ab.box(
        0.1,
        0.1,
        0.1,
        ['#ff595e', '#ffca3a', '#8ac926', '#1982c4'][k % 4],
        rw - 0.4,
        0.81,
        z + (north ? 1.6 : -3.4) + k * 0.35,
        { mat: 'plastic' },
      );
  }
  // Back wall: cubbies and a bookshelf.
  for (let r2 = 0; r2 < 3; r2++)
    for (let c2 = 0; c2 < 6; c2++) {
      const cz = z - 2.4 + c2 * 0.62 + (north ? -0.6 : 0.6);
      ab.box(0.4, 0.04, 0.6, '#c99a6b', rw - 0.22, r2 * 0.42, cz, { mat: 'wood' });
      ab.box(
        0.36,
        0.3,
        0.5,
        ['#e63946', '#2a9d8f', '#f4a261', '#457b9d', '#8338ec', '#ffbe0b'][(r2 + c2 + i) % 6],
        rw - 0.26,
        r2 * 0.42 + 0.06,
        cz,
        { mat: 'fabric' },
      );
    }
  ab.box(0.4, 1.3, 0.04, '#c99a6b', rw - 0.22, 0, z - 2.75 + (north ? -0.6 : 0.6), { mat: 'wood' });
  ab.box(0.4, 1.3, 0.04, '#c99a6b', rw - 0.22, 0, z + 1.0 + (north ? -0.6 : 0.6), { mat: 'wood' });
  // Windows on the outside wall, posters on the inside walls.
  for (const off of [-3.2, -0.6, 2.0]) {
    ab.box(1.9, 1.4, 0.03, '#bfe3ff', x + off, 1.1, outer + (north ? 0.02 : -0.02), { mat: 'glass' });
    ab.box(2.0, 0.08, 0.12, '#f4f1ea', x + off, 1.06, outer + (north ? 0.06 : -0.06), { mat: 'paint' });
  }
  for (let k = 0; k < 3; k++)
    wallPicture(
      a.contents,
      subjectPoster(subject, k + i),
      x - 2.5 + k * 2.2,
      1.85,
      (north ? sW : nW) + (north ? -0.02 : 0.02),
      1.1,
      1.1,
      north ? Math.PI : 0,
    );
  wallPicture(
    a.contents,
    posterTexture(i * 13 + 5, 'art'),
    rw - 0.04,
    2.25,
    z + (north ? 1.6 : -1.6),
    1.0,
    0.9,
    -Math.PI / 2,
  );
  // Classroom extras: stands under the subject displays, bins, plants, a low
  // bookshelf, a number line and a calendar (all along the walls, clear of desks).
  const hs = north ? 1 : -1; // toward the hallway wall
  const hw = z + hs * 4.77; // inside face of the hallway wall
  const rotIn = north ? Math.PI : 0; // facing into the room from the hallway wall
  if (subject === 'Science') {
    P.table(ab, rw - 0.6, z + hs * 2, 0.62, 0.8, 0.9, '#8d99a6', 0, 'metal');
    ab.box(0.36, 0.2, 0.56, '#4aa3df', rw - 0.6, 0.91, z + hs * 2, { mat: 'water' });
    ab.box(0.06, 0.03, 0.02, '#ff7b00', rw - 0.65, 1.02, z + hs * 2, { mat: 'plastic' });
  } else if (subject === 'History') P.table(ab, rw - 0.6, z + hs * 2.6, 0.55, 0.55, 0.9, '#8a5a3b');
  else if (subject === 'Math') ab.box(0.46, 0.75, 2.3, '#c99a6b', rw - 0.4, 0, z + hs * 2.5, { mat: 'wood' });
  P.trashCan(ab, fw + 0.35, z + 4.35, '#6c757d', 0.85);
  P.trashCan(ab, fw + 0.8, z + 4.35, '#1982c4', 0.85, true);
  P.plant(ab, rw - 0.4, z - hs * 4.3, 1.1);
  for (const off of [-3.6, 1.4])
    P.plant(ab, x + off, outer + hs * 0.08, 0.32, ['#e76f51', '#e9c46a'][Math.abs(i) % 2], '#52a675', 1.14);
  P.shelfUnit(ab, fw + 1.85, z - hs * 4.45, {
    w: 1.3,
    h: 0.85,
    d: 0.35,
    shelves: 2,
    rot: north ? 0 : Math.PI,
    color: '#c99a6b',
    rng: mulberry32(i + 3),
    solid: false,
  });
  for (let k = 0; k < 11; k++) {
    const nx = x - 4.6 + k * 0.62;
    ab.box(
      0.6,
      0.22,
      0.02,
      ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'][k % 5],
      nx,
      2.6,
      hw - hs * 0.02,
      { mat: 'paint' },
    );
    ab.box(0.14, 0.12, 0.01, '#ffffff', nx, 2.65, hw - hs * 0.035, { mat: 'plain' });
  }
  const calF = P.frame(ab, x - 4.25, hw, rotIn);
  calF
    .box(0.62, 0.72, 0.02, '#ffffff', 0, 1.45, 0.01, 'plain')
    .box(0.62, 0.14, 0.025, '#e63946', 0, 2.03, 0.012, 'plain');
  for (let k = 0; k < 4; k++) calF.box(0.54, 0.012, 0.025, '#adb5bd', 0, 1.55 + k * 0.11, 0.013, 'plain');
  // 4 rows x 6 desks, all facing the board. Row 0 is the front.
  const seats = [];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 6; col++) {
      const dx = fw + 3.0 + row * 1.5;
      const dz = z - 3.35 + col * 1.34;
      P.studentDesk(ab, dx, dz, Math.PI / 2, ['#2f6fb5', '#2f6fb5', '#e85d04', '#2f6fb5'][(row + col) % 4]);
      seats.push({ x: dx + 0.5, z: dz, rot: -Math.PI / 2 });
    }
  // Hallway side: door plaque and a bulletin board.
  const hz = north ? -2.95 : 2.95;
  P.addSign(
    school.contents,
    `${roomNumber(grade, subject)} ${subject.toUpperCase()}`,
    x + DOOR_AT,
    2.48,
    hz + (north ? 0.03 : -0.03),
    1.5,
    north ? 0 : Math.PI,
    { bg: '#1d3557', color: '#ffffff' },
  );
  P.addSign(
    school.contents,
    teacher,
    x + DOOR_AT - 1.3,
    1.6,
    hz + (north ? 0.03 : -0.03),
    0.95,
    north ? 0 : Math.PI,
    { bg: '#f4f1ea', color: '#1d3557' },
  );
  const name = `room:${teacher}`;
  zone(sc, name, x, z, SLOT - 1.6, 8.6, {
    seats,
    subject,
    grade,
    teacher: { x: fw + 1.0, z: z + (north ? 1.4 : -1.4), rot: Math.PI / 2 },
    door: { x: x + DOOR_AT, z: north ? -1.4 : 1.4, rot: north ? 0 : Math.PI },
    camYaw: Math.PI / 2,
    anchor: { x: x - 1.3, z },
  });
  return a;
}
