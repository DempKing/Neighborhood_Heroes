// Contacts app.
import { KIDS, shortName } from '../../data/kids.js';
import { callCheck, friendshipLabel, hasNumber } from '../../game/social.js';
import { sfx } from '../audio.js';
import { btn, h, toast } from '../dom.js';
import { openTalk, portrait } from '../talk.js';
import { logCall } from './money.js';

// Contacts

export function contactsTab(game, root, redraw, close) {
  const s = game.state;
  const list = KIDS.filter((k) => hasNumber(s.kids[k.id])).sort((a, b) => s.kids[b.id].f - s.kids[a.id].f);
  if (!list.length) {
    root.append(
      h(
        'p',
        {},
        'No contacts yet. Every kid you meet gives you their number: walk up to someone and say hi (E).',
      ),
    );
    return;
  }
  const table = h(
    'table',
    { class: 'list' },
    h(
      'tr',
      {},
      h('th', {}, ''),
      h('th', {}, 'Kid'),
      h('th', {}, 'Friendship'),
      h('th', {}, 'Team'),
      h('th', {}, ''),
    ),
  );
  for (const k of list) {
    const ks = s.kids[k.id];
    const call = btn(
      '📞 Call',
      () => {
        const c = callCheck(s, k.id);
        if (!c.ok) {
          sfx('bad');
          toast(c.text, 'bad');
          return;
        }
        sfx('click');
        logCall(s, k.id);
        close();
        openTalk(game, k.id, { phone: true, line: `Hello? Oh hi ${s.player.name}!` });
      },
      'small green',
    );
    table.appendChild(
      h(
        'tr',
        {},
        h('td', { style: { width: '44px' } }, portrait(k, 20)),
        h('td', {}, h('b', {}, shortName(k)), h('div', { class: 'muted' }, k.personality)),
        h(
          'td',
          {},
          h(
            'div',
            { class: 'row' },
            h('div', { class: 'bar' }, h('i', { style: { width: `${ks.f}%` } })),
            friendshipLabel(ks.f),
          ),
        ),
        h(
          'td',
          {},
          s.team.roster.includes(k.id)
            ? '★ Yours'
            : s.team.invites.includes(k.id)
              ? '✉ Invited'
              : ks.team || 'Free',
        ),
        h('td', {}, call),
      ),
    );
  }
  root.append(
    h(
      'p',
      { class: 'muted' },
      'Call a friend to chat, hang out, or invite them to a tryout. No calls during school or after 9 PM.',
    ),
    table,
  );
}
