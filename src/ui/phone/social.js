// Social app: friendships, the notebook of what you've learned about people.
import { KID_BY_ID, kidName, KIDS, shortName } from '../../data/kids.js';
import { knowledgeOn, knowledgeSummary, knowsName, setKnowledgeOn } from '../../game/knowledge.js';
import { describeSlot, sectionOf } from '../../game/routines.js';
import { classmates, sharedClasses } from '../../game/school.js';
import { callCheck, friendshipLabel, hasNumber, parseHook } from '../../game/social.js';
import { kidGrade, playerGrade } from '../../game/state.js';
import { OUTFIT } from '../../world2d/build.js';
import { sfx } from '../audio.js';
import { btn, h, modal, toast } from '../dom.js';
import { kidCheckIn } from '../mapview.js';
import { openTalk, portrait } from '../talk.js';
import { logCall } from './money.js';
import { scoutLine, statGrid } from './team.js';

// Social
/** Social: every kid you meet adds you. Profiles show where friends are checked in right now. */
export function socialApp(game, root, redraw, close) {
  const s = game.state;
  game._socialView = game._socialView || 'friends';
  const views = [
    ['friends', 'Friends'],
    ['feed', 'Feed'],
  ];
  root.append(
    h(
      'div',
      { class: 'chips' },
      ...views.map(([id, l]) =>
        h(
          'div',
          {
            class: `chip ${game._socialView === id ? 'sel' : ''}`,
            onclick: () => {
              game._socialView = id;
              redraw();
            },
          },
          l,
        ),
      ),
    ),
  );
  const met = KIDS.filter((k) => s.kids[k.id].met);
  const scouted = KIDS.filter((k) => Object.keys(s.kids[k.id].rev).length || s.kids[k.id].remembered);
  if (!met.length && !scouted.length) {
    root.append(
      h('p', {}, 'No friends yet! Walk up to a kid and say hi (E). Everyone you meet adds you here.'),
    );
    return;
  }
  if (!met.length && game._socialView === 'friends' && !game._kidFilter) game._kidFilter = 'scouted';
  if (game._socialView === 'feed') {
    const posts = [];
    for (const k of met) {
      const c = kidCheckIn(s, k);
      if (c)
        posts.push({
          k,
          f: s.kids[k.id].f,
          text: `📍 checked in at ${c.name}${c.zone && c.loc === 'school' ? '' : c.zone ? ` (${c.zone})` : ''}`,
        });
    }
    posts.sort((a, b) => b.f - a.f);
    root.append(
      ...posts
        .slice(0, 20)
        .map((p) =>
          h(
            'div',
            { class: 'post' },
            portrait(p.k, 26),
            h('div', {}, h('b', {}, shortName(p.k)), h('div', {}, p.text)),
          ),
        ),
      ...s.news
        .slice(0, 10)
        .map((n) =>
          h(
            'div',
            { class: 'post' },
            h('span', { class: 'post-ico' }, '📰'),
            h('div', {}, h('b', {}, 'Suncrest Gazette'), h('div', {}, n.text)),
          ),
        ),
    );
    if (!posts.length)
      root.append(
        h(
          'p',
          { class: 'muted' },
          'None of your friends have checked in where you can see. Learn their routines (chat and hang out) to see their check-ins.',
        ),
      );
    return;
  }
  const filters = [
    ['met', 'All'],
    ['class', 'My classes'],
    ['free', 'Free agents'],
    ['rival', 'Rival teams'],
    ['mine', 'My team'],
    ['scouted', '🧠 Scouted'],
  ];
  game._kidFilter = game._kidFilter || 'met';
  const g = playerGrade(s);
  const classSet = new Set([1, 2, 3, 4].flatMap((p) => classmates(s, p)));
  // Scouted: every kid whose stats you know, met or not (including what you remember from past runs).
  const scoutRank = (k) => Object.values(s.kids[k.id].rev).reduce((a, r) => a + (r === 'exact' ? 2 : 1), 0);
  const list =
    game._kidFilter === 'scouted'
      ? scouted
          .slice()
          .sort((a, b) =>
            kidGrade(s, a.id) === g ? -1 : kidGrade(s, b.id) === g ? 1 : scoutRank(b) - scoutRank(a),
          )
      : met
          .filter((k) => {
            const ks = s.kids[k.id];
            switch (game._kidFilter) {
              case 'class':
                return kidGrade(s, k.id) === g && classSet.has(k.id);
              case 'free':
                return !ks.team;
              case 'rival':
                return ks.team && ks.team !== s.team.name;
              case 'mine':
                return s.team.roster.includes(k.id);
              default:
                return true;
            }
          })
          .sort((a, b) => s.kids[b.id].f - s.kids[a.id].f);
  root.append(
    h(
      'div',
      { class: 'chips', style: { marginTop: '6px' } },
      ...filters.map(([id, l]) =>
        h(
          'div',
          {
            class: `chip ${game._kidFilter === id ? 'sel' : ''}`,
            onclick: () => {
              game._kidFilter = id;
              redraw();
            },
          },
          l,
        ),
      ),
    ),
    h(
      'p',
      { class: 'muted' },
      game._kidFilter === 'scouted'
        ? `${scouted.length} kids scouted. 🧠 = remembered from a past run (they don't remember you). Tap a profile for their stats.`
        : `${met.length} friends (of ${KIDS.length} kids in Suncrest). Tap a profile to see where they're checked in.`,
    ),
  );
  for (const k of list) {
    const ks = s.kids[k.id];
    const c = kidCheckIn(s, k);
    root.appendChild(
      h(
        'div',
        { class: 'friend click', onclick: () => notebookEntry(game, k.id, close) },
        portrait(k, 30),
        h(
          'div',
          { style: { flex: 1 } },
          h(
            'b',
            {},
            shortName(k),
            ks.remembered
              ? h('span', { class: 'remembered', title: 'Remembered from a past run' }, ' 🧠')
              : null,
            !ks.met ? h('span', { class: 'muted' }, ' (not met)') : null,
          ),
          h(
            'div',
            { class: 'muted' },
            `Grade ${kidGrade(s, k.id)} · ${s.team.roster.includes(k.id) ? '★ Your team' : s.team.invites.includes(k.id) ? '✉ Invited' : ks.team || 'Free agent'}`,
          ),
          h('div', { class: 'checkin' }, c ? `📍 ${c.name}` : '📍 Location hidden'),
        ),
        h(
          'div',
          { class: 'row' },
          h('div', { class: 'bar', style: { width: '50px' } }, h('i', { style: { width: `${ks.f}%` } })),
        ),
      ),
    );
  }
  if (!list.length) root.append(h('p', {}, 'Nobody here yet.'));
}
/** Everything you know about one kid. */
function notebookEntry(game, id, closePhone = null) {
  const s = game.state;
  const k = KID_BY_ID.get(id);
  const ks = s.kids[id];
  const g = kidGrade(s, id);
  const named = knowsName(ks);
  const likes = ks.f >= 30 || ks.knowLikes;
  const traitN = Math.max(ks.f >= 65 ? 2 : ks.f >= 45 ? 1 : 0, ks.knowTraits || 0);
  const hook = ks.hookAsked ? parseHook(k) : null;
  const c = kidCheckIn(s, k);
  const color = OUTFIT[k.looks.favorite_color] || '#8e6ce6';
  const handle = `@${(k.nickname || k.first_name).toLowerCase().replace(/[^a-z0-9]/g, '')}${k.last_name.toLowerCase().slice(0, 3)}`;
  const teamLine = s.team.roster.includes(id)
    ? `★ ${s.team.name}`
    : s.team.invites.includes(id)
      ? '✉ Invited to your team'
      : ks.team || 'Free agent';
  const shared = sectionOf(k, g) != null && g === playerGrade(s) ? sharedClasses(s, id) : null;
  let m = null;
  const call = () => {
    const r = callCheck(s, id);
    if (!r.ok) {
      sfx('bad');
      toast(r.text, 'bad');
      return;
    }
    sfx('click');
    logCall(s, id);
    if (m) m.close();
    if (closePhone) closePhone();
    openTalk(game, id, { phone: true, line: `Hello? Oh hi ${s.player.name}!` });
  };
  const section = (title, ...kids) => h('div', { class: 'pf-card' }, h('h4', {}, title), ...kids);
  const routine = ks.known.length
    ? ks.known
        .map((slot) => describeSlot(k, slot, g))
        .filter(Boolean)
        .map((txt) => h('div', { class: 'pf-line' }, `📍 ${txt}`))
    : [
        h(
          'div',
          { class: 'muted' },
          "You don't know their routine yet. Chat with them (good chats reveal it) or hang out to learn it.",
        ),
      ];
  const body = h(
    'div',
    { class: 'profile' },
    h('div', {
      class: 'pf-cover',
      style: { background: `linear-gradient(135deg, ${color}, #8e6ce6 70%, #ff7eb6)` },
    }),
    h(
      'div',
      { class: 'pf-head' },
      h('div', { class: 'pf-avatar' }, portrait(k, 96)),
      h(
        'div',
        { class: 'pf-actions' },
        hasNumber(ks)
          ? btn('📞 Call', call, 'small green')
          : h('span', { class: 'pill' }, 'Say hi in person to get their number'),
        s.team.roster.includes(id) ? h('span', { class: 'pill good' }, '★ Teammate') : null,
      ),
    ),
    h(
      'div',
      { class: 'pf-id' },
      h(
        'div',
        { class: 'pf-name' },
        named ? kidName(k) : '???',
        ks.remembered
          ? h('span', { class: 'pf-badge', title: 'You remember them from a past run' }, '🧠')
          : null,
      ),
      h('div', { class: 'pf-handle' }, named ? handle : '@????'),
      h(
        'div',
        { class: 'pf-bio' },
        `${k.personality} · ${k.routine.school}${shared != null ? (shared ? ` · in ${shared} of your classes` : '') : ''}`,
      ),
      h('div', { class: 'pf-meta' }, `🏠 ${k.residence.neighborhood}`, h('span', {}, `🛡️ ${teamLine}`)),
    ),
    h(
      'div',
      { class: 'pf-counts' },
      h('div', {}, h('b', {}, ks.f), h('span', {}, friendshipLabel(ks.f))),
      h('div', {}, h('b', {}, g), h('span', {}, 'Grade')),
      h('div', {}, h('b', {}, Object.keys(ks.rev).length), h('span', {}, 'Stats known')),
    ),
    h(
      'div',
      { class: `pf-checkin ${c ? '' : 'off'}` },
      c
        ? `📍 Checked in at ${c.name}${c.zone && c.loc !== 'school' ? ` (${c.zone})` : ''}`
        : '📍 Location hidden (learn their routine for this time of day)',
    ),
    ks.remembered && !ks.met
      ? h(
          'div',
          { class: 'pf-note' },
          "🧠 You remember them from a past run, but they don't know you yet. Say hi!",
        )
      : null,
    section(
      'Likes',
      likes
        ? h('div', { class: 'pf-tags' }, ...k.likes.map((x) => h('span', { class: 'pf-tag' }, x)))
        : h('div', { class: 'muted' }, 'Get friendlier to learn what they like.'),
    ),
    traitN
      ? section(
          'Traits',
          h(
            'div',
            { class: 'pf-tags' },
            ...k.traits.slice(0, traitN).map((x) => h('span', { class: 'pf-tag trait' }, x)),
          ),
        )
      : null,
    hook
      ? section('What it takes to recruit them', h('div', {}, `🤔 ${hook.label}${ks.hook ? ' ✅ DONE' : ''}`))
      : null,
    section('Routine', ...routine),
    section(
      'Stats seen at tryouts',
      statGrid(s, id),
      s.team.staff.scout ? h('p', {}, `🔭 ${scoutLine(s, k)}`) : null,
    ),
  );
  m = modal({ title: '', body, wide: true });
  m.el.classList.add('profile-modal');
}
/** Settings: carry what you know about the kids into your next run. */
export function knowledgeBox(game, redraw) {
  const s = game.state;
  const on = knowledgeOn();
  const sum = knowledgeSummary(s);
  return h(
    'div',
    { class: 'box' },
    h('h3', {}, '🧠 Knowledge from past runs'),
    h(
      'label',
      { class: 'switch-row' },
      h('input', {
        type: 'checkbox',
        checked: on,
        onchange: (e) => {
          setKnowledgeOn(e.target.checked);
          sfx('click');
          redraw();
        },
      }),
      h('span', { class: 'switch' }),
      h('b', {}, 'Remember the kids from a past run'),
    ),
    h(
      'p',
      { class: 'muted' },
      on
        ? "On: when you start a New Game, pick one of your saves to remember. The new run replaces that save, and you start out knowing every kid you knew there: names, stats, routines, likes and traits. Kids won't remember you, so friendships start over."
        : 'Off: new games start with a blank notebook.',
    ),
    h(
      'p',
      {},
      `This run knows ${sum.named} kids by name, ${sum.stats} stats (${sum.exact} exact) and ${sum.routines} routine spots.`,
    ),
    s.legacy
      ? h('p', { class: 'muted' }, `🧠 Started with what ${s.legacy.from} knew about ${s.legacy.kids} kids.`)
      : null,
  );
}
