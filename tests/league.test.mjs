// Lineups, saves, leagues, stats, the Crest Cup, attendance, sign-ups and knowledge.
import assert from 'node:assert/strict';
import test from 'node:test';
import { KIDS } from '../src/data/kids.js';
import { SPORT_IDS } from '../src/data/world.js';
import { sleep } from '../src/game/clock.js';
import { ensureSeason, finalizeSchedule } from '../src/game/league.js';
import { deserialize, kidGrade, newGame, serialize } from '../src/game/state.js';
import { dayInfo } from '../src/game/time.js';
import { opts } from './helpers.mjs';

test('lineup: optimal team total, pins respected, you start unless benching is allowed', async () => {
  const { assignMax, bestLineup, setLineupSlot, lineupTotal } = await import('../src/game/team.js');
  // Assignment matches brute force on small random cases.
  let seed = 7;
  const r = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const perms = (arr, k) =>
    k === 0
      ? [[]]
      : arr.flatMap((x, i) =>
          perms(
            arr.filter((_, j) => j !== i),
            k - 1,
          ).map((p) => [x, ...p]),
        );
  for (let t = 0; t < 30; t++) {
    const rows = 2 + Math.floor(r() * 3);
    const cols = rows + Math.floor(r() * 3);
    const w = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.round(r() * 100)));
    const got = assignMax(w).reduce((a, c, i) => a + w[i][c], 0);
    const best = Math.max(
      ...perms([...Array(cols).keys()], rows).map((p) => p.reduce((a, c, i) => a + w[i][c], 0)),
    );
    assert.equal(got, best);
  }
  assert.deepEqual(assignMax([[5], [9], [1]]).filter((x) => x != null).length, 1); // more spots than kids
  const s = newGame(opts());
  const free = KIDS.filter((k) => !s.kids[k.id].team && k.grade_at_start === 3)
    .slice(0, 10)
    .map((k) => k.id);
  s.team.roster.push(...free);
  const { lineup } = bestLineup(s);
  assert.ok(
    lineup.some((x) => x.id === 'PLAYER'),
    'you start by default',
  );
  // Pin a bench kid somewhere: they start there, everyone else still filled.
  const benchKid = bestLineup(s).bench[0];
  setLineupSlot(s, 0, benchKid);
  const pinned = bestLineup(s).lineup;
  assert.equal(pinned[0].id, benchKid);
  assert.ok(pinned[0].locked);
  assert.equal(new Set(pinned.map((x) => x.id)).size, pinned.length, 'no kid twice');
  // Moving the same kid frees the old spot.
  setLineupSlot(s, 1, benchKid);
  assert.equal(s.team.lineupLocks[0], undefined);
  s.team.lineupLocks = {};
  s.team.benchMe = true;
  assert.ok(lineupTotal(bestLineup(s).lineup) >= lineupTotal(lineup));
});
test('four save slots: continue picks the most recent, slots stay separate', async () => {
  const { saveToStorage, loadSlot, listSlots, loadFromStorage, deleteSlot, freeSlot, SAVE_KEY } =
    await import('../src/game/state.js');
  const mem = new Map();
  const st = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
  assert.equal(freeSlot(st), 0);
  const a = newGame({ ...opts(), name: 'Ann', slot: 0 });
  const b = newGame({ ...opts(), name: 'Bo', slot: 2 });
  saveToStorage(a, st);
  assert.ok(mem.has(SAVE_KEY), 'slot 1 keeps the original key (old saves still load)');
  saveToStorage(b, st);
  b.savedAt = a.savedAt + 1000;
  mem.set(`${SAVE_KEY}-slot3`, serialize(b));
  assert.equal(loadFromStorage(st).player.name, 'Bo');
  assert.equal(freeSlot(st), 1);
  assert.deepEqual(
    listSlots(st).map((x) => x.state && x.state.player.name),
    ['Ann', null, 'Bo', null],
  );
  assert.equal(loadSlot(2, st).slot, 2);
  for (const i of [1, 3]) saveToStorage(newGame({ ...opts(), slot: i }), st);
  assert.equal(freeSlot(st), -1, 'all four full');
  deleteSlot(2, st);
  assert.equal(loadSlot(2, st), null);
  assert.equal(freeSlot(st), 2);
});
test("the player's created look renders in the character bible style for every option", async () => {
  const { lookSpec, renderCharacter } = await import('../art/charstyle/figure.js');
  const { HAIR_STYLES } = await import('../src/world2d/looks.js');
  const { TOPS, BOTTOMS, SHOE_TYPES, PANTS_COLORS, SHOE_COLORS } = await import('../src/world2d/looks.js');
  const { SKIN, HAIR, EYES, OUTFIT } = await import('../src/world2d/build.js');
  const pick = (o, i) => {
    const k = Object.keys(o);
    return k[i % k.length];
  };
  const n = Math.max(
    HAIR_STYLES.length,
    TOPS.length,
    BOTTOMS.length,
    SHOE_TYPES.length,
    Object.keys(OUTFIT).length,
  );
  for (let i = 0; i < n; i++) {
    const look = {
      skin: pick(SKIN, i),
      hairStyle: HAIR_STYLES[i % HAIR_STYLES.length],
      hairColor: pick(HAIR, i % 9),
      eyeColor: pick(EYES, i),
      build: 'average',
      top: TOPS[i % TOPS.length],
      shirt: pick(OUTFIT, i),
      bottom: BOTTOMS[i % BOTTOMS.length],
      pants: pick(PANTS_COLORS, i),
      shoes: SHOE_TYPES[i % SHOE_TYPES.length],
      shoeColor: pick(SHOE_COLORS, i),
      accessories: [['baseball cap', 'beanie', 'glasses', 'superhero cape'][i % 4]],
    };
    const svg = renderCharacter(
      lookSpec(look, { grade: 3 + (i % 6), perk: ['none', 'smooth', 'sneaky'][i % 3] }),
    );
    assert.ok(svg.startsWith('<svg') && svg.length > 4000, `look ${i} rendered`);
    assert.ok(!/undefined|NaN/.test(svg), `look ${i} has no broken values: ${JSON.stringify(look)}`);
  }
});
test('leagues: one league per grade, rosters are grade-based', async () => {
  const { ensureSeason, rosterOf } = await import('../src/game/league.js');
  const { playerBand, eligibility } = await import('../src/game/team.js');
  const s = newGame(opts());
  s.time.day = 1;
  ensureSeason(s);
  assert.equal(playerBand(s).name, 'Grade 3 League');
  assert.ok(s.league.teams.length >= 3 && s.league.teams.length <= 7);
  for (const t of s.league.teams)
    for (const id of rosterOf(s, t.name))
      assert.equal(kidGrade(s, id), 3, `${t.name} has a grade-${kidGrade(s, id)} kid`);
  const older = KIDS.find((k) => k.grade_at_start === 4);
  assert.equal(eligibility(s, older.id).ok, false);
});
test('league stats: goals/assists/saves recorded, team OVR, MVP awarded at season end', async () => {
  const { ensureSeason, simOtherGames, teamOverall, endSeason, LAST_REGULAR_WEEK } = await import(
    '../src/game/league.js'
  );
  const { leagueLeaders, teamStats, seasonAwards } = await import('../src/game/leagueStats.js');
  const s = newGame(opts('soccer'));
  s.time.day = 1;
  ensureSeason(s);
  for (let w = 1; w <= LAST_REGULAR_WEEK; w++) simOtherGames(s, w);
  const goals = leagueLeaders(s, 'G', 3);
  assert.ok(goals.length && goals[0].n > 0, 'someone scored');
  assert.ok(leagueLeaders(s, 'A', 1).length, 'assists counted');
  assert.ok(leagueLeaders(s, 'SV', 1).length, 'saves counted');
  const t = s.league.teams[0];
  const ts = teamStats(s, t.name);
  assert.equal(ts.totals.G, t.pf, 'team goals match points for');
  const ovr = teamOverall(s, t.name);
  assert.ok(ovr > 0 && ovr < 100);
  const aw = seasonAwards(s);
  assert.ok(aw.mvp.id && aw.leaders.some((a) => a.key === 'G'));
  endSeason(s);
  assert.equal(s.league.awards.mvp.id, aw.mvp.id);
});
test('skip to next game: lands on game day, classes attended, Friday quiz still graded', async () => {
  const { skipToNextGame, nextGameInfo } = await import('../src/game/clock.js');
  const { register } = await import('../src/game/team.js');
  const s = newGame(opts('soccer'));
  assert.equal(nextGameInfo(s), null, 'no game before you register');
  s.time.day = 1;
  ensureSeason(s);
  const free = KIDS.filter((k) => k.grade_at_start === 3 && !s.kids[k.id].team)
    .slice(0, 8)
    .map((k) => k.id);
  for (const id of free) {
    s.kids[id].team = s.team.name;
    s.team.roster.push(id);
  }
  s.team.shirts = 12;
  s.team.setup = true;
  s.money = 500;
  register(s);
  finalizeSchedule(s);
  const quizzes = s.school.scores.length;
  const n = nextGameInfo(s);
  assert.ok(n && n.days > 0);
  const r = skipToNextGame(s);
  assert.ok(r.ok, r.msgs.join(' | '));
  assert.equal(dayInfo(s.time.day).dow, 5);
  assert.ok(s.school.scores.length > quizzes, 'Friday quiz recorded');
});
test('crest cup: league champion represents Suncrest vs Hilltop after the championship', async () => {
  const R = await import('../src/game/rivalry.js');
  const { register } = await import('../src/game/team.js');
  const { simGame, endSeason } = await import('../src/game/league.js');
  const s = newGame(opts('soccer'));
  s.time.day = 1;
  ensureSeason(s);
  const free = KIDS.filter((k) => k.grade_at_start === 3 && !s.kids[k.id].team)
    .slice(0, 8)
    .map((k) => k.id);
  for (const id of free) {
    s.kids[id].team = s.team.name;
    s.team.roster.push(id);
  }
  s.team.shirts = 12;
  s.team.setup = true;
  s.money = 500;
  register(s);
  finalizeSchedule(s);
  assert.equal(R.crestCupTeam(s), null, 'nobody represents Suncrest until there is a champion');
  const cc = R.crestCupDate(s);
  assert.equal(dayInfo(cc.day).season.week, 15);
  assert.equal(dayInfo(cc.day).dow, 6);
  // Your team wins the championship.
  s.league.playoffs = [
    { week: 14, games: [] },
    {
      week: 15,
      games: [
        {
          home: s.team.name,
          away: s.league.teams[0].name,
          playoff: 'Championship',
          result: { score: [3, 1] },
        },
      ],
    },
  ];
  endSeason(s);
  assert.equal(R.crestCupTeam(s), s.team.name);
  const hawks = R.hilltopRoster(s);
  assert.equal(hawks.length, 12);
  for (const id of hawks) {
    assert.equal(kidGrade(s, id), 3);
    assert.ok(!s.team.roster.includes(id));
  }
  assert.ok(R.hilltopNatives(s) > 0, 'some Hawks go to Hilltop Prep');
  const res = simGame(s, R.crestCupGame(s), 15);
  assert.equal(res.score.length, 2);
  s.time.day = cc.day;
  assert.ok(R.crestCupToday(s) && R.playerInCrestCup(s));
  const trophies = s.inv.trophies.length;
  R.recordCrestCup(s, { score: [1, 3] });
  assert.equal(s.inv.trophies.length, trophies + 1, 'winning gives the Crest Cup trophy');
  assert.equal(R.crestCupToday(s), false);
  // Next time, a rival wins the league: their Crest Cup is simmed overnight.
  s.rivalry.games = [];
  s.league.champion = s.league.teams[0].name;
  assert.equal(R.playerInCrestCup(s), false);
  sleep(s);
  const last = R.rivalryRecord(s).games[0];
  assert.equal(last.team, s.league.teams[0].name);
  assert.equal(last.mine, false);
});
test('attendance: bigger fields and better facilities draw more fans; seats cap the crowd; stadium bowl is buildable at the stadium', async () => {
  const { fieldPreview, upgradeCap, homeGameRevenue } = await import('../src/game/team.js');
  const s = newGame(opts('soccer'));
  for (const k of Object.keys(s.team.upgrades)) s.team.upgrades[k] = 2;
  const back = fieldPreview(s, 'backyard');
  const school = fieldPreview(s, 'schoolfield');
  const park = fieldPreview(s, 'park');
  assert.ok(back.est.fans <= back.seats, 'the crowd never exceeds the seats');
  assert.ok(
    park.est.fans > school.est.fans && school.est.fans > back.est.fans,
    `fans: ${back.est.fans} < ${school.est.fans} < ${park.est.fans}`,
  );
  s.team.upgrades.seating = 0;
  assert.equal(homeGameRevenue(s).fans <= 15, true, 'standing room only holds 15');
  s.team.field = 'stadium';
  assert.equal(upgradeCap(s, 'seating'), 4, 'stadium bowl fits at the stadium');
});
test('season sign-ups: open after the Crest Cup, remaining sports only, free entry, new team to recruit', async () => {
  const S = await import('../src/game/seasons.js');
  const { skipToNextYear, restartSeasonLeague } = await import('../src/game/clock.js');
  const { entryFee } = await import('../src/game/team.js');
  const s = newGame(opts('soccer'));
  ensureSeason(s);
  assert.equal(S.signupOpen(s), null, 'not during the season you signed up for');
  const friend = KIDS.find((k) => kidGrade(s, k.id) === 3).id;
  s.team.roster.push(friend);
  s.kids[friend].team = s.team.name;
  // Crest Cup Sunday: we're the champs. Sign-ups open once it's played.
  const R = await import('../src/game/rivalry.js');
  while (dayInfo(s.time.day).season.week < 15 || dayInfo(s.time.day).dow < 6) sleep(s);
  s.league.done = true;
  s.league.champion = s.team.name;
  assert.equal(S.signupOpen(s), null, 'not before the Crest Cup');
  R.recordCrestCup(s, { score: [1, 2] });
  const n = S.signupOpen(s);
  assert.ok(n && n.name === 'Winter' && !n.now);
  assert.deepEqual(
    n.options,
    SPORT_IDS.filter((x) => x !== 'soccer'),
    'soccer was already played this year',
  );
  assert.equal(S.chooseNextSport(s, 'soccer').ok, false);
  assert.ok(S.chooseNextSport(s, 'basketball', 'Hoop Dreams').ok);
  sleep(s); // Monday: Winter starts with the new team
  assert.equal(s.team.sport, 'basketball');
  assert.equal(s.team.name, 'Hoop Dreams');
  assert.deepEqual(s.team.roster, ['PLAYER'], 'a new sport means recruiting a new team');
  assert.equal(s.kids[friend].team, null);
  assert.equal(s.league.sport, 'basketball');
  assert.equal(entryFee(s), 0, 'entry is free');
  assert.equal(S.signupOpen(s), null);
  // Skip the rest of the year: lands on Fall of grade 4 with every sport open again.
  const r = skipToNextYear(s);
  assert.ok(r.ok);
  assert.equal(dayInfo(s.time.day).season.name, 'Fall');
  assert.equal(dayInfo(s.time.day).season.week, 1);
  const f = S.signupOpen(s);
  assert.ok(f && f.now && f.options.length === SPORT_IDS.length);
  assert.ok(S.chooseNextSport(s, 'baseball').ok);
  restartSeasonLeague(s);
  assert.equal(s.team.sport, 'baseball');
  assert.equal(s.league.sport, 'baseball');
  assert.equal(S.signupOpen(s), null);
});
test('stat relevance: each sport highlights the skills its positions use', async () => {
  const { statRelevance, sportStatImportance } = await import('../src/game/stats.js');
  for (const sp of SPORT_IDS) {
    const imp = sportStatImportance(sp);
    assert.ok(Object.values(imp).some((v) => v === 1));
    assert.ok(Object.keys(imp).some((c) => statRelevance(sp, c) === 'key'));
  }
});
test('knowledge: a new run inherits everything a past save knew about the kids', async () => {
  const K = await import('../src/game/knowledge.js');
  const old = newGame(opts('soccer'));
  const [a, b, c] = KIDS.slice(0, 3).map((k) => k.id);
  old.kids[a].met = true;
  old.kids[a].f = 70;
  old.kids[a].rev = { SPD: 'exact', STR: 'range' };
  old.kids[a].known = ['lunch'];
  old.kids[a].hookAsked = true;
  old.kids[b].rev = { AGI: 'range' }; // scouted at tryouts, never met
  assert.deepEqual(K.knowledgeSummary(old), { kids: 2, named: 1, stats: 3, exact: 1, routines: 1 });
  const fresh = newGame(opts('basketball'));
  fresh.kids[a].rev = { STR: 'exact' };
  assert.equal(K.applyKnowledge(fresh, deserialize(serialize(old))), 2);
  const ka = fresh.kids[a];
  assert.deepEqual(ka.rev, { SPD: 'exact', STR: 'exact' }, 'exact beats range');
  assert.ok(K.knowsName(ka) && !ka.met, 'you know their name; they have not met you');
  assert.ok(ka.known.includes('lunch') && ka.knowLikes && ka.knowTraits === 2 && ka.hookAsked);
  assert.equal(ka.f, KIDS[0].recruitment.starting_friendship, 'friendship starts over');
  assert.ok(!K.knowsName(fresh.kids[b]) && fresh.kids[b].rev.AGI === 'range');
  assert.equal(fresh.kids[c].remembered, undefined);
  // Knowledge chains: a third run remembers what the second inherited.
  const third = newGame(opts('soccer'));
  K.applyKnowledge(third, fresh);
  assert.ok(K.knowsName(third.kids[a]) && third.kids[a].knowTraits === 2);
});
