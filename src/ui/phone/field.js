// Field & staff app: the home field, upgrades, prices and helpers.
import { KID_BY_ID, shortName } from '../../data/kids.js';
import { ADULTS, FIELDS, GEAR, PRIZES, STAFF_ROLES, UPGRADES } from '../../data/world.js';
import {
  buyGear,
  buyUpgrade,
  facilityScore,
  fieldPreview,
  gearBoostText,
  gearName,
  homeGameRevenue,
  isRegistered,
  playerBand,
  PRICE_MAX,
  prices,
  sellsConcessions,
  sellsMerch,
  setField,
  setPrice,
  ticketFair,
  upgradeCap,
  upgradeName,
} from '../../game/team.js';
import { sfx } from '../audio.js';
import { btn, clear, h, money, toast } from '../dom.js';
import { jerseyPreview } from '../jersey.js';

// Field & staff
/** Home-game prices (once the team is official). Higher prices = fewer buyers. */
const buyers = (n) => `${n} buyer${n === 1 ? '' : 's'}`;
/** Ticket, snack and merch prices. */
function pricesBox(s) {
  const box = h('div', { class: 'box' }, h('h3', {}, '💵 Home game prices'));
  if (!isRegistered(s)) {
    box.appendChild(
      h(
        'p',
        { class: 'muted' },
        "Once your team is official (registered with the league), you set ticket, concession and merch prices here. Home games, win bonuses and playoff prize money become your team's income.",
      ),
    );
    return box;
  }
  const est = h('div', { class: 'price-est' });
  const showEst = () => {
    const r = homeGameRevenue(s);
    clear(est).append(
      h('div', {}, h('b', {}, `${r.fans}`), ` fans expected (of ${r.cap} seats)`),
      h(
        'div',
        {},
        `Tickets ${money(r.tickets)}`,
        r.snackBuyers ? ` · Snacks ${money(r.concessions)} (${buyers(r.snackBuyers)})` : '',
        r.merchBuyers ? ` · Merch ${money(r.merch)} (${buyers(r.merchBuyers)})` : '',
      ),
      h(
        'div',
        {},
        h('b', {}, `About ${money(r.net)} per home game`),
        r.parents || r.rent || r.staffPay
          ? h(
              'span',
              { class: 'muted' },
              ` after ${[r.parents ? "Mom & Dad's cut" : '', r.rent ? 'rent' : '', r.staffPay ? 'staff' : ''].filter(Boolean).join(', ')}`,
            )
          : null,
      ),
    );
  };
  const slider = (kind, label, fair, note) => {
    const pr = prices(s);
    const inp = h('input', { type: 'range', min: 0, max: PRICE_MAX[kind], step: 0.25, value: pr[kind] });
    const val = h('b', { class: 'price-val' }, money(pr[kind]));
    inp.addEventListener('input', () => {
      setPrice(s, kind, +inp.value);
      val.textContent = money(+inp.value);
      showEst();
    });
    box.appendChild(
      h(
        'div',
        { class: 'price-row' },
        h(
          'div',
          { class: 'price-label' },
          label,
          h('div', { class: 'muted' }, note || `Fair price: ${money(fair)}`),
        ),
        inp,
        val,
      ),
    );
  };
  slider('ticket', '🎟️ Tickets', ticketFair(s));
  if (sellsConcessions(s))
    slider(
      'concession',
      `🌭 ${upgradeName(s, 'concessions')}`,
      UPGRADES.concessions.fair[s.team.upgrades.concessions],
    );
  else
    box.appendChild(
      h('p', { class: 'muted' }, '🌭 Concessions: unlock a lemonade stand in Upgrades to sell snacks.'),
    );
  if (sellsMerch(s))
    slider('merch', `🧢 ${upgradeName(s, 'merch')}`, UPGRADES.merch.fair[s.team.upgrades.merch]);
  else
    box.appendChild(
      h('p', { class: 'muted' }, '🧢 Merch: unlock it in Upgrades (Team Merch) to sell to fans.'),
    );
  box.appendChild(est);
  const pz = PRIZES[playerBand(s).prize] || PRIZES.jr;
  box.appendChild(
    h(
      'p',
      { class: 'muted' },
      `${playerBand(s).name} prize money: win ${money(pz.win)}, tie ${money(pz.tie)} (home or away). Make the playoffs ${money(pz.semifinal)}, runner-up ${money(pz.runnerUp)}, champions ${money(pz.champion)}.`,
    ),
  );
  showEst();
  return box;
}
/** The field app: home field, upgrades, prices and staff. */
export function fieldTab(game, root, redraw) {
  const s = game.state;
  const fields = h(
    'div',
    { class: 'box' },
    h('h3', {}, '🏟️ Home field'),
    h(
      'p',
      { class: 'muted' },
      "Where you play home games. Bigger fields cost rent, but fans pay more per ticket, more of them fit, nobody takes a cut, and you can build bigger seating, snack stands and training gear. The estimate is for your team right now, at each field's fair ticket price.",
    ),
  );
  const row = (label, fn) =>
    h(
      'tr',
      {},
      h('th', { style: { textAlign: 'left' } }, label),
      ...Object.keys(FIELDS).map((id) => h('td', { class: s.team.field === id ? 'cur-field' : '' }, fn(id))),
    );
  const pv = Object.fromEntries(Object.keys(FIELDS).map((id) => [id, fieldPreview(s, id)]));
  const bestNet = Math.max(...Object.values(pv).map((p) => p.est.net));
  const how = (id) => {
    const fd = FIELDS[id];
    if (s.team.field === id) return h('span', { class: 'pill good' }, 'Current');
    const use = btn(
      'Move here',
      () => {
        const r = setField(s, id);
        toast(r.ok ? `Home games are now at ${fd.name}.` : r.reason, r.ok ? 'good' : 'bad');
        redraw();
      },
      'small green',
    );
    if (pv[id].unlocked) return use;
    if (fd.needs === 'champion')
      return h(
        'div',
        { class: 'muted', style: { fontSize: '12px' } },
        '🔒 Win a league championship. The city only rents its stadium to champions.',
      );
    return h(
      'div',
      { class: 'muted', style: { fontSize: '12px' } },
      fd.needs === 'principal'
        ? '🔒 Ask Principal Plunkett at school (needs a B average and no recent trouble).'
        : '🔒 Buy a $15 city permit at the Library league desk.',
    );
  };
  fields.appendChild(
    h(
      'table',
      { class: 'list field-compare' },
      h(
        'tr',
        {},
        h('th', {}, ''),
        ...Object.entries(FIELDS).map(([id, fd]) =>
          h('th', { class: s.team.field === id ? 'cur-field' : '' }, fd.name),
        ),
      ),
      row('Cost per home game', (id) => (pv[id].rent ? `${money(pv[id].rent)} rent` : 'Free')),
      row("Mom & Dad's cut", (id) =>
        pv[id].parentCut ? `${Math.round(pv[id].parentCut * 100)}% of everything` : 'None',
      ),
      row('Fair ticket price', (id) => money(pv[id].fairTicket)),
      row('Seats (yours now / most)', (id) => `${pv[id].seats} / ${pv[id].maxSeats}`),
      row('Biggest seating', (id) => pv[id].seatingMax),
      row('Biggest snack stand', (id) => pv[id].concessionsMax),
      row('Best training gear', (id) => pv[id].trainingMax),
      row('Facility score bonus', (id) =>
        pv[id].facilityBonus ? `+${pv[id].facilityBonus} (draws fans & recruits)` : '+0',
      ),
      row('Your take per home game', (id) =>
        h(
          'b',
          { style: { color: pv[id].est.net === bestNet ? '#2d6a4f' : pv[id].est.net < 0 ? '#e63946' : '' } },
          `${money(pv[id].est.net)}${pv[id].est.net === bestNet ? ' ★' : ''}`,
        ),
      ),
      row('', how),
    ),
  );
  fields.appendChild(
    h(
      'p',
      { class: 'muted' },
      `Facility score: ${facilityScore(s)}/100. Upgrades come with you if you move fields, but small fields can't use the fancy stuff.`,
    ),
  );

  const ups = h(
    'div',
    { class: 'box' },
    h('h3', {}, '🔧 Upgrades (order online)'),
    h('p', {}, `You have ${money(s.money)}`),
  );
  for (const [cat, u] of Object.entries(UPGRADES)) {
    const tier = s.team.upgrades[cat];
    const cap = upgradeCap(s, cat);
    const next = tier + 1;
    const max = u.costs.length - 1;
    ups.appendChild(
      h(
        'div',
        {
          class: 'row',
          style: { margin: '6px 0', borderBottom: '1px dashed #d9c7a8', paddingBottom: '6px' },
        },
        h(
          'div',
          { style: { flex: 1 } },
          h('b', {}, u.label),
          h('div', {}, `${'★'.repeat(tier)}${'☆'.repeat(max - tier)} ${upgradeName(s, cat, tier)}`),
          next <= max
            ? h(
                'div',
                { class: 'muted' },
                `Next: ${upgradeName(s, cat, next)}${next > cap ? ' (needs a bigger field)' : ''}`,
              )
            : h('div', { class: 'muted' }, 'Maxed out!'),
          cat === 'uniforms'
            ? h(
                'div',
                { class: 'jersey-pair' },
                h(
                  'div',
                  {},
                  h('div', { class: 'muted' }, 'Now'),
                  h('div', {
                    class: 'jersey-box small',
                    html: jerseyPreview(s.team.colors, tier, { name: s.player.name, team: s.team.name }),
                  }),
                ),
                next <= max
                  ? h(
                      'div',
                      {},
                      h('div', { class: 'muted' }, 'Next'),
                      h('div', {
                        class: 'jersey-box small',
                        html: jerseyPreview(s.team.colors, next, { name: s.player.name, team: s.team.name }),
                      }),
                    )
                  : null,
              )
            : null,
        ),
        next <= max
          ? btn(
              money(u.costs[next]),
              () => {
                const r = buyUpgrade(s, cat);
                sfx(r.ok ? 'good' : 'bad');
                toast(r.ok ? `Upgraded: ${r.name}!` : r.reason, r.ok ? 'good' : 'bad');
                if (r.ok && s.loc === 'home') {
                  const p = game.engine.playerState;
                  game.enter('home', { x: p.x, z: p.z, rot: p.rot });
                }
                redraw();
              },
              'small green',
              next > cap || s.money < u.costs[next] ? { disabled: true } : {},
            )
          : null,
      ),
    );
  }

  const gear = h(
    'div',
    { class: 'box' },
    h('h3', {}, '🎒 Team Gear'),
    h(
      'p',
      { class: 'muted' },
      'Equipment for the whole roster. Boosts count in every game for every kid on your roster.',
    ),
  );
  for (const [cat, g] of Object.entries(GEAR)) {
    const tier = (s.team.gear || {})[cat] || 0;
    const max = g.costs.length - 1;
    const next = tier + 1;
    gear.appendChild(
      h(
        'div',
        {
          class: 'row',
          style: { margin: '6px 0', borderBottom: '1px dashed #d9c7a8', paddingBottom: '6px' },
        },
        h(
          'div',
          { style: { flex: 1 } },
          h('b', {}, `${g.icon} ${g.label}`),
          h(
            'div',
            {},
            `${'★'.repeat(tier)}${'☆'.repeat(max - tier)} ${gearName(s, cat, tier)}`,
            tier ? h('span', { class: 'pill good' }, gearBoostText(s, cat, tier)) : null,
          ),
          next <= max
            ? h('div', { class: 'muted' }, `Next: ${gearName(s, cat, next)} (${gearBoostText(s, cat, next)})`)
            : h('div', { class: 'muted' }, 'Top of the line!'),
        ),
        next <= max
          ? btn(
              money(g.costs[next]),
              () => {
                const r = buyGear(s, cat);
                sfx(r.ok ? 'good' : 'bad');
                toast(r.ok ? `New gear: ${r.name}! (${r.boost})` : r.reason, r.ok ? 'good' : 'bad');
                redraw();
              },
              'small green',
              s.money < g.costs[next] ? { disabled: true } : {},
            )
          : null,
      ),
    );
  }
  const staff = h(
    'div',
    { class: 'box' },
    h('h3', {}, '👔 Staff'),
    h(
      'p',
      { class: 'muted' },
      'Hire kids who like you (talk to them: "Job offer"). Grown-ups like Coach Dave (mall) and Mrs. Pham (library) cost more but are better.',
    ),
  );
  for (const [role, r] of Object.entries(STAFF_ROLES)) {
    const who = s.team.staff[role];
    const name = who
      ? who.startsWith('kid:')
        ? shortName(KID_BY_ID.get(who.slice(4)))
        : ADULTS[who.slice(6)].name
      : 'Nobody';
    staff.appendChild(
      h(
        'div',
        { class: 'row', style: { margin: '6px 0' } },
        h(
          'div',
          { style: { flex: 1 } },
          h('b', {}, r.name),
          ': ',
          name,
          h('div', { class: 'muted' }, r.effect),
        ),
        who
          ? btn(
              'Let go',
              () => {
                delete s.team.staff[role];
                toast(`${name} is no longer your ${r.name.toLowerCase()}.`);
                redraw();
              },
              'small red',
            )
          : null,
      ),
    );
  }
  root.append(
    h(
      'div',
      { class: 'grid2' },
      h(
        'div',
        {},
        pricesBox(s),
        h('div', { style: { height: '10px' } }),
        fields,
        h('div', { style: { height: '10px' } }),
        gear,
        h('div', { style: { height: '10px' } }),
        staff,
      ),
      ups,
    ),
  );
}
