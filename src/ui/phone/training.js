// Training app: workouts and drills.
import { DRILLS, ITEMS, PLAYER_TRAIN_CAP, STAT_CODES, STAT_NAMES, UPGRADES } from '../../data/world.js';
import { statsOf } from '../../game/state.js';
import { letter } from '../../game/stats.js';
import {
  buyUpgrade,
  DELIVERY_FEE,
  orderDrillGear,
  practiceStats,
  soloWorkout,
  upgradeCap,
  upgradeName,
  WORKOUT_MINUTES,
  workoutCheck,
} from '../../game/team.js';
import { formatTime } from '../../game/time.js';
import { sfx } from '../audio.js';
import { btn, h, money, toast } from '../dom.js';
import { practiceTestRow } from './team.js';

// Training
export function trainingTab(game, root, redraw) {
  const s = game.state;
  // Training facility: makes practice count for more.
  const tier = s.team.upgrades.training;
  const U = UPGRADES.training;
  const next = tier + 1;
  const cap = upgradeCap(s, 'training');
  const fac = h(
    'div',
    { class: 'box' },
    h('h3', {}, '🏋️ Training facility'),
    h('p', {}, h('b', {}, upgradeName(s, 'training')), ` · practice gains ×${U.growth[tier]}`),
    next < U.costs.length
      ? next > cap
        ? h(
            'p',
            { class: 'muted' },
            `Next: ${upgradeName(s, 'training', next)} (×${U.growth[next]}). Your home field can't fit it; move to a bigger field.`,
          )
        : h(
            'div',
            { class: 'row' },
            h('span', {}, `Next: ${upgradeName(s, 'training', next)} (×${U.growth[next]})`),
            btn(
              `Buy ${money(U.costs[next])}`,
              () => {
                const r = buyUpgrade(s, 'training');
                toast(r.ok ? `Built: ${r.name}!` : r.reason, r.ok ? 'good' : 'bad');
                if (r.ok) sfx('coin');
                game.hud.render();
                redraw();
              },
              'small green',
              s.money < U.costs[next] ? { disabled: true } : {},
            ),
          )
      : h('p', { class: 'pill good' }, 'Top of the line!'),
    h('p', { class: 'muted' }, 'A better facility makes every practice improve your teammates faster.'),
  );
  // Drills: gear to unlock each one (tryout drills + practice focus).
  const list = h(
    'div',
    { class: 'box' },
    h('h3', {}, '🎯 Drills'),
    h(
      'p',
      { class: 'muted' },
      `Each drill tests a skill at tryouts and unlocks it as a practice focus. Order the gear here (store price + $${DELIVERY_FEE} delivery) or buy it in person at Sporting Goods.`,
    ),
  );
  const table = h(
    'table',
    { class: 'list' },
    h('tr', {}, h('th', {}, 'Drill'), h('th', {}, 'Skill'), h('th', {}, 'Gear'), h('th', {}, '')),
  );
  for (const d of DRILLS) {
    const missing = d.needs.filter((n) => !(s.inv.items[n] > 0));
    const gear = d.needs.length
      ? d.needs.map((n) =>
          h(
            'div',
            { class: s.inv.items[n] > 0 ? 'muted' : '' },
            `${ITEMS[n].icon} ${ITEMS[n].name}${s.inv.items[n] > 0 ? ' ✓' : ''}`,
          ),
        )
      : [h('span', { class: 'muted' }, 'Nothing needed')];
    let action;
    if (!missing.length) action = h('span', { class: 'pill good' }, 'Unlocked');
    else {
      action = h(
        'div',
        { class: 'btn-row' },
        ...missing.map((n) => {
          const it = ITEMS[n];
          if (!it.price)
            return h(
              'span',
              { class: 'muted', style: { fontSize: '12px' } },
              it.desc || 'Find it around town',
            );
          return btn(
            `${it.icon} ${money(it.price + DELIVERY_FEE)}`,
            () => {
              const r = orderDrillGear(s, n);
              sfx(r.ok ? 'coin' : 'bad');
              toast(
                r.ok
                  ? `Ordered ${r.name}! It's in your garage.${s.team.roster.length > 1 ? ' Teammates who missed this drill will run it at practice.' : ''}`
                  : r.reason,
                r.ok ? 'good' : 'bad',
              );
              game.hud.render();
              redraw();
            },
            'small green',
            s.money + 1e-9 < it.price + DELIVERY_FEE
              ? { disabled: true, title: it.name }
              : { title: it.name },
          );
        }),
      );
    }
    table.appendChild(
      h(
        'tr',
        {},
        h('td', {}, h('b', {}, d.name)),
        h('td', {}, d.stats.map((c) => STAT_NAMES[c]).join(', ')),
        h('td', {}, ...gear),
        h('td', {}, action),
      ),
    );
  }
  list.appendChild(table);
  const extra = h('div', { class: 'box', style: { marginTop: '10px' } }, h('h3', {}, '📡 Extras'));
  const lg = ITEMS.laser_gates;
  extra.appendChild(
    h(
      'div',
      { class: 'row' },
      h(
        'div',
        { style: { flex: 1 } },
        h('b', {}, `${lg.icon} ${lg.name}`),
        h('div', { class: 'muted' }, lg.desc),
      ),
      s.inv.items.laser_gates > 0
        ? h('span', { class: 'pill good' }, 'Owned')
        : btn(
            money(lg.price + DELIVERY_FEE),
            () => {
              const r = orderDrillGear(s, 'laser_gates');
              sfx(r.ok ? 'coin' : 'bad');
              toast(r.ok ? `Ordered ${r.name}!` : r.reason, r.ok ? 'good' : 'bad');
              game.hud.render();
              redraw();
            },
            'small green',
            s.money + 1e-9 < lg.price + DELIVERY_FEE ? { disabled: true } : {},
          ),
    ),
  );
  const testing = h(
    'div',
    { class: 'box', style: { marginTop: '10px' } },
    h('h3', {}, '🧪 Practice testing'),
    h(
      'p',
      { class: 'muted' },
      'Teammates who joined before you unlocked a drill can run it at practice, so you learn their grades without another tryout.',
    ),
    practiceTestRow(s, redraw),
  );
  root.append(
    h(
      'div',
      { class: 'grid2' },
      h(
        'div',
        {},
        workoutBox(game, redraw),
        h('div', { style: { height: '10px' } }),
        fac,
        h('div', { style: { height: '10px' } }),
        extra,
        testing,
      ),
      list,
    ),
  );
}
/** Train yourself: a solo workout once a day at home, plus whatever practice focuses on. */
function workoutBox(game, redraw) {
  const s = game.state;
  const stats = practiceStats(s);
  const tr = s.player.train || {};
  if (!stats.includes(s.player.workoutFocus)) s.player.workoutFocus = stats[0];
  const mine = statsOf(s, 'PLAYER', { raw: true });
  const sel = h(
    'select',
    {
      onchange: (e) => {
        s.player.workoutFocus = e.target.value;
        redraw();
      },
    },
    ...stats.map((c) =>
      h(
        'option',
        { value: c, selected: s.player.workoutFocus === c ? true : null },
        `${STAT_NAMES[c]} (${letter(mine[c])})`,
      ),
    ),
  );
  const chk = workoutCheck(s);
  const go = btn(
    `💪 Work out (${WORKOUT_MINUTES} min)`,
    () => {
      const r = soloWorkout(s, s.player.workoutFocus);
      if (!r.ok) {
        sfx('bad');
        toast(r.reason, 'bad');
        return;
      }
      game.skip(WORKOUT_MINUTES);
      sfx('good');
      toast(
        `Good sweat! ${STAT_NAMES[s.player.workoutFocus]} training +${r.gain}${r.after > r.before ? ` (now ${r.after})` : ''}. It's ${formatTime(s.time.minute)}.`,
        'good',
      );
      game.hud.render();
      redraw();
    },
    'small green',
    chk.ok ? {} : { disabled: true, title: chk.reason },
  );
  const trained = STAT_CODES.filter((c) => tr[c] > 0);
  return h(
    'div',
    { class: 'box' },
    h('h3', {}, '💪 Train yourself'),
    h(
      'p',
      { class: 'muted' },
      `Work out in your backyard once a day, and you improve at team practice too (in its focus skill). Training can add up to +${PLAYER_TRAIN_CAP} to each skill; a better training facility makes it count more.`,
    ),
    h('div', { class: 'row' }, 'Skill:', sel, go),
    !chk.ok ? h('p', { class: 'muted' }, chk.reason) : null,
    trained.length
      ? h(
          'p',
          {},
          h('b', {}, 'Your training so far: '),
          trained.map((c) => `${STAT_NAMES[c]} +${(+tr[c]).toFixed(1)}`).join(', '),
        )
      : null,
  );
}
