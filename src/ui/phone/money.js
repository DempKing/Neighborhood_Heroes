// Bank, backpack, diary and calls apps.
import { KID_BY_ID, shortName } from '../../data/kids.js';
import { ITEMS, JOBS, PRIZES } from '../../data/world.js';
import { jobReady, jobUnlocked } from '../../game/economy.js';
import { callCheck } from '../../game/social.js';
import { playerBand } from '../../game/team.js';
import { formatTime } from '../../game/time.js';
import { sfx } from '../audio.js';
import { btn, h, modal, money, toast } from '../dom.js';
import { openTalk, portrait } from '../talk.js';

// Money
export function bankApp(game, root) {
  const s = game.state;
  const activity = s.log.filter((l) => /\$\d/.test(l.text)).slice(0, 15);
  const pz = PRIZES[playerBand(s).prize] || PRIZES.jr;
  const jobs = h(
    'div',
    { class: 'box' },
    h('h3', {}, '💼 Jobs'),
    h('p', {}, `Total earned from work: ${money(s.jobs.earned)}`),
  );
  for (const [id, j] of Object.entries(JOBS)) {
    const un = jobUnlocked(s, id);
    jobs.appendChild(
      h(
        'div',
        { style: { margin: '6px 0' } },
        h('b', {}, j.name),
        ' ',
        un
          ? jobReady(s, id)
            ? h('span', { class: 'pill good' }, 'Ready')
            : h(
                'span',
                { class: 'pill warn' },
                `Need: ${j.needs
                  .filter((n) => !(s.inv.items[n] > 0))
                  .map((n) => ITEMS[n].name)
                  .join(', ')}`,
              )
          : h('span', { class: 'pill bad' }, `Locked: earn $${j.unlock.earned}`),
        h('div', { class: 'muted' }, j.desc),
      ),
    );
  }
  root.append(
    h(
      'div',
      { class: 'bank-card' },
      h('div', { class: 'muted' }, 'Suncrest Kids Credit Union'),
      h('div', { class: 'bank-bal' }, money(s.money)),
      h('div', {}, `${s.player.name}'s piggy account`),
    ),
    h(
      'div',
      { class: 'box', style: { margin: '10px 0' } },
      h('h3', {}, 'Recent activity'),
      activity.length
        ? h(
            'div',
            {},
            ...activity.map((l) =>
              h('div', { style: { fontSize: '13px', margin: '3px 0' } }, `Day ${l.day}: ${l.text}`),
            ),
          )
        : h('p', { class: 'muted' }, 'Nothing yet.'),
      s.team.fansLast ? h('p', {}, `Last home game: ${s.team.fansLast} fans.`) : null,
    ),
    h(
      'div',
      { class: 'box', style: { marginBottom: '10px' } },
      h('h3', {}, '🏆 League prize money'),
      h(
        'p',
        {},
        `${playerBand(s).name}: win ${money(pz.win)}, tie ${money(pz.tie)} (home or away). Playoffs ${money(pz.semifinal)}, runner-up ${money(pz.runnerUp)}, champions ${money(pz.champion)}.`,
      ),
    ),
    jobs,
    h(
      'p',
      { class: 'muted' },
      'Other ways to make money: ask Mom & Dad, do chores (3 a day), pick up cans (5¢ each at the grocery store bottle return), find coins on the ground and do favors for kids. Once your team is official it earns from home games (tickets, concessions, merch), league win bonuses and playoff prize money.',
    ),
  );
}
/** The backpack: items you carry. */
export function backpackApp(game, root) {
  const s = game.state;
  const items = Object.entries(s.inv.items).filter(([id, n]) => n > 0 && id !== 'trophy');
  const name = (id) =>
    ITEMS[id]
      ? ITEMS[id].name
      : id === 'cans'
        ? 'Cans & bottles'
        : id === 'lemonade'
          ? 'Cups of lemonade mix'
          : id;
  const icon = (id) => (ITEMS[id] ? ITEMS[id].icon : id === 'cans' ? '🥫' : id === 'lemonade' ? '🍋' : '📦');
  root.append(
    h('p', { class: 'muted' }, 'Press I any time to open your backpack.'),
    items.length
      ? h(
          'div',
          { class: 'bag-grid' },
          ...items.map(([id, n]) =>
            h(
              'div',
              { class: 'bag-item' },
              h('span', { class: 'bi-ico' }, icon(id)),
              h('b', {}, name(id)),
              h('span', { class: 'bi-n' }, `x${n}`),
            ),
          ),
        )
      : h('p', {}, 'Empty! (Except for a mystery granola bar from last year.)'),
    h('h3', { style: { margin: '12px 0 4px' } }, `🏆 Trophies (${s.inv.trophies.length})`),
    s.inv.trophies.length
      ? h(
          'div',
          {},
          ...s.inv.trophies.map((t) =>
            h(
              'div',
              { class: 'row' },
              '🏆',
              h('span', { style: { flex: 1 } }, t.name),
              t.slot != null
                ? h('span', { class: 'pill good' }, 'On the shelf')
                : h('span', { class: 'pill warn' }, 'In your bag'),
            ),
          ),
        )
      : h('p', { class: 'muted' }, 'No trophies yet. Win some games!'),
    s.inv.trophies.some((t) => t.slot == null)
      ? h('p', { class: 'muted' }, 'Put trophies on the shelf in your trophy room at home.')
      : null,
  );
}
/** The diary: the log of what happened. */
export function diaryApp(game, root) {
  const s = game.state;
  root.append(
    ...s.log
      .slice(0, 40)
      .map((l) => h('div', { style: { fontSize: '13px', margin: '3px 0' } }, `Day ${l.day}: ${l.text}`)),
  );
  if (!s.log.length) root.append(h('p', { class: 'muted' }, 'Dear diary... nothing happened yet.'));
}
/** The calls app. */
export function callsApp(game, root, redraw, close) {
  const s = game.state;
  const recent = (s.calls || []).slice(-12).reverse();
  const callKid = (id) => {
    const c = callCheck(s, id);
    if (!c.ok) {
      sfx('bad');
      toast(c.text, 'bad');
      return;
    }
    sfx('click');
    logCall(s, id);
    close();
    openTalk(game, id, { phone: true, line: `Hello? Oh hi ${s.player.name}!` });
  };
  const family = [
    ['Mom', "Honey, I'm in a meeting! Talk at dinner, okay? Love you!"],
    ['Dad', "Hey champ! Can't talk, the lawn mower is making a noise. Love you!"],
  ];
  root.append(
    h('h3', {}, 'Favorites'),
    h(
      'div',
      { class: 'row', style: { flexWrap: 'wrap', marginBottom: '8px' } },
      ...family.map(([who, line]) =>
        btn(
          `📞 ${who}`,
          () => {
            sfx('click');
            modal({ title: `Calling ${who}...`, body: `"${line}"` });
          },
          'small white',
        ),
      ),
    ),
    h('h3', {}, 'Recent calls'),
  );
  if (!recent.length)
    root.append(
      h(
        'p',
        { class: 'muted' },
        "No calls yet. Call any kid you've met from Contacts or their Social profile.",
      ),
    );
  for (const c of recent) {
    const k = KID_BY_ID.get(c.id);
    if (!k) continue;
    root.appendChild(
      h(
        'div',
        { class: 'friend' },
        portrait(k, 24),
        h(
          'div',
          { style: { flex: 1 } },
          h('b', {}, shortName(k)),
          h('div', { class: 'muted' }, `Day ${c.day}, ${formatTime(c.minute)}`),
        ),
        btn('📞', () => callKid(c.id), 'small green'),
      ),
    );
  }
}
/** Remember a call for the Calls app. */
export function logCall(s, id) {
  s.calls = s.calls || [];
  s.calls.push({ id, day: s.time.day, minute: s.time.minute });
  if (s.calls.length > 30) s.calls.shift();
}
