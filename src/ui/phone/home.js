// The phone itself: the app list, opening the phone, and the home screen.
import { KIDS } from '../../data/kids.js';
import { dayInfo, formatTime } from '../../game/time.js';
import { appGlyph, iconBackground } from '../appicons.js';
import { sfx } from '../audio.js';
import { $, clear, h, money } from '../dom.js';
import { openMap } from '../mapview.js';
import { APP_FNS } from './registry.js';

// Apps on the phone's home screen: [id, icon, label, color].
const APPS = [
  ['team', '🏟️', 'Team', '#e63946'],
  ['training', '🏋️', 'Training', '#f4a261'],
  ['league', '🏆', 'League', '#ffd23f'],
  ['field', '🔧', 'Field & Staff', '#8d99ae'],
  ['social', '💬', 'Social', '#8e6ce6'],
  ['contacts', '👥', 'Contacts', '#2a9d8f'],
  ['calls', '📞', 'Calls', '#57cc99'],
  ['maps', '🗺️', 'Maps', '#3a86ff'],
  ['school', '🏫', 'School', '#f28482'],
  ['bank', '🏦', 'Bank', '#2d6a4f'],
  ['backpack', '🎒', 'Backpack', '#b5651d'],
  ['diary', '📜', 'Diary', '#c8b48a'],
  ['settings', '⚙️', 'Settings', '#6c757d'],
];
const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a[0], a]));
// Pinned to the dock at the bottom of the home screen, like a real phone.
const DOCK = ['calls', 'social', 'settings'];
// Old tab names still open the right app.
const ALIASES = { kids: 'social', money: 'bank' };
/** Open the phone on its home screen, or straight into an app (I opens the backpack). */
export function openPhone(game, app = 'home') {
  const ov = $('#overlay');
  clear(ov);
  ov.classList.add('show');
  const prevMode = game.mode;
  game.mode = game.mode === 'class' ? 'class' : 'menu';
  const close = () => {
    clear(ov);
    ov.classList.remove('show');
    game.mode = prevMode === 'class' ? 'class' : 'free';
    game.overlayClose = null;
    game.hud.render();
    game.refreshPresence(true);
  };
  game.overlayClose = close;
  const s = game.state;
  const clock = h('span', { class: 'ps-time' });
  const status = h(
    'div',
    { class: 'phone-status' },
    clock,
    h('span', { class: 'ps-notch' }),
    h('span', { class: 'ps-icons' }, '📶 ', h('span', { class: 'ps-batt' }, h('i', {}))),
  );
  const screen = h('div', { class: 'phone-screen' });
  const dock = h('div', { class: 'phone-dock' });
  const homeBar = h('button', {
    class: 'phone-homebar',
    type: 'button',
    title: 'Home',
    'aria-label': 'Home',
    onclick: () => {
      sfx('click');
      show('home');
    },
  });
  const show = (id) => {
    id = ALIASES[id] || id;
    if (id === 'maps') {
      close();
      openMap(game);
      return;
    }
    app = id;
    clock.textContent = `${formatTime(s.time.minute).replace(' ', '')}`;
    clear(screen);
    clear(dock);
    screen.classList.toggle('home', id === 'home');
    const redraw = () => show(app);
    if (id === 'home') {
      homeScreen(game, screen, show);
      return;
    }
    const [, , label] = APP_BY_ID[id];
    const body = h('div', { class: 'phone-body' });
    screen.append(
      h(
        'div',
        { class: 'app-bar', style: { background: iconBackground(id) } },
        h(
          'button',
          {
            type: 'button',
            class: 'app-back',
            onclick: () => {
              sfx('click');
              show('home');
            },
          },
          '‹ Home',
        ),
        h('span', { class: 'ab-icon', style: { background: iconBackground(id) }, html: appGlyph(id) }),
        h('b', {}, label),
      ),
      body,
    );
    APP_FNS[id](game, body, redraw, close);
    // App switcher: swipe (LB/RB on a controller) or tap to jump between apps.
    for (const [aid, , alabel] of APPS) {
      dock.appendChild(
        h(
          'div',
          {
            class: `tab dock-app ${aid === id ? 'sel' : ''}`,
            'data-id': aid,
            title: alabel,
            onclick: () => {
              sfx('click');
              show(aid);
            },
          },
          h('span', { class: 'da-tile', style: { background: iconBackground(aid) }, html: appGlyph(aid) }),
          h('span', { class: 'sr-only' }, alabel),
        ),
      );
    }
  };
  ov.appendChild(h('div', { class: 'screen-bg', onclick: close }));
  ov.appendChild(
    h(
      'div',
      { class: 'screen' },
      h(
        'div',
        { class: 'phone-device' },
        h(
          'button',
          { type: 'button', class: 'phone-close', onclick: close, title: 'Put the phone away (Esc)' },
          '✕',
        ),
        status,
        screen,
        dock,
        homeBar,
      ),
    ),
  );
  show(app);
}
/** The phone's home screen. */
function homeScreen(game, root, show) {
  const s = game.state;
  const info = dayInfo(s.time.day);
  const met = KIDS.filter((k) => s.kids[k.id].met).length;
  const badge = {
    social: met ? null : 'new',
    contacts: null,
    team: s.team.invites.length ? s.team.invites.length : null,
    backpack: s.inv.trophies.filter((t) => t.slot == null).length || null,
  };
  root.append(
    h(
      'div',
      { class: 'home-clock' },
      h('div', { class: 'hc-time' }, formatTime(s.time.minute)),
      h('div', { class: 'hc-date' }, info.dateLabel),
      h('div', { class: 'hc-money' }, `🏦 ${money(s.money)}`),
    ),
    h(
      'div',
      { class: 'app-grid' },
      ...APPS.filter(([id]) => !DOCK.includes(id)).map(([id, , label]) => appIcon(id, label)),
    ),
    h('div', { class: 'home-dock' }, ...DOCK.map((id) => appIcon(id, APP_BY_ID[id][2], true))),
  );
  function appIcon(id, label, docked = false) {
    return h(
      'button',
      {
        type: 'button',
        class: `app-icon tab ${docked ? 'docked' : ''}`,
        'data-id': id,
        'aria-label': label,
        onclick: () => {
          sfx('click');
          show(id);
        },
      },
      h(
        'span',
        { class: 'ai-tile', style: { background: iconBackground(id) } },
        h('span', { class: 'ai-glyph-wrap', html: appGlyph(id) }),
        badge[id] ? h('span', { class: 'ai-badge' }, badge[id]) : null,
      ),
      docked ? null : h('span', { class: 'ai-label' }, label),
    );
  }
}
