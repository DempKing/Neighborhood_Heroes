// Game simulation and a full season.
import assert from 'node:assert/strict';
import test from 'node:test';
import { KIDS } from '../src/data/kids.js';
import { SPORT_IDS } from '../src/data/world.js';
import { advance, sleep } from '../src/game/clock.js';
import { ensureSeason, matchSide, standings } from '../src/game/league.js';
import { simulateMatch } from '../src/game/sim.js';
import { deserialize, newGame, serialize, statsOf } from '../src/game/state.js';
import {
  attraction,
  bestLineup,
  buySetup,
  register,
  registrationChecklist,
  signKid,
} from '../src/game/team.js';
import { opts } from './helpers.mjs';

test('sim: all sports produce sane, deterministic scores', () => {
  for (const sport of SPORT_IDS) {
    const s = newGame(opts(sport));
    const pool = KIDS.filter((k) => k.grade_at_start === 3); // leagues are per grade
    s.team.roster = ['PLAYER', ...pool.slice(0, 11).map((k) => k.id)];
    const totals = [];
    for (let i = 0; i < 40; i++) {
      const home = matchSide(s, s.team.name, { home: true });
      const awayIds = pool.slice(11 + i, 23 + i).map((k) => k.id);
      const away = {
        name: 'Rivals',
        lineup: bestLineup(s, awayIds).lineup.map((x) => ({
          ...x,
          name: 'R',
          stats: statsOf(s, x.id),
          isPlayer: false,
        })),
        bonus: 0,
      };
      const a = simulateMatch({ sport, home, away, seed: i });
      const b = simulateMatch({ sport, home, away, seed: i });
      assert.deepEqual(a.score, b.score);
      totals.push(a.score[0] + a.score[1]);
    }
    const mean = totals.reduce((x, y) => x + y, 0) / totals.length;
    const range = { soccer: [1.5, 9], basketball: [25, 100], baseball: [3, 22], football: [10, 70] }[sport];
    assert.ok(mean >= range[0] && mean <= range[1], `${sport} mean total ${mean}`);
  }
});
test('clutch override changes only the forced moment onward', () => {
  const s = newGame(opts('basketball'));
  s.team.roster = [
    'PLAYER',
    ...KIDS.filter((k) => k.grade_at_start === 4)
      .slice(0, 7)
      .map((k) => k.id),
  ];
  for (let seed = 0; seed < 30; seed++) {
    const home = matchSide(s, s.team.name, { home: true });
    const away = matchSide(s, s.team.name);
    const base = simulateMatch({ sport: 'basketball', home, away, seed });
    if (base.clutchN == null) continue;
    const forced = simulateMatch({
      sport: 'basketball',
      home,
      away,
      seed,
      clutch: { n: base.clutchN, success: true },
    });
    assert.deepEqual(forced.events.slice(0, base.clutchAt), base.events.slice(0, base.clutchAt));
    return;
  }
});
test('full season: register, play through, get standings and a history entry', () => {
  const s = newGame(opts('basketball'));
  ensureSeason(s);
  assert.ok(s.league && s.league.teams.length === 7); // 7 rivals + you = 8
  s.money = 500;
  const free = KIDS.filter((k) => k.grade_at_start === 3 && !s.kids[k.id].team).slice(0, 7);
  for (const k of free) signKid(s, k.id);
  s.team.shirts = 10;
  assert.equal(buySetup(s).ok, false); // basketball needs no setup
  assert.ok(register(s).ok, JSON.stringify(registrationChecklist(s)));
  const startMoney = s.money;
  for (let d = 0; d < 7 * 15 - 1; d++) {
    // stop before next season starts
    advance(s, 60 * 14);
    sleep(s);
  }
  const st = standings(s);
  assert.equal(st.length, 8);
  assert.equal(s.team.history.length, 1);
  const me = st.find((t) => t.player);
  assert.equal(me.w + me.l + me.t, 13); // joined in week 1: every regular-season week
  if (me.w) assert.ok(s.money > startMoney); // win bonuses paid out
  assert.ok(attraction(s) >= 0);
  const back = deserialize(serialize(s));
  assert.equal(back.team.name, 'Test Tigers');
});
