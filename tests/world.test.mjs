// Kids, the calendar, routines, stats, parents, shopping and school basics.
import assert from 'node:assert/strict';
import test from 'node:test';
import { KIDS } from '../src/data/kids.js';
import { CORE_SUBJECTS } from '../src/data/world.js';
import {
  askChance,
  askParents,
  buy,
  doChore,
  lemonadeBuyChance,
  PITCH_ROUNDS,
  recycleCans,
  weatherFor,
} from '../src/game/economy.js';
import { kidClass, whereIsKid } from '../src/game/routines.js';
import { classmates, makeQuiz, passNote, seatChart, weeklyGradeCheck } from '../src/game/school.js';
import { newGame } from '../src/game/state.js';
import { kidStats, letter, LETTERS } from '../src/game/stats.js';
import { dayInfo, formatTime } from '../src/game/time.js';
import { opts } from './helpers.mjs';

test('roster data: 216 unique kids, 17-tier grade scale', () => {
  assert.equal(KIDS.length, 216);
  assert.equal(new Set(KIDS.map((k) => `${k.first_name} ${k.last_name}`)).size, 216);
  assert.equal(LETTERS.length, 17);
  assert.equal(letter(99), 'A++');
  assert.equal(letter(0), 'F--');
});
test('calendar: day 1 is a Monday school day in fall week 1', () => {
  const d = dayInfo(1);
  assert.equal(d.dowName, 'Mon');
  assert.ok(d.isSchoolDay);
  assert.equal(d.season.name, 'Fall');
  assert.equal(dayInfo(6).isWeekend, true);
  assert.equal(dayInfo(7 * 45 + 1).isSummer, true);
  assert.equal(dayInfo(365).year, 2);
  assert.equal(formatTime(13 * 60 + 5), '1:05 PM');
});
test("routines: public-school kids go to each subject teacher's room", () => {
  const kid = KIDS.find((k) => k.routine.school === 'Suncrest Academy' && k.grade_at_start === 3);
  const where = whereIsKid(kid, { day: 1, minute: 8 * 60 + 20, year: 1 });
  assert.equal(where.loc, 'school');
  assert.equal(where.zone, kidClass(kid, 3, 1).room);
  const rooms = new Set([1, 2, 3, 4].map((p) => kidClass(kid, 3, p).subject));
  assert.deepEqual([...rooms].sort(), [...CORE_SUBJECTS].sort());
  // Passing period: everyone's in the hallway.
  assert.equal(whereIsKid(kid, { day: 1, minute: 9 * 60 + 12, year: 1 }).zone, 'hallway');
  assert.equal(whereIsKid(kid, { day: 1, minute: 9 * 60 + 20, year: 1 }).zone, kidClass(kid, 3, 2).room);
  const priv = KIDS.find((k) => k.routine.school.startsWith('St.'));
  assert.equal(whereIsKid(priv, { day: 1, minute: 9 * 60, year: 1 }), null);
  assert.ok(whereIsKid(priv, { day: 1, minute: 16 * 60, year: 1 }));
  // Hilltop Prep kids spend the school day on their own campus.
  const prep = KIDS.find((k) => k.routine.school.startsWith('Hilltop'));
  assert.equal(whereIsKid(prep, { day: 1, minute: 9 * 60, year: 1 }).loc, 'hilltop');
  assert.equal(whereIsKid(kid, { day: 1, minute: 23 * 60, year: 1 }), null);
});
test('stats grow with age and stay in range', () => {
  for (const k of KIDS.slice(0, 40)) {
    const now = kidStats(k, k.grade_at_start);
    const later = kidStats(k, k.grade_at_start + 5);
    for (const v of Object.values(later)) assert.ok(v >= 1 && v <= 99);
    if (k.hidden.growth_curve === 'Steady Climber') assert.ok(later.SPD >= now.SPD);
  }
});
test('parents: small asks are a gamble, $20-$100 need good answers, over $100 is a no', () => {
  const s = newGame(opts());
  assert.ok(askChance(s, 3) > 0.9);
  const big = askParents(s, 150);
  assert.equal(big.ok, false);
  assert.ok(big.big);
  assert.ok(askParents(s, 2).cooldown);
  const a = newGame(opts());
  a.money = 0;
  assert.ok(askParents(a, 20, 1).ok); // one good answer is enough for $20
  assert.equal(a.money, 20);
  const b = newGame(opts());
  assert.equal(askParents(b, 60, 2).ok, false); // needs all three
  const c = newGame(opts());
  c.money = 0;
  assert.ok(askParents(c, 100, PITCH_ROUNDS.length).ok);
  assert.equal(c.money, 100);
  c.time.day += 30;
  assert.equal(askParents(c, 50, PITCH_ROUNDS.length).ok, false); // only once for the team
  const d = newGame(opts());
  d.money = 0;
  for (let i = 0; i < 4; i++) doChore(d);
  assert.equal(d.money, 3); // three chores a day, $1 each
});
test('shopping and recycling', () => {
  const s = newGame(opts());
  s.money = 10;
  assert.ok(buy(s, 'pitcher').ok);
  assert.equal(buy(s, 'pitcher').ok, false);
  assert.ok(buy(s, 'cups').ok);
  assert.equal(s.inv.items.cups, 30);
  s.inv.items.cans = 20;
  assert.ok(recycleCans(s).ok);
  assert.equal(s.money, 5);
  assert.ok(lemonadeBuyChance(0.5, 0.8, weatherFor(s)) > lemonadeBuyChance(2, 0.8, weatherFor(s)));
});
test('school: quiz has 4 options with a valid answer, seat chart has the player', () => {
  const s = newGame(opts());
  const q = makeQuiz(s, ['Math', 'Science', 'Spelling', 'Reading', 'Social Studies'], 6);
  assert.equal(q.length, 6);
  for (const x of q) {
    assert.equal(x.options.length, 4);
    assert.ok(x.answer >= 0);
  }
  const seats = seatChart(s);
  assert.ok(seats.includes('PLAYER'));
  assert.ok(classmates(s).length >= 8);
  const target = seats.find((x) => x && x !== 'PLAYER');
  assert.ok(typeof passNote(s, target, 'nice').delivered === 'boolean');
  s.school.scores = [50, 50, 50, 50, 50, 50];
  weeklyGradeCheck(s);
  weeklyGradeCheck(s);
  assert.ok(s.school.sportsBan);
});
