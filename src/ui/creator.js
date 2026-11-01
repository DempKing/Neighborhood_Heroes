// Title screen and character/team creator (with a live 3D preview).
import {
  NEIGHBORHOODS,
  PERKS,
  PLAYER_BASE_STAT,
  SPORTS,
  STAT_CODES,
  STAT_MAX,
  STAT_NAMES,
  STAT_POINTS,
} from '../data/world.js';
import { knowledgeOn } from '../game/knowledge.js';
import { listSlots } from '../game/state.js';
import { statRelevance } from '../game/stats.js';
import { Builder, EYES, HAIR, OUTFIT, SKIN } from '../world2d/build.js';
import { BOTTOMS, HAIR_STYLES, PANTS_COLORS, SHOE_COLORS, SHOE_TYPES, TOPS } from '../world2d/looks.js';
import * as THREE from '../world2d/three2d.js';
import { sfx } from './audio.js';
import { knowledgeRow } from './creator/title.js';
import { $, btn, clear, h, modal } from './dom.js';

const BUILDS = ['average', 'skinny', 'lanky', 'stocky', 'sturdy', 'round', 'wiry'];
const HATS = ['none', 'baseball cap', 'backwards cap', 'beanie', 'bucket hat'];
/** Accessories to choose from. */
const ACCESSORIES = [
  'none',
  'glasses',
  'sport goggles',
  'headphones',
  'sweatband',
  'freckles',
  'braces',
  'superhero cape',
  'giant backpack',
  'light-up sneakers',
  'missing front tooth',
  'dinosaur hoodie',
  'friendship bracelets',
];
/** Team color pairs to choose from. */
const TEAM_COLORS = [
  '#e63946',
  '#f4842a',
  '#f9d342',
  '#2fa35b',
  '#1fb5a8',
  '#3a86ff',
  '#24427a',
  '#8a5cd6',
  '#f27eb5',
  '#2b2b2f',
  '#ffffff',
  '#8b5a2b',
];
// Words for random team names (adjective + noun).
const ADJ = [
  'Backyard',
  'Sprinkler',
  'Cul-de-Sac',
  'Lawn Gnome',
  'Juice Box',
  'Mud Puddle',
  'Sidewalk',
  'Garage',
  'Treehouse',
  'Pizza Night',
  'Recess',
  'Lemonade',
  'Pillow Fort',
  'Snack Time',
];
const NOUN = [
  'Bandits',
  'Sharks',
  'Comets',
  'Legends',
  'Jaguars',
  'Mudcats',
  'Gorillas',
  'Tornadoes',
  'Panthers',
  'Rockets',
  'Raccoons',
  'Thunder',
  'Dragons',
  'Hornets',
];
export function randomTeamName() {
  return `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${NOUN[Math.floor(Math.random() * NOUN.length)]}`;
}
/** The character and team creator. Calls onDone with the new save. */
export function showCreator(engine, onDone, slot = null) {
  const look = {
    skin: 'tan',
    hairStyle: 'spiky',
    hairColor: 'brown',
    eyeColor: 'brown',
    build: 'average',
    accessories: [],
    shirt: 'red',
    top: 'tee',
    bottom: 'jeans',
    pants: 'denim',
    shoes: 'sneakers',
    shoeColor: 'white',
  };
  let hatPick = 'none';
  let sigPick = 'none';
  const syncAcc = () => {
    look.accessories = [hatPick, sigPick].filter((v) => v !== 'none');
  };
  const cfg = {
    legacySlot: slot,
    name: '',
    perk: 'none',
    statPoints: Object.fromEntries(STAT_CODES.map((c) => [c, 0])),
    hood: 'maple',
    sport: 'soccer',
    teamName: randomTeamName(),
    colors: ['#e63946', '#ffffff'],
  };

  // preview world: a little grass platform
  const group = new THREE.Group();
  const b = new Builder();
  b.box(40, 0.1, 40, '#7cc35b', 0, -0.1, 0, { mat: 'grass' });
  group.add(b.mesh());
  engine.loadWorld(
    { group, colliders: [], interact: [], zones: {}, spawn: { x: 0, z: 0, rot: 0 } },
    { x: 0, z: 0, rot: 0 },
  );
  engine.setTimeOfDay(13 * 60, false);
  const refresh = () => {
    engine.setPlayer({ id: 'PLAYER', ...look, perk: cfg.perk, heightIn: 50, grade: 3 });
    engine.player.root.visible = true;
  };
  refresh();
  engine.cinematic({ x: 0, z: 0 }, 3.3, { height: 1.2, spin: 0, angle: 0 }); // faces you; the player turns it
  engine.cine.look.y = 0.72;
  engine.cine.turnPlayer = true; // the turn buttons spin your kid (front / back)
  engine.setPreviewMode(true);

  const ov = $('#overlay');
  clear(ov);
  ov.classList.add('show');
  const swatchRow = (map, key, target = look) => {
    const row = h('div', { class: 'swatches' });
    for (const [name, color] of Object.entries(map)) {
      const s = h('div', {
        class: `swatch ${target[key] === name ? 'sel' : ''}`,
        title: name,
        style: { background: color },
        onclick: () => {
          target[key] = name;
          sfx('click');
          row.querySelectorAll('.swatch').forEach((x) => x.classList.remove('sel'));
          s.classList.add('sel');
          refresh();
        },
      });
      row.appendChild(s);
    }
    return row;
  };
  const chipRow = (list, get, set) => {
    const row = h('div', { class: 'chips' });
    for (const v of list) {
      const c = h(
        'div',
        {
          class: `chip ${get() === v ? 'sel' : ''}`,
          onclick: () => {
            set(v);
            sfx('click');
            row.querySelectorAll('.chip').forEach((x) => x.classList.remove('sel'));
            c.classList.add('sel');
            refresh();
          },
        },
        v,
      );
      row.appendChild(c);
    }
    return row;
  };
  const nameIn = h('input', { type: 'text', maxlength: 14, placeholder: 'Your name', value: '' });
  const teamIn = h('input', { type: 'text', maxlength: 26, value: cfg.teamName });
  const colorRow = (i) => {
    const row = h('div', { class: 'swatches' });
    for (const c of TEAM_COLORS) {
      const s = h('div', {
        class: `swatch ${cfg.colors[i] === c ? 'sel' : ''}`,
        style: { background: c },
        onclick: () => {
          cfg.colors[i] = c;
          row.querySelectorAll('.swatch').forEach((x) => x.classList.remove('sel'));
          s.classList.add('sel');
          sfx('click');
        },
      });
      row.appendChild(s);
    }
    return row;
  };
  const sportCards = h('div', { class: 'sport-cards' });
  for (const sp of Object.values(SPORTS)) {
    const c = h(
      'div',
      {
        class: `sport-card ${cfg.sport === sp.id ? 'sel' : ''}`,
        onclick: () => {
          cfg.sport = sp.id;
          sfx('click');
          drawStats(); // the highlighted stats follow the sport
          sportCards.querySelectorAll('.sport-card').forEach((x) => x.classList.remove('sel'));
          c.classList.add('sel');
        },
      },
      h('div', { class: 'icon' }, sp.icon),
      h('h4', {}, sp.name),
      h('p', {}, `Need ${sp.minRoster} kids. ${sp.blurb}`),
    );
    sportCards.appendChild(c);
  }
  const perkCards = h('div', { class: 'sport-cards' });
  for (const [id, p] of Object.entries(PERKS)) {
    const c = h(
      'div',
      {
        class: `sport-card ${cfg.perk === id ? 'sel' : ''}`,
        onclick: () => {
          cfg.perk = id;
          sfx('click');
          drawStats();
          refresh();
          perkCards.querySelectorAll('.sport-card').forEach((x) => x.classList.remove('sel'));
          c.classList.add('sel');
        },
      },
      h('h4', {}, p.name),
      h('p', {}, p.desc),
    );
    perkCards.appendChild(c);
  }
  // Skill points: spend STAT_POINTS across your own sports skills.
  const statBox = h('div', { class: 'stat-alloc' });
  const drawStats = () => {
    clear(statBox);
    const used = Object.values(cfg.statPoints).reduce((a, b) => a + b, 0);
    const left = STAT_POINTS - used;
    const gym = cfg.perk === 'gymrat' ? 5 : 0;
    statBox.append(
      h(
        'div',
        { class: 'stat-left' },
        h('b', {}, `${left}`),
        ` of ${STAT_POINTS} points left`,
        gym ? h('span', { class: 'muted' }, ' (Gym Rat: +5 to everything)') : null,
        btn(
          'Reset',
          () => {
            for (const c of STAT_CODES) cfg.statPoints[c] = 0;
            drawStats();
          },
          'small white',
        ),
      ),
    );
    const grid = h('div', { class: 'stat-grid' });
    for (const c of STAT_CODES) {
      const v = cfg.statPoints[c];
      const val = PLAYER_BASE_STAT + v + gym;
      const rel = statRelevance(cfg.sport, c);
      grid.append(
        h(
          'div',
          {
            class: `stat-row stat-${rel}`,
            title:
              rel === 'none'
                ? `Doesn't count in ${SPORTS[cfg.sport].name}`
                : `Counts in ${SPORTS[cfg.sport].name}`,
          },
          h('span', { class: 'stat-name' }, rel === 'key' ? `★ ${STAT_NAMES[c]}` : STAT_NAMES[c]),
          btn(
            '−',
            () => {
              if (cfg.statPoints[c] > 0) {
                cfg.statPoints[c]--;
                drawStats();
              }
            },
            'small white',
            v ? {} : { disabled: true },
          ),
          h('div', { class: 'bar' }, h('i', { style: { width: `${val}%` } })),
          h('b', { class: 'stat-val' }, `${val}`),
          btn(
            '+',
            () => {
              if (left > 0 && val < STAT_MAX) {
                cfg.statPoints[c]++;
                drawStats();
              }
            },
            'small white',
            left > 0 && val < STAT_MAX ? {} : { disabled: true },
          ),
        ),
      );
    }
    statBox.append(
      grid,
      h(
        'div',
        { class: 'muted stat-legend' },
        `★ = matters most in ${SPORTS[cfg.sport].name} · faded = doesn't count in ${SPORTS[cfg.sport].name} (it might in another sport later)`,
      ),
    );
  };
  drawStats();
  // Turn the preview: drag (mouse or touch) or the arrow buttons.
  const turn = (d) => {
    if (engine.cine) engine.cine.angle += d;
  };
  const turnBtn = (label, d, title) => btn(label, () => turn(d), 'small white', { title });
  const preview = h(
    'div',
    { class: 'creator-preview' },
    h(
      'div',
      { class: 'preview-controls' },
      turnBtn('⟲', -Math.PI / 4, 'Turn left'),
      h('span', { class: 'preview-hint' }, 'Drag to turn'),
      turnBtn('⟳', Math.PI / 4, 'Turn right'),
      btn(
        'Front',
        () => {
          if (engine.cine) engine.cine.angle = 0;
        },
        'small white',
        { title: 'Face front' },
      ),
    ),
  );
  let dragX = null;
  preview.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.btn')) return;
    dragX = e.clientX;
    preview.setPointerCapture(e.pointerId);
    preview.classList.add('dragging');
  });
  preview.addEventListener('pointermove', (e) => {
    if (dragX == null) return;
    turn(-(e.clientX - dragX) * 0.012);
    dragX = e.clientX;
  });
  const endDrag = () => {
    dragX = null;
    preview.classList.remove('dragging');
  };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);
  ov.appendChild(
    h(
      'div',
      { class: 'screen' },
      h(
        'div',
        { class: 'creator' },
        h(
          'div',
          { class: 'card' },
          h('h2', { style: { fontSize: '34px' } }, 'Make your kid'),
          h('p', { class: 'muted' }, "You're a 3rd grader with a big dream: your very own sports team."),
          h('div', { class: 'field-row' }, h('label', {}, 'Name'), nameIn),
          h('div', { class: 'field-row' }, h('label', {}, 'Skin'), swatchRow(SKIN, 'skin')),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Hair style'),
            chipRow(
              HAIR_STYLES,
              () => look.hairStyle,
              (v) => {
                look.hairStyle = v;
              },
            ),
          ),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Hair color'),
            swatchRow(
              Object.fromEntries(Object.entries(HAIR).filter(([k]) => !k.startsWith('dyed'))),
              'hairColor',
            ),
          ),
          h('div', { class: 'field-row' }, h('label', {}, 'Eyes'), swatchRow(EYES, 'eyeColor')),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Build'),
            chipRow(
              BUILDS,
              () => look.build,
              (v) => {
                look.build = v;
              },
            ),
          ),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Top'),
            chipRow(
              TOPS,
              () => look.top,
              (v) => {
                look.top = v;
              },
            ),
          ),
          h('div', { class: 'field-row' }, h('label', {}, 'Shirt color'), swatchRow(OUTFIT, 'shirt')),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Bottoms'),
            chipRow(
              BOTTOMS,
              () => look.bottom,
              (v) => {
                look.bottom = v;
              },
            ),
          ),
          h('div', { class: 'field-row' }, h('label', {}, 'Pants color'), swatchRow(PANTS_COLORS, 'pants')),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Shoes'),
            chipRow(
              SHOE_TYPES,
              () => look.shoes,
              (v) => {
                look.shoes = v;
              },
            ),
          ),
          h('div', { class: 'field-row' }, h('label', {}, 'Shoe color'), swatchRow(SHOE_COLORS, 'shoeColor')),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Hat'),
            chipRow(
              HATS,
              () => hatPick,
              (v) => {
                hatPick = v;
                syncAcc();
              },
            ),
          ),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Signature look'),
            chipRow(
              ACCESSORIES,
              () => sigPick,
              (v) => {
                sigPick = v;
                syncAcc();
              },
            ),
          ),
          h('div', { class: 'field-row' }, h('label', {}, 'Your trait'), perkCards),
          h('div', { class: 'field-row' }, h('label', {}, 'Your skills'), statBox),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Home neighborhood'),
            chipRow(
              NEIGHBORHOODS.filter((n) => n.id !== 'riverside').map((n) => n.name),
              () => NEIGHBORHOODS.find((n) => n.id === cfg.hood).name,
              (v) => {
                cfg.hood = NEIGHBORHOODS.find((n) => n.name === v).id;
              },
            ),
          ),
          h('hr'),
          h('h2', { style: { fontSize: '30px' } }, 'Your team'),
          h('div', { class: 'field-row' }, h('label', {}, 'First sport'), sportCards),
          h(
            'div',
            { class: 'field-row' },
            h('label', {}, 'Team name'),
            h(
              'div',
              { class: 'row' },
              teamIn,
              btn(
                'Random',
                () => {
                  teamIn.value = randomTeamName();
                },
                'small white',
              ),
            ),
          ),
          h('div', { class: 'field-row' }, h('label', {}, 'Main color'), colorRow(0)),
          h('div', { class: 'field-row' }, h('label', {}, 'Second color'), colorRow(1)),
          knowledgeRow(cfg),
          h(
            'div',
            { class: 'btn-row', style: { marginTop: '16px' } },
            btn(
              "Let's go!",
              () => {
                cfg.name = nameIn.value.trim() || 'Rookie';
                cfg.teamName = teamIn.value.trim() || randomTeamName();
                const go = () => {
                  engine.follow();
                  engine.setPreviewMode(false);
                  engine.setViewCenter(null);
                  onDone({ ...cfg, statPoints: { ...cfg.statPoints }, look: { ...look } });
                };
                const old =
                  knowledgeOn() && cfg.legacySlot != null ? listSlots()[cfg.legacySlot].state : null;
                if (!old) {
                  cfg.legacySlot = null;
                  go();
                  return;
                }
                modal({
                  title: `Replace slot ${cfg.legacySlot + 1}?`,
                  body: `${old.player?.name || 'That'}'s game with the ${old.team.name} will be overwritten by your new run. Everything you knew about the kids comes with you.`,
                  buttons: [
                    { label: 'Replace it and start', cls: 'red', onClick: go },
                    { label: 'Cancel', cls: 'white' },
                  ],
                });
              },
              'big green',
            ),
          ),
        ),
        preview,
      ),
    ),
  );
  const frame = () => {
    if (!preview.isConnected) {
      window.removeEventListener('resize', frame);
      return;
    }
    const r = preview.getBoundingClientRect();
    if (r.width) engine.setViewCenter(r.left + r.width / 2);
  };
  requestAnimationFrame(frame);
  window.addEventListener('resize', frame);
}

export { showcaseArena, showTitle, stopTitleBackdrop, titleBackdrop } from './creator/title.js';
