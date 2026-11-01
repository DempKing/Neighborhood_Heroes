// Settings app.
import { kidName } from '../../data/kids.js';
import { saveToStorage, serialize } from '../../game/state.js';
import { getMusicVolume, getVolume, setMusicVolume, setVolume, sfx } from '../audio.js';
import { btn, h } from '../dom.js';
import { setTouchPref, touchPref } from '../input.js';
import { knowledgeBox } from './social.js';

// Settings
export function settingsTab(game, root, redraw, close) {
  const s = game.state;
  const speed = h(
    'div',
    { class: 'chips' },
    ...[
      ['slow', 'Relaxed'],
      ['normal', 'Normal'],
      ['fast', 'Speedy'],
    ].map(([id, l]) =>
      h(
        'div',
        {
          class: `chip ${game.settings.speed === id ? 'sel' : ''}`,
          onclick: () => {
            game.settings.speed = id;
            try {
              localStorage.setItem('bl-settings', JSON.stringify(game.settings));
            } catch {
              /* optional */
            }
            redraw();
          },
        },
        l,
      ),
    ),
  );
  const eng = game.engine;
  const gfx = h(
    'div',
    { class: 'chips' },
    ...[
      ['low', 'Performance'],
      ['medium', 'Balanced'],
      ['high', 'Ultra'],
    ].map(([id, l]) =>
      h(
        'div',
        {
          class: `chip ${eng.quality === id ? 'sel' : ''}`,
          onclick: () => {
            eng.setQuality(id, true);
            try {
              localStorage.setItem('bl-quality-locked', '1');
            } catch {
              /* optional */
            }
            redraw();
          },
        },
        l,
      ),
    ),
  );
  const vol = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: getVolume() });
  vol.addEventListener('input', () => {
    setVolume(+vol.value);
    sfx('pop');
  });
  const mus = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: getMusicVolume() });
  mus.addEventListener('input', () => setMusicVolume(+mus.value));
  root.append(
    h(
      'div',
      { class: 'grid2' },
      h(
        'div',
        { class: 'box' },
        h('h3', {}, 'Game'),
        h('div', { class: 'field-row' }, h('label', {}, 'Clock speed'), speed),
        h('div', { class: 'field-row' }, h('label', {}, 'Sound effects'), vol),
        h('div', { class: 'field-row' }, h('label', {}, 'Music'), mus),
        h(
          'div',
          { class: 'field-row' },
          h('label', {}, 'Graphics'),
          gfx,
          h(
            'div',
            { class: 'muted', style: { marginTop: '6px' } },
            'Ultra adds ambient occlusion, bloom and 4K shadows. The game picks a level for your PC automatically until you choose one.',
          ),
        ),
        h(
          'div',
          { class: 'btn-row' },
          btn('💾 Save now', () => game.save(), 'green'),
          btn(
            '⬇️ Export save file',
            () => {
              const blob = new Blob([serialize(s)], { type: 'application/json' });
              const a = h('a', {
                href: URL.createObjectURL(blob),
                download: `neighborhood-heroes-${s.team.name.replace(/\W+/g, '-')}.json`,
              });
              document.body.appendChild(a);
              a.click();
              a.remove();
            },
            'white',
          ),
          btn(
            '🚪 Save & quit to title',
            () => {
              saveToStorage(s);
              close();
              game.onQuit();
            },
            'red',
          ),
        ),
      ),
      knowledgeBox(game, redraw),
      h(
        'div',
        { class: 'box' },
        h('h3', {}, 'Controls'),
        h('b', {}, '⌨️ Keyboard & mouse'),
        h(
          'div',
          {},
          'WASD / Arrows or click / tap the ground: walk (Shift = run) · Click a kid or a spot to walk over and use it · E / Space: talk & interact · M: map · Tab: phone · I: backpack · Z: wait · Esc: close',
        ),
        h('div', {}, 'Drag: look around · Wheel: zoom · Q/R: rotate camera'),
        h('b', { style: { display: 'block', marginTop: '8px' } }, '🎮 Controller'),
        h(
          'div',
          {},
          'Left stick: walk (RT to run) · Right stick: camera · A: talk / select · B: back · X: clutch · Y: map · Start: phone · LB/RB: turn camera, switch tabs, throw papers',
        ),
        h('div', {}, 'In menus the d-pad or left stick moves the highlight and A presses it.'),
        h('b', { style: { display: 'block', marginTop: '8px' } }, '👆 Touch'),
        h(
          'div',
          {},
          'Drag the left side to walk (push to the edge to run) · Tap ✋ to talk · Drag the right side to look · Pinch to zoom',
        ),
        h(
          'div',
          { class: 'field-row', style: { marginTop: '6px' } },
          h('label', {}, 'On-screen touch controls'),
          h(
            'div',
            { class: 'chips' },
            ...[
              ['auto', 'Auto'],
              ['on', 'Always on'],
              ['off', 'Off'],
            ].map(([id, l]) =>
              h(
                'div',
                {
                  class: `chip ${touchPref() === id ? 'sel' : ''}`,
                  onclick: () => {
                    setTouchPref(id);
                    redraw();
                  },
                },
                l,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
export { kidName };
