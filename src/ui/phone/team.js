// Team app: the roster, tryouts, practice, the lineup and each kid's details.
import { lookSpec, renderCharacter } from '../../../art/charstyle/figure.js';
import { KID_BY_ID, kidName, shortName } from '../../data/kids.js';
import { DRILLS, ITEMS, POSITIONS, SPORTS, STAT_CODES, STAT_NAMES } from '../../data/world.js';
import { kitBottoms, teamOverall } from '../../game/league.js';
import { letterFor } from '../../game/school.js';
import { signupOpen } from '../../game/seasons.js';
import { friendshipLabel } from '../../game/social.js';
import { getKid, heightOf, kidGrade, playerGrade, statsOf } from '../../game/state.js';
import { heightScore, letter, positionRating, statRelevance } from '../../game/stats.js';
import {
  attraction,
  availableDrills,
  bestLineup,
  buySetup,
  eligibility,
  isRegistered,
  kidOverall,
  kidSchoolAverage,
  lineupLocks,
  lineupTotal,
  playerBand,
  practiceStats,
  registrationChecklist,
  releaseKid,
  revealLabel,
  setLineupSlot,
  untestedDrills,
  upgradeName,
} from '../../game/team.js';
import { dayInfo, formatTime } from '../../game/time.js';
import { btn, gradeChip, h, modal, money, toast } from '../dom.js';
import { jerseyPreview } from '../jersey.js';
import { openSignup } from '../signup.js';
import { portrait } from '../talk.js';

// Team
export function teamTab(game, root, redraw) {
  const s = game.state;
  const sp = SPORTS[s.team.sport];
  const band = playerBand(s);
  const att = attraction(s);
  const head = h(
    'div',
    { class: 'box' },
    h(
      'div',
      { class: 'row' },
      h('h3', { style: { flex: 1 } }, `${sp.icon} ${s.team.name}`),
      h('span', { class: 'pill info' }, band.name),
      h(
        'span',
        { class: 'pill ovr-pill', title: 'Team overall: how good your best lineup is (0-99)' },
        `OVR ${teamOverall(s, s.team.name)}`,
      ),
      h('span', { class: 'pill' }, `Record ${s.team.wins}-${s.team.losses}`),
      h('span', { class: 'pill' }, `🏆 ${s.team.championships}`),
    ),
    h('div', {
      class: 'jersey-box',
      html: jerseyPreview(s.team.colors, s.team.upgrades.uniforms, {
        name: s.player.name,
        team: s.team.name,
        number: s.team.number || 7,
      }),
    }),
    h(
      'div',
      { class: 'muted', style: { textAlign: 'center', fontSize: '12px' } },
      `Uniforms: ${upgradeName(s, 'uniforms', s.team.upgrades.uniforms)} (upgrade in Field & Staff)`,
    ),
    h(
      'div',
      { class: 'row' },
      'Uniform bottoms:',
      h(
        'div',
        { class: 'chips' },
        ...['shorts', 'pants'].map((v) =>
          h(
            'div',
            {
              class: `chip ${kitBottoms(s, s.team.name) === v ? 'sel' : ''}`,
              onclick: () => {
                s.team.kitBottoms = v;
                redraw();
              },
            },
            v === 'pants' ? '👖 Pants' : '🩳 Shorts',
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'row' },
      'Team attraction:',
      h('div', { class: 'bar', style: { width: '160px' } }, h('i', { style: { width: `${att}%` } })),
      h('b', {}, att),
      h(
        'span',
        { class: 'muted' },
        '(roster, results, history, trophies on display, facilities, how much kids like you)',
      ),
    ),
  );
  root.appendChild(head);

  const su = signupOpen(s);
  if (su) {
    root.appendChild(
      h(
        'div',
        { class: 'box signup-box', style: { marginTop: '10px' } },
        h('h3', {}, `📝 ${su.name} season sign-ups are open`),
        h(
          'p',
          {},
          su.picked
            ? `You're signed up: ${SPORTS[su.picked.sport].icon} ${SPORTS[su.picked.sport].name} as the ${su.picked.name}. It starts with the ${su.name} season.`
            : `Pick next season's sport (free) or skip to next school year.`,
        ),
        btn(su.picked ? 'Change sign-up' : 'Open sign-ups', () => openSignup(game, redraw), 'small green'),
      ),
    );
  }

  if (!isRegistered(s)) {
    const reg = h(
      'div',
      { class: 'box', style: { marginTop: '10px' } },
      h('h3', {}, '📋 Get into the league'),
    );
    for (const c of registrationChecklist(s))
      reg.appendChild(
        h(
          'div',
          { class: `check ${c.done ? 'done' : ''}` },
          h('div', { class: 'mark' }, c.done ? '✓' : ''),
          h('div', {}, c.label, c.detail ? h('span', { class: 'muted' }, ` (${c.detail})`) : null),
        ),
      );
    if (!s.team.setup)
      reg.appendChild(
        btn(
          `Buy field setup (${money(sp.setupCost)})`,
          () => {
            const r = buySetup(s);
            toast(r.ok ? 'Your backyard is ready!' : r.reason, r.ok ? 'good' : 'bad');
            redraw();
          },
          'small green',
        ),
      );
    reg.appendChild(
      h(
        'p',
        { class: 'muted' },
        'Shirts: Sporting Goods, the first store on the left inside the mall (Map → Mall). Entry fee: the league desk at the Library.',
      ),
    );
    root.appendChild(reg);
  }

  // roster
  const { lineup } = bestLineup(s);
  const starters = new Map(lineup.filter((x) => x.id).map((x) => [x.id, x.pos]));
  const table = h(
    'table',
    { class: 'list' },
    h(
      'tr',
      {},
      h('th', {}, 'Player'),
      h('th', {}, 'Gr'),
      h('th', {}, 'Best spot'),
      h('th', {}, 'Rating'),
      h('th', {}, 'Speed'),
      h('th', {}, 'Status'),
    ),
  );
  for (const id of s.team.roster) {
    const k = getKid(s, id);
    const best = kidOverall(s, id);
    const el = eligibility(s, id);
    const known = id === 'PLAYER' || Object.keys(s.kids[id].rev).length >= 3;
    table.appendChild(
      h(
        'tr',
        { class: 'click', onclick: () => kidDetail(game, id, redraw) },
        h(
          'td',
          {},
          id === 'PLAYER' ? `${k.first_name} (You)` : shortName(k),
          s.kids[id]?.ringer ? ' 🕵️' : '',
          s.team.promised.includes(id) ? ' 🤞' : '',
        ),
        h('td', {}, kidGrade(s, id)),
        h('td', {}, starters.has(id) ? POSITIONS[s.team.sport][starters.get(id)].name : 'Bench'),
        h('td', {}, known ? gradeChip(letter(best.rating), best.rating) : gradeChip('?')),
        h('td', {}, gradeChip(revealLabel(s, id, 'SPD'), 1)),
        h(
          'td',
          {},
          el.ok ? h('span', { class: 'pill good' }, 'Eligible') : h('span', { class: 'pill bad' }, el.reason),
        ),
      ),
    );
  }
  root.appendChild(
    h(
      'div',
      { class: 'grid2', style: { marginTop: '10px' } },
      h(
        'div',
        { class: 'box' },
        h('h3', {}, `Roster (${s.team.roster.length}/14)`),
        table,
        h(
          'p',
          { class: 'muted' },
          "Click a player for details. Ratings show once you've seen 3+ of their stats at tryouts.",
        ),
      ),
      h('div', {}, tryoutBox(game, redraw), practiceBox(game, redraw)),
    ),
  );
}
/** Tryout results and options. */
function tryoutBox(game, redraw) {
  const s = game.state;
  const box = h('div', { class: 'box' }, h('h3', {}, '🏃 Tryouts'));
  const drills = availableDrills(s);
  box.appendChild(h('p', {}, `Drills unlocked: ${drills.map((d) => d.name).join(', ')}`));
  const locked = DRILLS.filter((d) => !drills.includes(d)).slice(0, 4);
  if (locked.length)
    box.appendChild(
      h(
        'p',
        { class: 'muted' },
        `Unlock more drills: ${locked.map((d) => `${d.name} (${d.needs.map((n) => ITEMS[n].name).join(' + ')})`).join('; ')}`,
      ),
    );
  box.appendChild(
    h(
      'p',
      {},
      `Invited: ${s.team.invites.length ? s.team.invites.map((id) => KID_BY_ID.get(id).first_name).join(', ') : 'nobody yet. Talk to kids and invite them!'}`,
    ),
  );
  const t = s.team.tryout;
  if (t && !t.done)
    box.appendChild(
      h(
        'p',
        { class: 'pill good' },
        `Tryout: ${dayInfo(t.day).dateLabel} at ${formatTime(t.minute)} in your backyard`,
      ),
    );
  else if (s.school.sportsBan)
    box.appendChild(h('p', { class: 'pill bad' }, 'Grounded from sports: no tryouts until grades improve.'));
  else {
    const info = dayInfo(s.time.day);
    const today = s.time.minute < 15 * 60;
    const row = h('div', { class: 'btn-row' });
    if (today)
      row.appendChild(
        btn(
          'Schedule today 3:30 PM',
          () => {
            s.team.tryout = { day: s.time.day, minute: 15 * 60 + 30 };
            toast('Tryout set for today at 3:30 PM. Be in your backyard!', 'good');
            redraw();
          },
          'small green',
          s.team.invites.length ? {} : { disabled: true },
        ),
      );
    row.appendChild(
      btn(
        'Schedule tomorrow 3:30 PM',
        () => {
          s.team.tryout = { day: s.time.day + 1, minute: 15 * 60 + 30 };
          toast('Tryout set for tomorrow at 3:30 PM.', 'good');
          redraw();
        },
        'small',
        s.team.invites.length ? {} : { disabled: true },
      ),
    );
    box.appendChild(row);
    if (info.dow === 5 && today)
      box.appendChild(h('p', { class: 'muted' }, 'Heads up: you might have a game today at 10 AM.'));
  }
  return box;
}
/** Practice settings. */
function practiceBox(game, redraw) {
  const s = game.state;
  const p = s.team.practice;
  const days = h('div', { class: 'chips' });
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach((d, i) =>
    days.appendChild(
      h(
        'div',
        {
          class: `chip ${p.dows.includes(i) ? 'sel' : ''}`,
          onclick: () => {
            p.dows = p.dows.includes(i) ? p.dows.filter((x) => x !== i) : [...p.dows, i].sort();
            redraw();
          },
        },
        d,
      ),
    ),
  );
  const okStats = practiceStats(s);
  if (!okStats.includes(p.focus)) p.focus = okStats[0] || 'SPD';
  const focus = h(
    'select',
    {
      onchange: (e) => {
        p.focus = e.target.value;
      },
    },
    ...okStats.map((c) => h('option', { value: c, selected: p.focus === c ? true : null }, STAT_NAMES[c])),
  );
  return h(
    'div',
    { class: 'box', style: { marginTop: '10px' } },
    h('h3', {}, '📅 Practice'),
    h(
      'p',
      { class: 'muted' },
      'Practice is 3:30-5:00 PM in your backyard. Show up and your teammates get better at the focus skill (and like you more). Skip it and they get grumpy.',
    ),
    days,
    h(
      'div',
      { class: 'row', style: { marginTop: '8px' } },
      'Focus:',
      focus,
      h('span', { class: 'muted' }, 'Unlock more in 🏋️ Training.'),
    ),
    practiceTestRow(s, redraw),
    lineupEditor(game, redraw),
  );
}
/** Starting lineup: the coach fills it for the best team total; pin anyone anywhere with the dropdowns. */
function lineupEditor(game, redraw) {
  const s = game.state;
  const sport = s.team.sport;
  const { lineup, bench } = bestLineup(s);
  const locks = lineupLocks(s);
  // What the coach would do with no pins, to show what your changes cost.
  const saved = s.team.lineupLocks;
  s.team.lineupLocks = {};
  const auto = bestLineup(s).lineup;
  s.team.lineupLocks = saved;
  const known = (id) => id === 'PLAYER' || Object.keys(s.kids[id]?.rev || {}).length >= 3;
  const who = (id) => (id === 'PLAYER' ? `${s.player.name} (You)` : shortName(KID_BY_ID.get(id)));
  const eligible = s.team.roster.filter((id) => eligibility(s, id).ok);
  const fit = (id, pos) => {
    const st = statsOf(s, id);
    return positionRating(st, sport, pos, heightScore(heightOf(s, id), kidGrade(s, id)));
  };
  const rows = lineup.map((x, i) => {
    const sel = h(
      'select',
      {
        onchange: (e) => {
          setLineupSlot(s, i, e.target.value || null);
          redraw();
        },
      },
      h('option', { value: '' }, `Coach picks${!locks[i] && x.id ? ` (${who(x.id)})` : ''}`),
      ...eligible.map((id) =>
        h(
          'option',
          { value: id, selected: locks[i] === id ? true : null },
          `${who(id)} · ${known(id) ? letter(fit(id, x.pos)) : '?'} here`,
        ),
      ),
    );
    return h(
      'tr',
      {},
      h('td', {}, POSITIONS[sport][x.pos].name),
      h(
        'td',
        {},
        x.id ? h('b', {}, who(x.id)) : h('span', { class: 'pill bad' }, 'EMPTY'),
        locks[i] ? ' 📌' : '',
      ),
      h('td', {}, x.id && known(x.id) ? gradeChip(letter(x.rating), x.rating) : gradeChip('?')),
      h('td', {}, sel),
    );
  });
  const pins = Object.keys(locks).length;
  const diff = lineupTotal(lineup) - lineupTotal(auto);
  return h(
    'div',
    {},
    h('h3', { style: { marginTop: '12px' } }, '📋 Starting lineup'),
    h(
      'p',
      { class: 'muted' },
      'The coach fills every spot to make the whole team as strong as possible. Pick someone in a dropdown to pin them to that spot (📌); the coach fills the rest around them.',
    ),
    h(
      'table',
      { class: 'list' },
      h('tr', {}, h('th', {}, 'Spot'), h('th', {}, 'Starting'), h('th', {}, 'Fit'), h('th', {}, 'Change')),
      ...rows,
    ),
    bench.length ? h('p', {}, h('b', {}, 'Bench: '), bench.map(who).join(', ')) : null,
    pins && diff < 0
      ? h(
          'p',
          { class: 'muted' },
          `Your pins make the lineup a little weaker than the coach's pick (${diff} total rating).`,
        )
      : null,
    h(
      'div',
      { class: 'row' },
      h(
        'label',
        { class: 'row' },
        h('input', {
          type: 'checkbox',
          checked: s.team.benchMe ? true : null,
          onchange: (e) => {
            s.team.benchMe = e.target.checked;
            redraw();
          },
        }),
        "Let the coach bench me if someone's better",
      ),
      pins
        ? btn(
            "Reset to coach's lineup",
            () => {
              s.team.lineupLocks = {};
              redraw();
            },
            'small white',
          )
        : null,
    ),
  );
}
/** Toggle + summary for testing teammates at practice on drills they missed at tryouts. */
export function practiceTestRow(s, redraw) {
  const p = s.team.practice;
  const pending = untestedDrills(s);
  const kids = new Set(pending.flatMap((t) => t.ids)).size;
  const box = h(
    'div',
    { style: { marginTop: '8px' } },
    h(
      'label',
      { class: 'row' },
      h('input', {
        type: 'checkbox',
        checked: p.testDrills !== false ? true : null,
        onchange: (e) => {
          p.testDrills = e.target.checked;
          redraw();
        },
      }),
      '🧪 Test teammates on drills they missed',
    ),
  );
  box.appendChild(
    h(
      'p',
      { class: 'muted' },
      pending.length
        ? `${kids} teammate${kids > 1 ? 's' : ''} still need${kids > 1 ? '' : 's'}: ${pending.map((t) => `${t.drill.name} (${t.ids.length})`).join(', ')}. ${p.testDrills !== false ? "They'll run them at the next practice you attend." : 'Turn this on to run them at practice.'}`
        : "Everyone on the team has run every drill you've unlocked.",
    ),
  );
  return box;
}
/**
 * A kid's stats, with the ones that matter in your team's sport highlighted
 * (★ = big effect, bold = some effect, faded = no effect this season).
 */
export function statGrid(s, id, sport = s.team.sport) {
  const name = SPORTS[sport].name;
  return h(
    'div',
    {},
    h(
      'div',
      { class: 'stat-grid' },
      ...STAT_CODES.map((c) => {
        const rel = statRelevance(sport, c);
        return h(
          'div',
          {
            class: `stat-${rel}`,
            title:
              rel === 'key'
                ? `Big effect in ${name}`
                : rel === 'some'
                  ? `Some effect in ${name}`
                  : `No effect in ${name}`,
          },
          h('span', {}, rel === 'key' ? `★ ${STAT_NAMES[c]}` : STAT_NAMES[c]),
          gradeChip(revealLabel(s, id, c), 1),
        );
      }),
    ),
    h(
      'div',
      { class: 'muted stat-legend' },
      `★ = matters most in ${name} · bold = matters some · faded = doesn't count this season`,
    ),
  );
}
/** A kid's details: stats, position and status. */
export function kidDetail(game, id, after) {
  const s = game.state;
  const k = getKid(s, id);
  const isMe = id === 'PLAYER';
  const grid = statGrid(s, id);
  const g = playerGrade(s);
  const mine =
    isMe && s.player.look
      ? h(
          'div',
          { class: 'row', style: { alignItems: 'flex-start' } },
          h('div', {
            class: 'bible-card static',
            html: renderCharacter(
              lookSpec(s.player.look, { grade: g, perk: s.player.perk, heightIn: 50 + (g - 3) * 2.3 }),
            )
              .replace(' width="400" height="720"', '')
              .replace('viewBox="0 0 400 720"', 'viewBox="30 56 340 640"'),
          }),
          h(
            'div',
            {},
            h('b', {}, s.player.name),
            h('div', { class: 'muted' }, `Grade ${g} · drawn to the character bible`),
          ),
        )
      : null;
  const body = h(
    'div',
    {},
    mine,
    !isMe
      ? h(
          'div',
          { class: 'row' },
          portrait(k, 70),
          h(
            'div',
            {},
            h('b', {}, kidName(k)),
            h('div', { class: 'muted' }, `${k.personality} - Grade ${kidGrade(s, id)} - ${k.routine.school}`),
            h('div', { class: 'muted' }, `Friendship: ${friendshipLabel(s.kids[id].f)} (${s.kids[id].f})`),
          ),
        )
      : null,
    h('h3', { style: { margin: '10px 0 4px' } }, 'Stats'),
    grid,
    !isMe
      ? h(
          'p',
          { class: 'muted' },
          'Unknown stats show "?". Run more tryout drills to reveal them. Laser Timing Gates make the grades exact.',
        )
      : null,
    !isMe && s.team.staff.scout ? h('p', {}, `🔭 Scout report: ${scoutLine(s, k)}`) : null,
    !isMe ? h('p', {}, `School average: ${letterFor(kidSchoolAverage(s, id))}`) : null,
  );
  modal({
    title: isMe ? 'You' : shortName(k),
    body,
    wide: true,
    buttons: [
      !isMe && s.team.roster.includes(id)
        ? {
            label: 'Cut from team',
            cls: 'red',
            onClick: () => {
              const r = releaseKid(s, id);
              toast(
                r.ok ? `${k.first_name} is off the team. They're not happy.` : r.reason,
                r.ok ? 'bad' : '',
              );
              after && after();
            },
          }
        : null,
      { label: 'Close', cls: 'white' },
    ].filter(Boolean),
  });
}
/** One line of scouting info about a kid. */
export function scoutLine(s, k) {
  const adult = s.team.staff.scout && s.team.staff.scout.startsWith('adult');
  const pot = k.hidden.potential;
  const stars = adult
    ? Math.max(1, Math.round(pot / 20))
    : Math.max(1, Math.min(5, Math.round(pot / 20) + ((k.id.charCodeAt(5) % 3) - 1)));
  const curve = {
    'Late Bloomer': 'gonna be big in high school',
    'Early Peaker': "as good now as they'll ever be",
    Phenom: 'a once-in-a-generation talent',
    Dud: "probably won't improve much",
    'Growth Spurt': 'about to shoot up like a weed',
    'Morale Machine': 'the heart of any team',
    'Steady Climber': 'gets a little better every year',
  }[k.hidden.growth_curve];
  return `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} potential${adult ? `, ${curve}` : ''}.`;
}
