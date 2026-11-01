// School, gear, jobs, money, the creator, recruiting and training.
import assert from 'node:assert/strict';
import test from 'node:test';
import { KIDS } from '../src/data/kids.js';
import { SUBJECT_TEACHERS } from '../src/data/world.js';
import { ensureSeason, finalizeSchedule } from '../src/game/league.js';
import { sectionOf } from '../src/game/routines.js';
import { classmates, playerClass, seatChart } from '../src/game/school.js';
import { simulateMatch } from '../src/game/sim.js';
import { chat, inviteCheck } from '../src/game/social.js';
import { deserialize, newGame, serialize, statsOf } from '../src/game/state.js';
import { homeGameRevenue, isRegistered, setPrice } from '../src/game/team.js';
import { dayInfo } from '../src/game/time.js';
import { opts } from './helpers.mjs';

test('school: four subjects with their own teachers, and classrooms at least 90% full', () => {
  for (const g of [2, 3, 4, 5, 6, 7, 8]) assert.equal(new Set(Object.values(SUBJECT_TEACHERS[g])).size, 4);
  const s = newGame({ name: 'Test', seed: 7 });
  for (const period of [1, 2, 3, 4]) {
    s.time.minute = [8 * 60 + 30, 9 * 60 + 30, 11 * 60, 13 * 60][period - 1];
    const seats = seatChart(s, period);
    const filled = seats.filter(Boolean).length;
    assert.ok(filled / seats.length >= 0.9, `period ${period}: ${filled}/${seats.length}`);
    assert.ok(seats.includes('PLAYER'));
  }
  const cohort = KIDS.filter((k) => k.grade_at_start === 3 && k.routine.school === 'Suncrest Academy');
  for (const bit of [1, 2]) {
    const a = cohort.filter((k) => (sectionOf(k, 3) & bit) === 0).length;
    assert.ok(Math.abs(a - (cohort.length - a)) <= 1, 'both schedule halves are even');
  }
  // Classmates change from class to class: some shared, some new.
  const c1 = new Set(classmates(s, 1));
  const c2 = classmates(s, 2);
  const shared = c2.filter((id) => c1.has(id)).length;
  assert.ok(shared > 0 && shared < c2.length, `period 2 shares ${shared} of ${c2.length} with period 1`);
  assert.equal(playerClass(s, 1).subject !== playerClass(s, 2).subject, true);
  assert.ok(classmates(s).length >= 20);
});
test('team gear boosts your roster in games, and only your roster', async () => {
  const { buyGear } = await import('../src/game/team.js');
  const s = newGame({ name: 'Gear', seed: 11, sport: 'soccer' });
  const kid = KIDS.find((k) => !s.team.roster.includes(k.id));
  s.team.roster.push(kid.id);
  const other = KIDS.find((k) => k.id !== kid.id);
  const before = statsOf(s, kid.id).SPD;
  const otherBefore = statsOf(s, other.id).SPD;
  s.money = 100;
  const r = buyGear(s, 'footwear');
  assert.ok(r.ok);
  assert.equal(s.money, 65);
  assert.ok(statsOf(s, kid.id).SPD > before || before >= 99);
  assert.equal(statsOf(s, other.id).SPD, otherBefore);
  assert.equal(statsOf(s, kid.id, { raw: true }).SPD, before);
});
test('paper route needs a bike', async () => {
  const { jobReady } = await import('../src/game/economy.js');
  const s = newGame({ name: 'Bike', seed: 3 });
  s.jobs.earned = 100;
  s.inv.items.paper_bag = 1;
  assert.equal(jobReady(s, 'paper'), false);
  s.inv.items.bike = 1;
  assert.equal(jobReady(s, 'paper'), true);
});
test('money: prices change how many people buy; teams can join mid-season', () => {
  const s = newGame(opts());
  s.team.upgrades.concessions = 1;
  s.team.upgrades.merch = 1;
  s.team.registered = true;
  s.team.registeredSeason = 1;
  setPrice(s, 'ticket', 0.25);
  const cheap = homeGameRevenue(s);
  setPrice(s, 'ticket', 4);
  const pricey = homeGameRevenue(s);
  assert.ok(cheap.fans > pricey.fans, `${cheap.fans} vs ${pricey.fans}`);
  setPrice(s, 'ticket', 0.5);
  setPrice(s, 'concession', 0.5);
  const lowSnack = homeGameRevenue(s);
  setPrice(s, 'concession', 5);
  const highSnack = homeGameRevenue(s);
  assert.ok(lowSnack.snackBuyers > highSnack.snackBuyers);
  assert.ok(homeGameRevenue(s).merchBuyers >= 0);
  // Join in week 6: games from week 6 (or 7) to 13, none before.
  const m = newGame(opts('basketball'));
  ensureSeason(m);
  m.time.day = 1 + 7 * 5; // Monday of week 6
  ensureSeason(m);
  m.team.registered = true;
  m.team.registeredSeason = 1;
  assert.ok(isRegistered(m));
  finalizeSchedule(m);
  const mine = m.league.schedule
    .filter((r) => r.games.some((g) => g.home === m.team.name || g.away === m.team.name))
    .map((r) => r.week);
  assert.ok(mine.length >= 7 && Math.min(...mine) >= 6, JSON.stringify(mine));
});
test('creator: skill points, trait effects and no-trait option', () => {
  const pts = { SPD: 15, EYE: 30, HUS: 3 }; // no per-skill cap
  const s = newGame({ ...opts(), perk: 'none', statPoints: pts });
  assert.equal(s.player.perk, 'none');
  assert.equal(s.player.stats.SPD, 65);
  assert.equal(s.player.stats.EYE, 80);
  assert.equal(newGame({ ...opts(), perk: 'gymrat', statPoints: { SPD: 50 } }).player.stats.SPD, 99); // tops out at 99
  assert.equal(s.player.stats.HUS, 53);
  assert.equal(s.player.stats.AGI, 50);
  const g = newGame({ ...opts(), perk: 'gymrat', statPoints: pts });
  assert.equal(g.player.stats.AGI, 55);
  // Teacher's Kid: troublemakers warm up more slowly.
  const tm = KIDS.find((k) => k.personality === 'Troublemaker');
  const a = newGame({ ...opts(), perk: 'none' });
  const b = newGame({ ...opts(), perk: 'teacherskid' });
  a.player.charisma = b.player.charisma = 45;
  assert.ok(chat(b, tm.id, `like:${tm.likes[0]}`).gained < chat(a, tm.id, `like:${tm.likes[0]}`).gained);
});
test('recruiting: good friends join without a quest unless they play for another team', () => {
  const s = newGame(opts());
  const med = KIDS.find(
    (k) => k.recruitment.difficulty === 'Medium' && k.grade_at_start === 3 && !s.kids[k.id].team,
  );
  s.kids[med.id].f = 60;
  assert.ok(inviteCheck(s, med.id).ok, 'a free agent who likes you joins');
  const rival = KIDS.find(
    (k) =>
      s.kids[k.id].team && k.recruitment.status === 'On Rival Team (Poachable)' && k.grade_at_start === 3,
  );
  s.kids[rival.id].f = 70;
  assert.equal(inviteCheck(s, rival.id).code, 'hook', 'a kid on another team still needs their condition');
  s.kids[rival.id].f = 90;
  assert.ok(inviteCheck(s, rival.id).ok, 'unless you are best friends');
});
test('training gear can be ordered from the phone and unlocks drills', async () => {
  const { orderDrillGear, practiceStats, availableDrills, DELIVERY_FEE } = await import(
    '../src/game/team.js'
  );
  const s = newGame({ name: 'T', seed: 7 });
  s.money = 11;
  const before = availableDrills(s).length;
  const r = orderDrillGear(s, 'cones');
  assert.equal(r.ok, true);
  assert.equal(r.cost, 8 + DELIVERY_FEE);
  assert.equal(s.money, 2);
  assert.ok(availableDrills(s).length >= before);
  assert.equal(orderDrillGear(s, 'cones').ok, false);
  assert.equal(orderDrillGear(s, 'batting_tee').ok, false);
  assert.equal(orderDrillGear(s, 'team_shirt').ok, false);
  assert.ok(Array.isArray(practiceStats(s)));
});
test('teammates who missed a drill get tested at practice', async () => {
  const { untestedDrills, orderDrillGear } = await import('../src/game/team.js');
  const { finishPractice } = await import('../src/game/clock.js');
  const s = newGame({ name: 'T', seed: 3 });
  const kid = KIDS.find((k) => !s.kids[k.id].team).id;
  s.team.roster.push(kid);
  s.kids[kid].rev = { SPD: 'range' };
  s.money = 50;
  orderDrillGear(s, 'cones');
  const pending = untestedDrills(s);
  assert.ok(pending.some((t) => t.drill.id === 'cones' && t.ids.includes(kid)));
  assert.ok(!pending.some((t) => t.drill.id === 'sprints'));
  s.team.practice.testDrills = false;
  finishPractice(s, true);
  assert.equal(s.kids[kid].rev.AGI, undefined);
  s.team.practice.testDrills = true;
  const msg = finishPractice(s, true);
  assert.match(msg, /Cone Weave/);
  assert.equal(s.kids[kid].rev.AGI, 'range');
  assert.equal(untestedDrills(s).length, 0);
});
test('your own character improves from workouts and practice', async () => {
  const { soloWorkout, workoutCheck, applyPractice } = await import('../src/game/team.js');
  const s = newGame({ ...opts(), perk: 'none', statPoints: { SPD: 10 } });
  s.loc = 'home';
  s.time.minute = 16 * 60;
  const before = statsOf(s, 'PLAYER', { raw: true }).SPD;
  assert.equal(soloWorkout(s, 'AGI').ok, false); // no cones yet
  const r = soloWorkout(s, 'SPD');
  assert.equal(r.ok, true);
  assert.ok(r.gain > 0);
  assert.equal(workoutCheck(s).ok, false); // once a day
  for (let d = 2; d < 12; d++) {
    s.time.day = d;
    s.time.minute = 16 * 60;
    assert.equal(soloWorkout(s, 'SPD').ok, true);
  }
  if (!s.team.roster.includes('PLAYER')) s.team.roster.push('PLAYER');
  s.team.practice.focus = 'SPD';
  applyPractice(s);
  assert.ok(statsOf(s, 'PLAYER', { raw: true }).SPD >= before + 6);
  // Old saves without player training still load.
  const old = JSON.parse(serialize(s));
  delete old.player.train;
  assert.deepEqual(deserialize(JSON.stringify(old)).player.train, {});
});
test('upcoming events for passing time', async () => {
  const { upcomingEvents } = await import('../src/game/clock.js');
  const s = newGame(opts());
  let d = 1;
  while (!dayInfo(d).isSchoolDay) d++;
  s.time.day = d;
  s.time.minute = 7 * 60 + 5;
  const ev = upcomingEvents(s);
  assert.equal(ev[0].label, 'School opens');
  assert.ok(ev.some((e) => e.label === 'School lets out'));
  assert.ok(!ev.some((e) => e.label === 'Class 2 starts')); // only listed once you're at school
  s.loc = 'school';
  assert.ok(upcomingEvents(s).some((e) => e.label === 'Class 2 starts'));
  assert.ok(ev.every((e, i) => i === 0 || e.minute >= ev[i - 1].minute));
  s.time.minute = 18 * 60;
  assert.deepEqual(
    upcomingEvents(s).map((e) => e.label),
    ['Bedtime'],
  );
});
test('sim events carry enough detail to act out every play', () => {
  const POS = {
    soccer: ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD', 'FWD'],
    basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
    football: ['QB', 'RB', 'WR', 'WR', 'DB', 'LB', 'DB'],
    baseball: ['P', 'C', 'IF', 'IF', 'IF', 'IF', 'OF', 'OF', 'OF'],
  };
  for (const sport of Object.keys(POS)) {
    const mk = (n) => ({
      name: n,
      bonus: 0,
      lineup: POS[sport].map((p, i) => ({
        id: `${n}${i}`,
        pos: p,
        name: `${n}${i}`,
        rating: 45 + i * 4,
        stats: {},
        isPlayer: false,
      })),
    });
    for (let seed = 1; seed < 6; seed++) {
      const r = simulateMatch({ sport, home: mk('H'), away: mk('A'), seed });
      const pts = [0, 0];
      for (const e of r.events) {
        if (['start', 'end', 'half'].includes(e.type)) continue;
        assert.ok(e.off === 'home' || e.off === 'away', `${sport} ${e.type} has an offense`);
        assert.ok(e.text, `${sport} ${e.type} has commentary`);
        if (sport === 'baseball' && e.batter) {
          assert.equal(e.bases.length, 3);
          pts[e.off === 'home' ? 0 : 1] += e.scored.length;
        } else if (e.points) pts[e.off === 'home' ? 0 : 1] += e.points;
      }
      assert.deepEqual(pts, r.score, `${sport} seed ${seed}: plays add up to the final score`);
    }
  }
});
