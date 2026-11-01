// The title screen, save slots and loading a game.
import { SPORTS } from '../../data/world.js';
import { knowledgeOn, knowledgeSummary, setKnowledgeOn } from '../../game/knowledge.js';
import {
  deleteSlot,
  deserialize,
  freeSlot,
  listSlots,
  loadFromStorage,
  playerGrade,
  saveToStorage,
  yearOf,
} from '../../game/state.js';
import { dayInfo, formatTime } from '../../game/time.js';
import { buildVenue } from '../../world2d/scenes.js';
import { sfx } from '../audio.js';
import { $, btn, clear, h, modal } from '../dom.js';
import { buildLogo } from '../logo.js';

// The title screen is just the word art on a painted sunburst sky (CSS), so
// the game world isn't drawn behind it.
export function titleBackdrop(engine) {
  stopTitleBackdrop();
  engine.clearNPCs();
  engine.world = null; // nothing to render behind the title
}
export function stopTitleBackdrop() {}
/** Show a sport's backyard venue (debug / screenshots). */
export function showcaseArena(engine, sport = 'soccer') {
  const desc = buildVenue(
    sport,
    {
      goals: 1,
      lines: 1,
      flags: 1,
      benches: 1,
      seating: 0,
      scoreboard: 0,
      announcer: 0,
      concessions: 0,
      uniforms: 1,
      training: 0,
    },
    ['#e63946', '#ffffff'],
    'BACKYARD',
  );
  engine.loadWorld(desc, desc.spawn);
  if (engine.player) engine.player.root.visible = false;
  const f = desc.fieldInfo;
  engine.cinematic({ x: f.cx, z: f.cz }, Math.max(f.L, f.W) * 0.55, {});
  return desc;
}
/**
 * Title screen. Continue = the most recently played save; Load Game = pick any of the four
 * slots (or import a file); New Game = start fresh in a free slot (or replace one).
 * onNew(slot) starts the creator for that slot; onContinue(state) starts a loaded game.
 */
export function showTitle(engine, onNew, onContinue, current = null) {
  titleBackdrop(engine);
  const ov = $('#overlay');
  clear(ov);
  ov.classList.add('show');
  // The newest save on disk, or the game you just quit (if storage is blocked).
  const saved = loadFromStorage() || current;
  const go = (st) => {
    stopTitleBackdrop();
    onContinue(st);
  };
  const slots = listSlots();
  const any = slots.some((x) => x.state);
  const newGame = () => {
    const free = freeSlot();
    if (free >= 0) {
      stopTitleBackdrop();
      onNew(free);
      return;
    }
    slotPicker(
      'All four save slots are full',
      'Pick a save to replace with your new game.',
      'Replace',
      (i) => {
        stopTitleBackdrop();
        onNew(i);
      },
      () => showTitle(engine, onNew, onContinue, current),
    );
  };
  ov.appendChild(
    h(
      'div',
      { class: 'screen title-screen' },
      h(
        'div',
        { class: 'title-sky' },
        h('div', { class: 'title-rays' }),
        h('div', { class: 'title-cloud c1' }),
        h('div', { class: 'title-cloud c2' }),
        h('div', { class: 'title-cloud c3' }),
        h('div', { class: 'title-hill' }),
      ),
      h(
        'div',
        { class: 'title-wrap' },
        buildLogo(),
        h(
          'div',
          { class: 'title-buttons' },
          saved
            ? btn(
                h(
                  'span',
                  { class: 'cont' },
                  'Continue',
                  h(
                    'small',
                    {},
                    `${saved.player?.name || 'Rookie'} · ${saved.team.name} · Day ${saved.time.day}`,
                  ),
                ),
                () => go(saved),
                'big green',
              )
            : null,
          btn('New Game', newGame, saved ? 'big white' : 'big'),
          btn('Load Game', () => loadScreen(engine, onNew, onContinue, current), any ? 'big white' : 'white'),
        ),
      ),
    ),
  );
}
/** One line describing a save slot. */
function slotSummary(st) {
  const info = dayInfo(st.time.day);
  const sp = SPORTS[st.team.sport];
  const ago = st.savedAt ? timeAgo(st.savedAt) : 'a while ago';
  return [
    h('b', {}, `${st.player?.name || 'Rookie'} · ${sp ? sp.icon : ''} ${st.team.name}`),
    h(
      'div',
      { class: 'muted' },
      `Year ${yearOf(st)} · ${info.dateLabel} ${formatTime(st.time.minute)} · Grade ${playerGrade(st)}`,
    ),
    h(
      'div',
      { class: 'muted' },
      `$${(+st.money).toFixed(2)} · ${st.team.roster.length} on the team · last played ${ago}`,
    ),
  ];
}
/** "5 minutes ago" style text for a time. */
function timeAgo(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const hr = Math.round(m / 60);
  if (hr < 24) return `${hr} hr ago`;
  return new Date(t).toLocaleDateString();
}
/** Load Game: every slot, with Load / Delete, plus importing a save file. */
function loadScreen(engine, onNew, onContinue, current) {
  const ov = $('#overlay');
  clear(ov);
  const back = () => showTitle(engine, onNew, onContinue, current);
  const fileInput = h('input', {
    type: 'file',
    accept: '.json,application/json',
    style: { display: 'none' },
  });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    if (!f) return;
    let st;
    try {
      st = deserialize(await f.text());
    } catch (e) {
      modal({ title: 'Oops', body: `That file isn't a Neighborhood Heroes save. (${e.message})` });
      return;
    }
    slotPicker(
      'Import save file',
      `Put ${st.player?.name || 'this save'}'s game (${st.team.name}) in which slot?`,
      'Put it here',
      (i) => {
        st.slot = i;
        saveToStorage(st);
        stopTitleBackdrop();
        onContinue(st);
      },
      () => loadScreen(engine, onNew, onContinue, current),
    );
  });
  const list = h('div', { class: 'slot-list' });
  for (const { slot, state } of listSlots()) {
    list.appendChild(
      h(
        'div',
        { class: `slot-card ${state ? '' : 'empty'}` },
        h('div', { class: 'slot-num' }, `${slot + 1}`),
        h(
          'div',
          { class: 'slot-info' },
          ...(state
            ? slotSummary(state)
            : [h('b', {}, 'Empty slot'), h('div', { class: 'muted' }, 'Start a new game here.')]),
        ),
        h(
          'div',
          { class: 'btn-row' },
          state
            ? btn(
                'Load',
                () => {
                  stopTitleBackdrop();
                  onContinue(state);
                },
                'green',
              )
            : btn(
                'New game here',
                () => {
                  stopTitleBackdrop();
                  onNew(slot);
                },
                'white',
              ),
          state
            ? btn(
                '🗑',
                () =>
                  modal({
                    title: `Delete slot ${slot + 1}?`,
                    body: `${state.player?.name || 'This'}'s game with the ${state.team.name} will be gone for good.`,
                    buttons: [
                      {
                        label: 'Delete it',
                        cls: 'red',
                        onClick: () => {
                          deleteSlot(slot);
                          loadScreen(engine, onNew, onContinue, current);
                        },
                      },
                      { label: 'Keep it', cls: 'white' },
                    ],
                  }),
                'white',
                { title: 'Delete this save' },
              )
            : null,
        ),
      ),
    );
  }
  ov.appendChild(
    h(
      'div',
      { class: 'screen title-screen slot-screen' },
      h(
        'div',
        { class: 'card slot-panel' },
        h('h2', {}, '📂 Load Game'),
        list,
        h(
          'div',
          { class: 'btn-row' },
          btn('⬆️ Import save file…', () => fileInput.click(), 'white'),
          btn('← Back', back, 'white'),
          fileInput,
        ),
      ),
    ),
  );
}
/** Choose a slot for something (new game when full, or an imported file). Filled slots ask first. */
function slotPicker(title, text, verb, onPick, onBack) {
  const ov = $('#overlay');
  clear(ov);
  const list = h('div', { class: 'slot-list' });
  for (const { slot, state } of listSlots()) {
    const pickIt = () =>
      state
        ? modal({
            title: `Replace slot ${slot + 1}?`,
            body: `${state.player?.name || 'That'}'s game with the ${state.team.name} will be overwritten.`,
            buttons: [
              { label: 'Replace it', cls: 'red', onClick: () => onPick(slot) },
              { label: 'Cancel', cls: 'white' },
            ],
          })
        : onPick(slot);
    list.appendChild(
      h(
        'div',
        { class: `slot-card ${state ? '' : 'empty'}` },
        h('div', { class: 'slot-num' }, `${slot + 1}`),
        h('div', { class: 'slot-info' }, ...(state ? slotSummary(state) : [h('b', {}, 'Empty slot')])),
        h('div', { class: 'btn-row' }, btn(state ? verb : 'Use this slot', pickIt, state ? 'red' : 'green')),
      ),
    );
  }
  ov.appendChild(
    h(
      'div',
      { class: 'screen title-screen slot-screen' },
      h(
        'div',
        { class: 'card slot-panel' },
        h('h2', {}, title),
        h('p', { class: 'muted' }, text),
        list,
        h('div', { class: 'btn-row' }, btn('← Back', onBack, 'white')),
      ),
    ),
  );
}
/**
 * New game: carry what you knew about the kids from one of your saved runs?
 * The new run takes over (overwrites) that save. Sets cfg.legacySlot.
 */
export function knowledgeRow(cfg) {
  const saves = listSlots()
    .filter((x) => x.state)
    .map((x) => ({ ...x, sum: knowledgeSummary(x.state) }))
    .sort((a, b) => (b.state.savedAt || 0) - (a.state.savedAt || 0));
  const box = h('div', {});
  const draw = () => {
    clear(box);
    const on = knowledgeOn();
    if (!on || !saves.length) cfg.legacySlot = null;
    else if (cfg.legacySlot == null || !saves.some((x) => x.slot === cfg.legacySlot))
      cfg.legacySlot = (saves.find((x) => x.sum.kids) || saves[0]).slot;
    box.append(
      h(
        'label',
        { class: 'switch-row' },
        h('input', {
          type: 'checkbox',
          checked: on,
          onchange: (e) => {
            setKnowledgeOn(e.target.checked);
            sfx('click');
            draw();
          },
        }),
        h('span', { class: 'switch' }),
        h('b', {}, '🧠 Remember the kids from a past run'),
      ),
    );
    if (!on) {
      box.append(h('div', { class: 'muted' }, "Starting fresh: you won't know anybody."));
      return;
    }
    if (!saves.length) {
      box.append(
        h(
          'div',
          { class: 'muted' },
          'No saved runs yet. Next time, you can carry over everything you learned about the kids.',
        ),
      );
      return;
    }
    box.append(
      h(
        'div',
        { class: 'muted' },
        "Pick the run to remember. Your new game REPLACES that save. You'll know every kid you knew there (names, stats, routines, likes), but they won't remember you.",
      ),
      h(
        'div',
        { class: 'legacy-list' },
        ...saves.map(({ slot, state, sum }) =>
          h(
            'div',
            {
              class: `legacy-card ${cfg.legacySlot === slot ? 'sel' : ''}`,
              onclick: () => {
                cfg.legacySlot = slot;
                sfx('click');
                draw();
              },
            },
            h('b', {}, `Slot ${slot + 1}: ${state.player?.name || 'Rookie'} · ${state.team.name}`),
            h('div', { class: 'muted' }, `Grade ${playerGrade(state)}, day ${state.time.day}`),
            h(
              'div',
              {},
              sum.kids
                ? `🧠 ${sum.named} names · ${sum.stats} stats (${sum.exact} exact) · ${sum.routines} routine spots`
                : 'Knew nobody yet',
            ),
            cfg.legacySlot === slot
              ? h('div', { class: 'legacy-warn' }, '⚠️ This save will be overwritten')
              : null,
          ),
        ),
      ),
    );
  };
  draw();
  return h('div', { class: 'field-row' }, h('label', {}, 'Past runs'), box);
}
