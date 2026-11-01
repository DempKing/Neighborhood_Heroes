// Building a location for the Game: the scene, who's there (kids and adults), pickups and the arrival banner.
import { KIDS } from '../../data/kids.js';
import { ADULTS, HOOD_BY_NAME, LOCATIONS, NEIGHBORHOODS } from '../../data/world.js';
import { jobReady, pickupsFor } from '../../game/economy.js';
import { knowsName } from '../../game/knowledge.js';
import { kitBottoms } from '../../game/league.js';
import { rivalryRecord } from '../../game/rivalry.js';
import { hashString, mulberry32 } from '../../game/rng.js';
import { hasItem, playerGrade } from '../../game/state.js';
import { dayInfo, formatTime } from '../../game/time.js';
import { Builder } from '../../world2d/build.js';
import { adultLook } from '../../world2d/looks.js';
import {
  buildGrocery,
  buildHilltop,
  buildHome,
  buildLibrary,
  buildMall,
  buildMuseum,
  buildNeighborhood,
  buildSchool,
  buildVenue,
  turnAround,
} from '../../world2d/scenes.js';
import { h } from '../dom.js';

// Locations
export function buildLocation(game, loc) {
  const s = game.state;
  const ups = s.team.upgrades;
  switch (loc) {
    case 'home':
      return turnAround(
        buildHome({
          sport: s.team.sport,
          upgrades: ups,
          colors: s.team.colors,
          trophies: s.inv.trophies,
          playerShirt: '#e63946',
        }),
      ); // front door faces the camera
    case 'school':
      return buildSchool({
        grade: playerGrade(s),
        crestCups: rivalryRecord(s)
          .games.filter((g) => g.won)
          .reverse(),
      });
    case 'mall':
      return buildMall();
    case 'library':
      return buildLibrary();
    case 'museum':
      return buildMuseum();
    case 'grocery':
      return buildGrocery();
    case 'hilltop':
      return buildHilltop(s.team.sport);
    case 'venue':
      return buildVenue(
        s.team.sport,
        game.venueUpgrades || ups,
        game.venueColors || s.team.colors,
        game.venueLabel || 'League Field',
      );
    default: {
      const hood = NEIGHBORHOODS.find((n) => n.id === loc);
      const byAddr = new Map();
      for (const k of KIDS) {
        if (HOOD_BY_NAME[k.residence.neighborhood] !== loc) continue;
        if (!byAddr.has(k.residence.address)) byAddr.set(k.residence.address, []);
        byAddr.get(k.residence.address).push(k.id);
      }
      const residents = [...byAddr.entries()]
        .sort((a, b) => hashString(a[0]) - hashString(b[0]))
        .map(([address, kidIds]) => ({ address, kidIds }));
      const mowJob = s.jobs.activeMow && s.jobs.activeMow.hood === loc ? s.jobs.activeMow : null;
      const info = dayInfo(s.time.day);
      return buildNeighborhood(hood.id, residents, {
        playerHome: loc === s.player.hood,
        playerName: s.player.name,
        tire: loc === 'pickle' && !hasItem(s, 'old_tire'),
        paperRoute:
          loc === s.player.hood &&
          jobReady(s, 'paper') &&
          s.jobs.paperDay !== s.time.day &&
          s.time.minute < (info.isSchoolDay ? 7 * 60 + 45 : 11 * 60),
        mowJob,
      });
    }
  }
}
/** Cut-to-black and fade back in, with a broadcast-style location banner. */
export function showArrival(game, loc) {
  const curtain = document.getElementById('curtain');
  const banner = document.getElementById('banner');
  if (!curtain || !banner) return;
  curtain.classList.remove('fade');
  void curtain.offsetWidth;
  curtain.classList.add('fade');
  banner.replaceChildren(
    h(
      'div',
      { class: 'banner-kicker' },
      `${dayInfo(game.state.time.day).dateLabel} · ${formatTime(game.state.time.minute)}`,
    ),
    h('div', { class: 'banner-title' }, game.locName(loc)),
    h(
      'div',
      { class: 'banner-kicker' },
      LOCATIONS[loc] && LOCATIONS[loc].kind === 'hood' ? 'A Suncrest neighborhood' : 'Suncrest',
    ),
  );
  banner.classList.remove('show');
  void banner.offsetWidth;
  banner.classList.add('show');
}
/** How to draw a kid NPC (look, spot and activity). */
export function specFor(game, kid, w, ctx) {
  const s = game.state;
  const d = game.desc;
  const z = d.zones[w.zone];
  const rng = mulberry32(hashString(kid.id + w.zone));
  const spec = { id: kid.id, kid, mode: 'wander', rot: 0, activity: w.activity, zone: w.zone };
  const place = (area, spread = 1) => {
    spec.area = area;
    spec.x = area.x + (rng() - 0.5) * area.w * spread;
    spec.z = area.z + (rng() - 0.5) * area.d * spread;
  };
  if (w.zone.startsWith('room:') && z && z.seats) {
    let idx;
    if (w.zone === ctx.homeroomZone && ctx.chart) idx = ctx.chart.indexOf(kid.id);
    if (idx == null || idx < 0) {
      const n = ctx.roomFill.get(w.zone) || 0;
      ctx.roomFill.set(w.zone, n + 1);
      idx = w.zone === ctx.homeroomZone ? z.seats.length - 1 - n : n;
    }
    const seat = z.seats[idx % z.seats.length];
    Object.assign(spec, {
      x: seat.x,
      z: seat.z,
      rot: seat.rot,
      mode: w.activity.startsWith('in class') ? 'sit' : 'wander',
      area: { x: z.x, z: z.z, w: z.w, d: z.d },
    });
    if (spec.mode !== 'sit') place(z, 0.8);
  } else if (w.zone === 'hallway' && w.toRoom && d.zones[w.toRoom] && d.zones[w.toRoom].door) {
    // Between classes: kids crowd the hallway near the door of their next class.
    const door = d.zones[w.toRoom].door;
    place({ x: door.x - 2.5, z: 0, w: 9, d: 3.2 });
  } else if (
    (w.zone === 'cafeteria' || w.zone === 'food court' || w.zone === 'homework tables') &&
    z &&
    z.seats
  ) {
    const n = ctx.roomFill.get(w.zone) || 0;
    ctx.roomFill.set(w.zone, n + 1);
    const seat = z.seats[n % z.seats.length];
    Object.assign(spec, { x: seat.x, z: seat.z, rot: seat.rot, mode: 'sit' });
  } else if (w.zone === 'playground' && z && z.spots) {
    const spot = z.spots[kid.routine.recess_spot] || Object.values(z.spots)[hashString(kid.id) % 8];
    place({ x: spot.x + 1.5, z: spot.z + 1.5, w: 5, d: 4 });
  } else if (w.zone === 'front yard' && d.houses) {
    const house =
      d.houses.find((hh) => hh.address === kid.residence.address) ||
      d.houses.find((hh) => kid.residence.address.includes(hh.address)) ||
      d.houses[hashString(kid.id) % d.houses.length];
    place(house.lawn, 0.8);
  } else if (w.zone === 'backyard' && d.fieldInfo) {
    const f = d.fieldInfo;
    place({ x: f.cx, z: f.cz, w: f.L * 0.7, d: f.W * 0.6 });
    spec.uniform = [...s.team.colors.slice(0, 2), kitBottoms(s, s.team.name)];
    spec.run = true;
  } else if (z) {
    place(z, 0.9);
  } else {
    const fb = d.zones.street ||
      d.zones.hallway ||
      Object.values(d.zones)[0] || { x: d.spawn.x, z: d.spawn.z - 4, w: 6, d: 4 };
    place(fb, 0.8);
  }
  return spec;
}
/** A kid's name tag text. */
export function tagFor(game, kid) {
  const s = game.state;
  const ks = s.kids[kid.id];
  let t = knowsName(ks) ? kid.first_name : '?';
  if (s.team.roster.includes(kid.id)) t = `★ ${t}`;
  else if (s.team.invites.includes(kid.id)) t = `✉ ${t}`;
  if (s.tasks.some((x) => x.kidId === kid.id) || (ks.favor && ks.favor.done)) t += ' !';
  // Status dot: gold = your team, green = good friends, yellow = friendly, gray = not yet.
  const color = s.team.roster.includes(kid.id)
    ? '#ffb703'
    : ks.f >= 65
      ? '#52d273'
      : ks.f >= 35
        ? '#ffe066'
        : ks.f >= 10
          ? '#a5d8ff'
          : '#adb5bd';
  return { t, color };
}
// Adults
export function addAdults(game) {
  const s = game.state;
  const d = game.desc;
  const add = (id, name, x, z, opts = {}) =>
    game.engine.addNPC({
      id: `ADULT-${id}`,
      look: adultLook(name, opts.look || {}),
      tag: name,
      tagColor: '#4dabf7',
      x,
      z,
      rot: opts.rot || 0,
      mode: opts.mode || 'idle',
      area: opts.area,
      interact: `Talk to ${name}`,
      data: { name, role: opts.role || id },
    });
  if (s.loc === 'home') {
    const xf = d.xf || ((x, z) => [x, z]);
    add('mom', 'Mom', ...xf(-6.6, -5.2), { look: { shirt: 'purple', hair: 'bob' }, role: 'parents' });
    add('dad', 'Dad', ...xf(-4.8, -5.8), {
      look: { shirt: 'navy', hair: 'side part', accessories: ['glasses'] },
      role: 'parents',
    });
  }
  if (s.loc === 'school') {
    for (const [zn, z] of Object.entries(d.zones)) {
      if (zn.startsWith('room:') && z.teacher)
        add(`t-${zn}`, zn.slice(5), z.teacher.x, z.teacher.z, { rot: z.teacher.rot ?? 0, role: 'teacher' });
    }
    if (d.zones.office)
      add('principal', 'Principal Plunkett', d.zones.office.boss.x, d.zones.office.boss.z, {
        rot: Math.PI,
        look: { shirt: 'gray', hair: 'bald', accessories: ['glasses'] },
        role: 'principal',
      });
    if (d.zones.cafeteria)
      add('lunch', 'Lunch Lady Lorraine', d.zones.cafeteria.x + 12, d.zones.cafeteria.z + 2, {
        role: 'lunch',
        look: { shirt: 'white', hair: 'curly afro' },
      });
    add('monitor', 'Hall Monitor Mr. Beasley', -30, 0, {
      role: 'monitor',
      look: { shirt: 'navy', hair: 'buzz cut' },
    });
    for (const [sp, who] of [
      ['gym', 'Coach Rhodes'],
      ['school library', 'Librarian Mr. Quill'],
      ['band room', 'Band Director Ms. Tuba'],
    ])
      if (d.zones[sp])
        add(`sp-${sp}`, who, d.zones[sp].x, d.zones[sp].z + (sp === 'gym' ? -5 : 2), { role: 'teacher' });
  }
  if (s.loc === 'library') {
    add('commish', 'Commissioner Gertrude', 14, -0.3, {
      rot: 0,
      role: 'league',
      look: { gray: true, hair: 'bob' },
    });
    add('librarian', 'Librarian Shh-ron', -2, 9, {
      rot: Math.PI,
      role: 'librarian',
      look: { accessories: ['glasses'] },
    });
    if (s.team.staff.scout !== 'adult:mrs_pham')
      add('mrs_pham', ADULTS.mrs_pham.name, 16, 8.5, {
        role: 'hire',
        look: { gray: true, hair: 'ponytail' },
      });
  }
  if (s.loc === 'mall') {
    if (s.team.staff.coach !== 'adult:coach_dave')
      add('coach_dave', ADULTS.coach_dave.name, -36, -9, {
        role: 'hire',
        look: { shirt: 'red', hair: 'buzz cut' },
      });
    add('cop', 'Mall Cop Randy', 0, 2, {
      mode: 'wander',
      area: { x: 0, z: 0, w: 60, d: 4 },
      role: 'cop',
      look: { shirt: 'navy' },
    });
  }
  if (s.loc === 'grocery') {
    add('cashier', 'Cashier Kim', -4, 3.1, { rot: Math.PI, role: 'cashier' });
    add('sample', 'Sample Lady Sue', 17, 0.2, {
      rot: 0,
      role: 'sample',
      look: { shirt: 'white', hair: 'bob' },
    });
  }
  if (s.loc === 'museum')
    add('guard', 'Museum Guard Gus', 0, 6, {
      mode: 'wander',
      area: { x: 0, z: 2, w: 40, d: 8 },
      role: 'guard',
    });
}
// Pickups & tasks
export function addPickups(game) {
  const s = game.state;
  const d = game.desc;
  const bd = d.bounds || { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
  for (const p of pickupsFor(s, s.loc)) {
    let x;
    let z;
    let tries = 0;
    const rng = mulberry32(hashString(p.id + s.time.day));
    do {
      x = bd.minX + 3 + rng() * (bd.maxX - bd.minX - 6);
      z = bd.minZ + 3 + rng() * (bd.maxZ - bd.minZ - 6);
    } while (game.engine._blocked(x, z, 0.6) && ++tries < 20);
    if (tries >= 20) continue;
    const b = new Builder();
    if (p.type === 'can') {
      b.cyl(0.08, 0.08, 0.24, '#c0c7cf', 0, 0, 0, { rot: [Math.PI / 2, 0, 0.3] });
      b.cyl(0.081, 0.081, 0.1, '#e63946', 0, 0, 0, { rot: [Math.PI / 2, 0, 0.3] });
    } else
      b.cyl(
        p.value >= 5 ? 0.22 : 0.12,
        p.value >= 5 ? 0.22 : 0.12,
        0.03,
        p.value >= 5 ? '#7bc96f' : '#f7c948',
        0,
        0.12,
        0,
        { rot: [Math.PI / 2.4, 0, 0] },
      );
    const m = b.mesh({ outline: 0.008 });
    m.position.set(x, 0.1, z);
    d.group.add(m);
    const entry = {
      kind: 'pickup',
      x,
      z,
      r: 1.2,
      label: p.type === 'can' ? 'Pick up can' : 'Pick up money!',
      data: { p, mesh: m },
    };
    d.interact.push(entry);
    if (p.type === 'money')
      game.engine.extraUpdaters.add((dt) => {
        m.rotation.y += dt * 3;
      });
  }
}
