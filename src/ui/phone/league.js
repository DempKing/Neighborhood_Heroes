// League app: standings, schedule, results and history.
import { KID_BY_ID, shortName } from '../../data/kids.js';
import { nextGameInfo } from '../../game/clock.js';
import { standings, teamOverall } from '../../game/league.js';
import { leagueLeaders, seasonAwards, STAT_COLS, teamStats } from '../../game/leagueStats.js';
import {
  crestCupDate,
  crestCupPending,
  crestCupTeam,
  HILLTOP_TEAM,
  hilltopRoster,
  rivalryRecord,
} from '../../game/rivalry.js';
import { kidOverall } from '../../game/team.js';
import { btn, h } from '../dom.js';

// League
export function leagueApp(game, root, redraw, close) {
  const s = game.state;
  const lg = s.league;
  if (!lg) {
    root.appendChild(h('p', {}, 'No season right now (summer break).'));
    leagueHistory(s, root);
    return;
  }
  game._lgView = game._lgView || 'standings';
  const views = [
    ['standings', 'Standings'],
    ['leaders', 'Leaders'],
    ['team', 'Team stats'],
    ['schedule', 'Schedule'],
    ['awards', 'Awards'],
    ['crest', '🏆 Crest Cup'],
    ['news', 'News'],
  ];
  root.append(
    h(
      'div',
      { class: 'chips' },
      ...views.map(([id, l]) =>
        h(
          'div',
          {
            class: `chip ${game._lgView === id ? 'sel' : ''}`,
            onclick: () => {
              game._lgView = id;
              redraw();
            },
          },
          l,
        ),
      ),
    ),
  );
  const box = h('div', { class: 'box', style: { marginTop: '8px' } });
  const next = nextGameInfo(s);
  if (next)
    root.append(
      h(
        'div',
        { class: 'row', style: { marginTop: '8px' } },
        h('span', { style: { flex: 1 } }, `🏟️ Next game: ${next.label}`),
        next.days > 0
          ? btn(
              '⏭️ Skip to it',
              () => {
                close();
                game.skipToGame();
              },
              'small red',
            )
          : null,
      ),
    );
  root.append(box);
  const cols = STAT_COLS[lg.sport || s.team.sport];
  if (game._lgView === 'standings') {
    const st = standings(s);
    box.append(
      h('h3', {}, `${lg.bandName} standings`),
      h('p', { class: 'muted' }, "OVR = how good each team's best lineup is (0-99)."),
      h(
        'div',
        { class: 'hscroll' },
        h(
          'table',
          { class: 'list' },
          h(
            'tr',
            {},
            h('th', {}, '#'),
            h('th', {}, 'Team'),
            h('th', {}, 'OVR'),
            h('th', {}, 'W'),
            h('th', {}, 'L'),
            h('th', {}, 'T'),
            h('th', {}, 'PF'),
            h('th', {}, 'PA'),
          ),
          ...st.map((t, i) =>
            h(
              'tr',
              { style: t.player ? { background: '#fff3b0' } : {} },
              h('td', {}, i + 1),
              h('td', {}, t.name),
              h('td', {}, h('span', { class: 'ovr' }, teamOverall(s, t.name))),
              h('td', {}, t.w),
              h('td', {}, t.l),
              h('td', {}, t.t),
              h('td', {}, t.pf),
              h('td', {}, t.pa),
            ),
          ),
        ),
      ),
    );
  } else if (game._lgView === 'leaders') {
    box.append(h('h3', {}, 'League leaders'));
    for (const [key, label] of cols) {
      const top = leagueLeaders(s, key, 5);
      box.append(
        h('h4', { style: { margin: '8px 0 2px' } }, label),
        top.length
          ? h(
              'table',
              { class: 'list' },
              ...top.map((p, i) =>
                h(
                  'tr',
                  { style: p.id === 'PLAYER' || p.team === s.team.name ? { background: '#fff3b0' } : {} },
                  h('td', { style: { width: '22px' } }, i + 1),
                  h('td', {}, h('b', {}, p.name), h('div', { class: 'muted' }, p.team)),
                  h('td', { style: { textAlign: 'right' } }, h('b', {}, p.n)),
                ),
              ),
            )
          : h('p', { class: 'muted' }, 'No games played yet.'),
      );
    }
  } else if (game._lgView === 'team') {
    const names = lg.teams.map((t) => t.name);
    game._lgTeam = names.includes(game._lgTeam)
      ? game._lgTeam
      : names.includes(s.team.name)
        ? s.team.name
        : names[0];
    const pick = h(
      'select',
      {
        onchange: (e) => {
          game._lgTeam = e.target.value;
          redraw();
        },
      },
      ...names.map((n) => h('option', { value: n, selected: n === game._lgTeam ? 'selected' : null }, n)),
    );
    const ts = teamStats(s, game._lgTeam);
    const t = lg.teams.find((x) => x.name === game._lgTeam);
    box.append(
      h('h3', {}, 'Team stats'),
      pick,
      h(
        'div',
        { class: 'row', style: { margin: '6px 0' } },
        h('span', { class: 'pill info' }, `OVR ${teamOverall(s, game._lgTeam)}`),
        t ? h('span', { class: 'pill' }, `${t.w}-${t.l}${t.t ? `-${t.t}` : ''}`) : null,
        ...cols.map(([k, l]) => h('span', { class: 'pill' }, `${l}: ${ts.totals[k] || 0}`)),
      ),
      ts.players.length
        ? h(
            'div',
            { class: 'hscroll' },
            h(
              'table',
              { class: 'list' },
              h('tr', {}, h('th', {}, 'Player'), h('th', {}, 'GP'), ...cols.map(([k]) => h('th', {}, k))),
              ...ts.players.map((p) =>
                h(
                  'tr',
                  { style: p.id === 'PLAYER' ? { background: '#fff3b0' } : {} },
                  h('td', {}, p.name),
                  h('td', {}, p.gp),
                  ...cols.map(([k]) => h('td', {}, p[k] || 0)),
                ),
              ),
            ),
          )
        : h('p', { class: 'muted' }, 'No games played yet.'),
    );
  } else if (game._lgView === 'schedule') {
    const rounds = [...(lg.schedule || []), ...(lg.playoffs || [])];
    box.append(h('h3', {}, 'Schedule & scores'));
    for (const r of rounds) {
      for (const g of r.games) {
        const mine = g.home === s.team.name || g.away === s.team.name;
        box.appendChild(
          h(
            'div',
            {
              class: 'row',
              style: {
                fontSize: '13px',
                fontWeight: mine ? 900 : 600,
                background: mine ? '#fff3b0' : 'transparent',
                padding: '2px 4px',
                borderRadius: '6px',
              },
            },
            h('span', { style: { width: '62px' } }, g.playoff || `Week ${r.week}`),
            h('span', { style: { flex: 1 } }, `${g.away} @ ${g.home}`),
            g.result
              ? h('b', {}, `${g.result.score[1]}-${g.result.score[0]}${g.result.forfeit ? ' (forfeit)' : ''}`)
              : h('span', { class: 'muted' }, 'upcoming'),
          ),
        );
      }
    }
    if (!rounds.length) box.append(h('p', { class: 'muted' }, 'Not posted yet.'));
  } else if (game._lgView === 'awards') {
    box.append(h('h3', {}, 'Season awards'));
    const aw = lg.awards;
    const race = !aw;
    const show = aw || seasonAwards(s);
    box.append(
      h(
        'p',
        { class: 'muted' },
        race
          ? "The MVP and stat awards are handed out when the season ends. Here's the race so far:"
          : "This season's winners:",
      ),
    );
    if (show) {
      box.append(
        h(
          'div',
          { class: 'award' },
          h('span', { class: 'aw-ico' }, '🏅'),
          h(
            'div',
            {},
            h('b', {}, `${lg.bandName} MVP${race ? ' (leading)' : ''}`),
            h('div', {}, `${show.mvp.id === 'PLAYER' ? 'You' : show.mvp.name}, ${show.mvp.team}`),
          ),
        ),
        ...show.leaders.map((a) =>
          h(
            'div',
            { class: 'award' },
            h('span', { class: 'aw-ico' }, '🥇'),
            h(
              'div',
              {},
              h('b', {}, a.title),
              h('div', {}, `${a.id === 'PLAYER' ? 'You' : a.name} (${a.team}): ${a.n}`),
            ),
          ),
        ),
      );
    } else box.append(h('p', {}, 'No games played yet.'));
    leagueHistory(s, box);
  } else if (game._lgView === 'crest') {
    const rec = rivalryRecord(s);
    const cc = crestCupDate(s);
    const pending = crestCupPending(s);
    const rep = crestCupTeam(s);
    const hawks = hilltopRoster(s);
    box.append(
      h('h3', {}, `🏆 The Crest Cup vs the ${HILLTOP_TEAM}`),
      h(
        'p',
        {},
        `The season finale. Once the playoffs crown a league champion, that team represents Suncrest Academy against Hilltop Prep's team at their campus field, the Sunday after the championship (1:00 PM). Win the league to play in it!`,
      ),
      h(
        'div',
        { class: 'row' },
        h('span', { class: 'pill info' }, `Suncrest all-time: ${rec.w}-${rec.l}${rec.t ? `-${rec.t}` : ''}`),
        h('span', { class: 'pill ovr-pill' }, `Hawks OVR ${teamOverall(s, HILLTOP_TEAM)}`),
        h('span', { class: 'pill ovr-pill' }, `Yours ${teamOverall(s, s.team.name)}`),
      ),
      h(
        'p',
        {},
        rep && pending
          ? rep === s.team.name
            ? `🏆 YOU'RE REPRESENTING SUNCREST! ${cc ? `${cc.label}, 1:00 PM.` : ''}`
            : `This season's representative: the ${rep} (league champs). ${cc ? `${cc.label}, 1:00 PM.` : ''}`
          : rep
            ? "This season's Crest Cup is done."
            : `This season: ${cc ? `${cc.label}, 1:00 PM, ` : ''}after the championship. The league champion will be chosen to play.`,
      ),
      h('h4', { style: { margin: '8px 0 2px' } }, 'The Hawks (scouting report)'),
      h(
        'div',
        {},
        ...hawks.slice(0, 12).map((id) => {
          const k = KID_BY_ID.get(id);
          return h(
            'div',
            { class: 'row', style: { fontSize: '13px' } },
            h(
              'span',
              { style: { flex: 1 } },
              shortName(k),
              k.routine.school.startsWith('Hilltop') ? '' : h('span', { class: 'muted' }, ' (scholarship)'),
            ),
            h('span', { class: 'muted' }, kidOverall(s, id).pos),
            h('span', { class: 'ovr' }, Math.round(kidOverall(s, id).rating)),
          );
        }),
      ),
      h('h4', { style: { margin: '8px 0 2px' } }, 'Past Crest Cups'),
      rec.games.length
        ? h(
            'div',
            {},
            ...rec.games.map((g) =>
              h(
                'div',
                {},
                `${g.label} (grade ${g.grade}, ${g.mine === false ? `the ${g.team}` : 'your team'}): ${g.forfeit ? 'Forfeit loss' : g.won ? `WON ${g.score[1]}-${g.score[0]} 🏆` : g.tie ? `Tie ${g.score[1]}-${g.score[0]}` : `Lost ${g.score[1]}-${g.score[0]}`}`,
              ),
            ),
          )
        : h('p', { class: 'muted' }, 'Never played. Hilltop has held the cup forever.'),
    );
  } else {
    box.append(
      h('h3', {}, 'Suncrest Gazette'),
      ...s.news
        .slice(0, 20)
        .map((n) => h('div', { style: { fontSize: '13px', margin: '3px 0' } }, `📰 ${n.text}`)),
    );
  }
}
/** Past seasons. */
function leagueHistory(s, root) {
  root.append(
    h('h3', { style: { marginTop: '10px' } }, 'Your history'),
    ...(s.team.history.length
      ? s.team.history.map((x) =>
          h(
            'div',
            {},
            `${x.label}: ${x.w}-${x.l}${x.t ? `-${x.t}` : ''}, ${x.place}${['th', 'st', 'nd', 'rd'][x.place] || 'th'} place${x.champion ? ' 🏆 CHAMPIONS' : ''}${x.mvp ? ` · MVP: ${x.mvp}` : ''}`,
          ),
        )
      : [h('div', { class: 'muted' }, 'No seasons played yet.')]),
  );
}
