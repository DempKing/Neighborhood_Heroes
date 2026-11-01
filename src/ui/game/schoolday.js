// The school day: bells, periods, dismissal, hall patrols and after-school hangouts.
import { KID_BY_ID } from '../../data/kids.js';
import { roomNumber } from '../../data/world.js';
import { applyPunishment, playerClass } from '../../game/school.js';
import { doHangout, missHangout } from '../../game/social.js';
import { dayInfo, nextClassBlock, schoolBlockAt } from '../../game/time.js';
import { sfx } from '../audio.js';
import { exitClass } from '../classroom.js';
import { $, ask, modal, modalOpen, toast } from '../dom.js';
import { PASS_SPM } from '../game.js';

/** A friend you planned to hang out with is ready (after school). */
export function checkHangouts(game) {
  const s = game.state;
  if (!s.hangouts || !s.hangouts.length) return;
  s.hangouts = s.hangouts.filter((x) => x.day >= s.time.day); // yesterday's plans are gone
  const due = s.hangouts.find((x) => x.day === s.time.day && s.time.minute >= x.at);
  if (!due || game.mode !== 'free' || modalOpen() || game.talking || $('#overlay').classList.contains('show'))
    return;
  const kid = KID_BY_ID.get(due.id);
  sfx('good');
  modal({
    title: `🛹 ${kid.first_name} wants to hang out!`,
    body: `You told ${kid.first_name} you'd hang out after school. Ready?`,
    dismissable: false,
    buttons: [
      {
        label: 'Hang out (1 hr)',
        cls: 'green',
        onClick: () => {
          const r = doHangout(s, due.id);
          game.skip(60);
          toast(`+${r.gained} friendship with ${kid.first_name}`, 'good');
          modal({
            title: 'Good times',
            body: `${r.text}${r.revealedText ? `\n📒 You learned: ${r.revealedText}` : ''}`,
          });
        },
      },
      {
        label: 'Bail (-5 friendship)',
        cls: 'white',
        onClick: () => {
          missHangout(s, due.id);
          toast(`${kid.first_name} is bummed you bailed.`, 'bad');
        },
      },
    ],
  });
}
/** A school bell: start or end a period, recess or lunch. */
export function onBell(game, block) {
  const s = game.state;
  sfx('bell');
  const wasInClass =
    game.mode === 'class' ||
    (game.period && game.period.attended && s.loc === 'school' && game.inZone(game.period.room));
  const leftRoom = game.period && game.period.room;
  game.closePeriod();
  exitClass(game);
  game.passing = null;
  if (block.kind === 'class') {
    const c = playerClass(s, block.period);
    game.period = {
      block,
      room: c.room,
      subject: c.subject,
      teacher: c.teacher,
      attended: false,
      late: false,
    };
    if (s.loc === 'school' && game.inZone(c.room)) game.attend(false);
    else
      toast(
        `🔔 ${c.subject} is starting! Get to ${c.teacher}'s room (Room ${roomNumber(c.grade, c.subject)}).`,
        s.loc === 'school' ? '' : 'bad',
      );
  } else if (block.kind === 'pass') {
    const next = nextClassBlock(block.end);
    const c = playerClass(s, next.period);
    game.passing = { block, next: c, nextBlock: next };
    game.spm = PASS_SPM;
    game.acc = 0;
    if (s.loc === 'school') {
      // Class let out: you're in the hallway with a few minutes to get to the next room.
      const spot = wasInClass && leftRoom ? game.doorSpot(leftRoom) : null;
      if (spot) {
        game.engine.teleport(spot.x, spot.z, spot.rot ?? 0);
        game.engine.cam.pitch = 0.95;
        game.engine.cam.dist = 13;
      }
      toast(
        `🏃 Passing period! Get to ${c.subject} with ${c.teacher} (Room ${roomNumber(c.grade, c.subject)}) before the bell.`,
        'good',
      );
    }
  } else if (block.kind === 'recess') {
    const next = game.nextClassText(block.end);
    if (s.school.noRecessUntil && s.time.day <= s.school.noRecessUntil)
      toast('No recess for you today (you got in trouble). Sit tight.', 'bad');
    else if (s.loc === 'school') {
      // Head out to the playground, or stay in the hallway (walk into your next room early to skip ahead).
      const door = wasInClass && leftRoom ? game.doorSpot(leftRoom) : null;
      if (door) game.engine.teleport(door.x, door.z, door.rot ?? 0);
      ask(
        '🔔 Recess!',
        `Where do you want to spend recess?${next ? `\n\nNext class: ${next}. Walk in early to skip ahead to the bell.` : ''}`,
        [
          { label: '🌳 Outside (playground)', value: 'out', cls: 'green' },
          { label: '🚪 Stay in the hallway', value: 'hall', cls: 'white' },
        ],
      ).then((where) => {
        if (game.state.loc !== 'school' || where !== 'out') return;
        const z = game.desc.zones.playground;
        if (!z) return;
        game.engine.teleport(z.x - 2, z.z + z.d / 2 - 2, Math.PI);
        game.refreshPresence(true);
      });
    } else toast("RECESS! (You're not at school, though.)");
  } else if (block.kind === 'lunch') {
    const next = game.nextClassText(block.end);
    toast(`Lunch time! Head to the cafeteria.${next ? ` Next class: ${next}.` : ''}`, 'good');
    if (s.loc === 'school' && wasInClass && leftRoom) {
      const spot = game.doorSpot(leftRoom);
      if (spot) game.engine.teleport(spot.x, spot.z, spot.rot ?? 0);
    }
  }
  game.hud.render();
}
/**
 * A class is in session but we never heard its bell (you loaded a save, or
 * the game started mid-class): pick it up from the clock and the schedule.
 */
export function ensurePeriod(game) {
  const s = game.state;
  if (game.period || game.passing) return;
  if (!dayInfo(s.time.day).isSchoolDay) return;
  const block = schoolBlockAt(s.time.minute);
  if (!block || block.kind !== 'class') return;
  if (s.school.attended[`${s.time.day}:${block.start}`]) return; // already went to game class
  const c = playerClass(s, block.period);
  game.period = {
    block,
    room: c.room,
    subject: c.subject,
    teacher: c.teacher,
    attended: false,
    late: false,
  };
  game.hud.update();
}
/** End of the school day. */
export function onDismissal(game) {
  const s = game.state;
  // Where were you when the last bell rang? (Leave the classroom for the hallway.)
  const room = game.period && game.period.room;
  const inRoom = s.loc === 'school' && (game.mode === 'class' || (room && game.inZone(room)));
  game.passing = null;
  game.closePeriod();
  exitClass(game);
  if (inRoom && room) {
    const spot = game.doorSpot(room);
    if (spot) {
      game.engine.teleport(spot.x, spot.z, spot.rot ?? 0);
      game.engine.cam.pitch = 0.95;
      game.engine.cam.dist = 13;
    }
  }
  if (s.school.detentionDay === s.time.day) {
    if (s.loc === 'school') {
      modal({
        title: 'Detention',
        body: 'You spend an hour in detention copying "I will not goof around in class" 50 times. Your hand hurts.',
      });
      game.skip(60);
    } else {
      toast('You skipped detention! The school called your parents. Again.', 'bad');
    }
    s.school.detentionDay = 0;
  } else if (s.loc === 'school') {
    sfx('bell');
    modal({
      title: '🔔 The school day is over!',
      body: 'The final bell rang. The afternoon is yours: practice, jobs, hanging out with friends, or recruiting for your team.',
      buttons: [{ label: "Let's go!", cls: 'green' }],
    });
  } else toast("🔔 School's out! The afternoon is yours.", 'good');
  game.hud.render();
}
/** Hall monitors patrol during class. */
export function monitorPatrol(game) {
  const s = game.state;
  if (s.loc !== 'school') return;
  const mon = game.engine.npc('ADULT-monitor');
  if (!mon) return;
  const block = dayInfo(s.time.day).isSchoolDay ? schoolBlockAt(s.time.minute) : null;
  const patrolling = block && block.kind === 'class';
  if (mon.mode !== 'goto') {
    const tx = mon.char.root.position.x < 0 ? 40 : -40;
    game.engine.walkNPC('ADULT-monitor', tx, 0, 1.4);
  }
  if (!patrolling || game.mode !== 'free' || game.hallPassActive()) return;
  if (!game.inZone('hallway', -0.5)) return;
  const p = game.engine.playerState;
  const d = Math.hypot(mon.char.root.position.x - p.x, mon.char.root.position.z - p.z);
  const sight = 9 - s.player.sneak / 20;
  if (d < sight) caughtInHall(game);
}
/** Caught in the hall during class. */
export function caughtInHall(game) {
  const s = game.state;
  applyPunishment(s, 'office');
  sfx('whistle');
  game.mode = 'menu';
  modal({
    title: 'BUSTED by the Hall Monitor!',
    body: '"No pass? Wandering the halls during class? Principal\'s office. NOW."\n\nDetention tomorrow, a call home, and Mom & Dad ground you for 2 days.',
    dismissable: false,
    buttons: [
      {
        label: 'Walk of shame',
        cls: 'red',
        onClick: () => {
          game.mode = 'free';
          const p = game.period;
          if (p && p.block.kind === 'class') {
            const room = game.desc.zones[p.room];
            game.engine.teleport(room.x, room.z + 3, Math.PI);
            p.excusedLate = true;
          }
        },
      },
    ],
  });
}
