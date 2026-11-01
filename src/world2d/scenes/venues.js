// Game venues: the sports fields and Hilltop.
import { PRISM } from '../build.js';
import { buildField, FIELD_SIZE } from '../fields.js';
import * as P from '../props.js';
import { act, base, finish, ground, portico, zone } from './common.js';

/** A park/league field for away games (and the school/park fields). */
export function buildVenue(sport, upgrades, colors, label) {
  const sc = base({ minX: -34, maxX: 34, minZ: -26, maxZ: 30 });
  ground(sc, 0, 0, 140, 110);
  const b = sc.b;
  for (let k = 0; k < 9; k++) P.tree(b, -32 + k * 8, -24, 1.2 + (k % 3) * 0.15, k % 4);
  for (let k = 0; k < 4; k++) P.pine(b, -30 + k * 20, 28, 1.3);
  b.box(60, 0.06, 6, '#55585e', 0, 0, 24, { mat: 'asphalt' });
  P.car(b, -14, 24, Math.PI / 2, '#e63946');
  P.car(b, 6, 24, Math.PI / 2, '#2a9d8f');
  const field = buildField(sport, upgrades, colors, 0, 2, { label });
  sc.group.add(field.group);
  sc.colliders.push(...field.colliders);
  sc.fieldInfo = field.info;
  sc.setScore = field.setScore;
  P.addSign(sc.group, label, 0, 4.5, -20, 6);
  sc.spawn = { x: 0, z: 20, rot: Math.PI };
  sc.grass.push({ x: -28, z: 0, w: 10, d: 40 }, { x: 28, z: 0, w: 10, d: 40 });
  return finish(sc, [{ minX: -18, maxX: 18, minZ: -14, maxZ: 18 }]);
}
/**
 * Hilltop Prep: the fancy private school up in Oakridge Heights. Iron gates, a
 * stone main hall with columns and a clock tower, a quad with a fountain and
 * clipped hedges, and a pristine field behind the hall (where the Crest Cup is
 * played).
 */
export function buildHilltop(sport = 'soccer') {
  const sc = base({ minX: -40, maxX: 40, minZ: -60, maxZ: 34 });
  const b = sc.b;
  const NAVY = '#13294b';
  const GOLD = '#f2c14e';
  const STONE = '#d9d2c3';
  ground(sc, 0, -12, 120, 120, 'grass', '#5f9a3c');
  // Driveway and iron gate at the south edge.
  b.box(10, 0.06, 12, '#8a8279', 0, 0, 30, { mat: 'concrete' });
  for (const sd of [-1, 1]) {
    b.box(1.1, 3.2, 1.1, STONE, sd * 5.6, 0, 26, { mat: 'stucco', collide: true });
    b.sphere(0.45, GOLD, sd * 5.6, 3.5, 26, [1, 1, 1], { mat: 'metal' });
    for (let k = 0; k < 14; k++)
      b.box(0.08, 2.4, 0.08, '#1d1d1f', sd * (6.6 + k * 1.2), 0, 26, { mat: 'metal' });
    b.box(16.8, 0.12, 0.12, '#1d1d1f', sd * 14.4, 2.2, 26, { mat: 'metal' });
    sc.colliders.push({
      minX: Math.min(sd * 6.2, sd * 23),
      maxX: Math.max(sd * 6.2, sd * 23),
      minZ: 25.8,
      maxZ: 26.2,
    });
  }
  P.addSign(sc.group, 'HILLTOP PREPARATORY ACADEMY', 0, 4.3, 26.6, 6, 0, { bg: NAVY, color: GOLD });
  // The quad: stone paths, fountain, hedges, lamps and benches.
  b.box(4, 0.08, 22, '#cfc6b4', 0, 0, 15, { mat: 'stucco' });
  b.box(30, 0.08, 3, '#cfc6b4', 0, 0, 16, { mat: 'stucco' });
  b.cyl(3.2, 3.4, 0.6, STONE, 0, 0, 16, { mat: 'stucco', collide: true });
  b.cyl(2.9, 2.9, 0.05, '#5fa8d3', 0, 0.55, 16, { mat: 'glass' });
  b.cyl(0.35, 0.5, 1.6, STONE, 0, 0.6, 16, { mat: 'stucco' });
  b.cyl(1.0, 0.6, 0.3, STONE, 0, 2.1, 16, { mat: 'stucco' });
  b.sphere(0.25, '#9ed2f0', 0, 2.6, 16, [1, 1.6, 1], { mat: 'glass' });
  for (const [hx, hz] of [
    [-9, 11],
    [9, 11],
    [-9, 21],
    [9, 21],
    [-17, 16],
    [17, 16],
  ])
    b.rbox(5, 1.1, 1.4, '#2f6b2f', hx, 0, hz, { mat: 'grass', collide: true });
  for (const [lx, lz] of [
    [-3, 9],
    [3, 9],
    [-3, 23],
    [3, 23],
  ])
    P.streetLamp(b, lx, lz);
  for (const [bx, bz, r] of [
    [-6, 13.6, 0],
    [6, 13.6, 0],
    [-6, 18.4, Math.PI],
    [6, 18.4, Math.PI],
  ])
    P.bench(b, bx, bz, r, '#3b2a1e');
  for (let k = 0; k < 6; k++) {
    P.tree(b, -34 + (k % 2) * 4, 22 - k * 9, 1.4, 1);
    P.tree(b, 34 - (k % 2) * 4, 22 - k * 9, 1.4, 1);
  }
  // Main hall: stone, slate roof, columns, a clock tower in the middle.
  b.box(36, 6, 9, STONE, 0, 0, 1.5, { mat: 'stucco', collide: true });
  b.add(PRISM, '#3d4652', [0, 6, 1.5], [0, 0, 0], [37, 2.6, 10], null, 'shingle');
  for (let k = 0; k < 8; k++)
    for (const row of [1.8, 4.2])
      b.box(1.3, 1.5, 0.08, '#2e3f55', -15 + k * 4.3 + (k > 3 ? 0 : 0), row, 6.05, { mat: 'glass' });
  portico(b, 0, 7.4, 9, 6, 4.6, '#efe9dc', 1);
  b.box(4, 13, 4, STONE, 0, 0, 1.5, { mat: 'stucco' });
  b.add(PRISM, '#3d4652', [0, 13, 1.5], [0, 0, 0], [4.4, 3.4, 4.4], null, 'shingle');
  b.cyl(1.2, 1.2, 0.12, '#fffdf2', 0, 10.6, 3.55, { mat: 'plastic', rot: [Math.PI / 2, 0, 0] });
  b.box(0.1, 0.9, 0.06, '#1d1d1f', 0, 10.6, 3.65, { mat: 'metal' });
  b.box(0.6, 0.1, 0.06, '#1d1d1f', 0.25, 10.6, 3.66, { mat: 'metal' });
  P.addSign(sc.group, 'Est. 1902 · Excellentia, Elegantia, Endowment', 0, 6.9, 6.1, 5.2, 0, {
    bg: '#efe9dc',
    color: NAVY,
  });
  for (const fx of [-17.4, 17.4]) {
    b.box(0.15, 8, 0.15, '#c0c6cc', fx, 0, 6.5, { mat: 'metal' });
    b.box(1.6, 1.0, 0.04, fx < 0 ? NAVY : GOLD, fx + (fx < 0 ? 0.85 : -0.85), 7, 6.5, { mat: 'fabric' });
  }
  // Paths around the hall to the field behind it.
  for (const sd of [-1, 1]) b.box(3, 0.08, 18, '#cfc6b4', sd * 20, 0, -2, { mat: 'stucco' });
  // The field: every upgrade money can buy, in Hilltop colors.
  const up = {
    goals: 4,
    lines: 4,
    flags: 4,
    benches: 4,
    seating: 3,
    scoreboard: 3,
    announcer: 3,
    concessions: 3,
    uniforms: 4,
    training: 3,
  };
  const field = buildField(sport, up, [NAVY, GOLD], 0, -32, { label: 'HAWKS' });
  sc.group.add(field.group);
  sc.colliders.push(...field.colliders);
  sc.fieldInfo = field.info;
  sc.setScore = field.setScore;
  P.addSign(sc.group, 'Hilltop Prep Campus Field · Home of the Hawks', 0, 4.5, -54, 7, 0, {
    bg: NAVY,
    color: GOLD,
  });
  // Zones for kids, and things to look at.
  zone(sc, 'quad', 0, 16, 26, 12);
  zone(sc, 'courtyard', 0, 11, 14, 4);
  zone(sc, 'field', field.info.cx, field.info.cz, FIELD_SIZE[sport].L * 0.7, FIELD_SIZE[sport].W * 0.6);
  act(sc, 'hilltop-plaque', 0, 10.2, 'Read the plaque');
  act(sc, 'hilltop-scout', 14, -12, 'Watch the Hawks (scouting report)');
  act(sc, 'exit', 0, 31, 'Leave (Town Map)', {}, 2.6);
  sc.spawn = { x: 0, z: 29, rot: Math.PI };
  sc.grass.push({ x: -26, z: 14, w: 14, d: 20 }, { x: 26, z: 14, w: 14, d: 20 });
  return finish(sc, [{ minX: -22, maxX: 22, minZ: -52, maxZ: -12 }]);
}
