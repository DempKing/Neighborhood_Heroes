// The game controller: owns the save state, the current location, the clock,
// kid presence/streaming, school periods, and routes interactions to UI modules.
import { KID_BY_ID, KIDS } from '../data/kids.js';
import { LOCATIONS, roomNumber, SPORTS } from '../data/world.js';
import { checkAchievements } from '../game/achievements.js';
import {
  advance,
  finishPractice,
  GAME_TIME,
  nextGameInfo,
  skipToNextGame,
  skipToNextYear,
  sleep,
} from '../game/clock.js';
import { collectPickup, mowJobs } from '../game/economy.js';
import { knowsName } from '../game/knowledge.js';
import { ensureSeason, playerGameThisWeek } from '../game/league.js';
import { crestCupToday, HILLTOP_TEAM, playerInCrestCup } from '../game/rivalry.js';
import { schoolLocFor, sectionOf, whereIsKid } from '../game/routines.js';
import { markAbsent, markTardy, playerClass, seatChart, teacherInfo } from '../game/school.js';
import { addLog, heightOf, playerGrade, saveToStorage, yearOf } from '../game/state.js';
import { practiceToday } from '../game/team.js';
import { dayInfo, formatTime, nextClassBlock } from '../game/time.js';
import { lookFromKid } from '../world2d/looks.js';
import * as THREE from '../world2d/three2d.js';
import { sfx } from './audio.js';
import { enterClass, exitClass, resumeClass } from './classroom.js';
import { $, ask, clear, closeTopModal, h, modal, modalOpen, toast } from './dom.js';
import { addAdults, addPickups, buildLocation, showArrival, specFor, tagFor } from './game/locations.js';
import { checkHangouts, ensurePeriod, monitorPatrol, onBell, onDismissal } from './game/schoolday.js';
import { Hud } from './hud.js';
import { openMap, travelMinutes } from './mapview.js';
import { startCrestCup, startMatchFlow } from './match.js';
import { hasSundayPaper, openNewspaper } from './newspaper.js';
import { openPhone } from './phone.js';
import { handleSpot } from './places.js';
import { maybeOpenSignup } from './signup.js';
import { openAdult, openTalk } from './talk.js';
import { startTryout } from './tryout.js';
import { openWait } from './wait.js';

export const SPEEDS = { slow: 2.0, normal: 1.25, fast: 0.7 };
// real seconds per game minute
export const PASS_SPM = 12;
// seconds of real time per game minute in the hallway

export function playerLook(state) {
  const g = playerGrade(state);
  return {
    id: 'PLAYER',
    ...state.player.look,
    perk: state.player.perk,
    heightIn: 50 + (g - 3) * 2.3,
    grade: g,
  };
}
export class Game {
  constructor(engine, state, opts = {}) {
    this.engine = engine;
    this.state = state;
    this.mode = 'free';
    this.acc = 0;
    this.desired = new Map();
    this.streamT = 0;
    this.period = null;
    this.hallPassUntil = 0;
    this.sneaking = false;
    this.settings = { speed: 'normal', ...(opts.settings || {}) };
    this.onQuit = opts.onQuit || (() => location.reload());
    this.hud = new Hud(this);
    engine.onInteract = (f) => this.interact(f);
    engine.onFocus = (f) => this.hud.prompt(f);
    engine.onTick = (dt) => this.tick(dt);
    this._keys = (e) => this.onKey(e);
    window.addEventListener('keydown', this._keys);
  }

  // Start
  start() {
    ensureSeason(this.state);
    clear($('#overlay')).classList.remove('show');
    this.engine.setPlayer(playerLook(this.state));
    this.enter(this.state.loc || 'home', this.state.loc === 'home' || !this.state.loc ? 'bed' : null);
    this.hud.render();
    if (!this.state.flags.introDone) this.intro();
  }

  /** The intro for a brand new game. */
  intro() {
    this.state.flags.introDone = true;
    const sp = SPORTS[this.state.team.sport];
    modal({
      title: `Welcome to Suncrest, ${this.state.player.name}!`,
      body:
        `It's the first day of 3rd grade, and you have a BIG plan: start your own ${sp.name.toLowerCase()} team, the ${this.state.team.name}!\n\n` +
        `To enter the Grade 3 League (every grade has its own league) you need ${sp.minRoster} players (you count!), team shirts, a field setup, and the $${sp.entryFee} entry fee. You have $${this.state.money.toFixed(2)}.\n\n` +
        `- Ask Mom & Dad for a little money (don't ask for too much!), recycle cans, find coins, run a lemonade stand.\n` +
        `- Meet kids everywhere: school, the mall, the library, the museum, the grocery store, the neighborhoods. Talk to them to learn their routines.\n` +
        `- Invite kids to a tryout. Sprints is your only drill right now, so you'll only learn their Speed.\n` +
        `- Keep your grades up, or Mom & Dad shut the whole thing down!\n\n` +
        'School starts at 8:00 AM. Better get moving!',
      buttons: [{ label: "Let's do this!", cls: 'green' }],
    });
  }

  /** Goes to a location (builds it and places the player). */
  enter(loc, spawnKey = null) {
    const s = this.state;
    if (this.activity) {
      const a = this.activity;
      this.activity = null;
      a.cancel();
    }
    exitClass(this);
    this.desc = buildLocation(this, loc);
    s.loc = loc;
    let spawn = this.desc.spawn;
    if (spawnKey === 'bed' && this.desc.spawnBed) spawn = this.desc.spawnBed;
    if (spawnKey === 'basement' && this.desc.spawnBasement) spawn = this.desc.spawnBasement;
    if (spawnKey === 'upstairs' && this.desc.spawnUpstairs) spawn = this.desc.spawnUpstairs;
    if (spawnKey && typeof spawnKey === 'object') spawn = spawnKey;
    this.engine.loadWorld(this.desc, spawn);
    this.engine.player.root.visible = true;
    this.engine.speedMult = 1;
    this.engine.playerState.override = null;
    this.engine.setTimeOfDay(s.time.minute, this.desc.indoor);
    addAdults(this);
    addPickups(this);
    this.addTaskMarkers();
    this.refreshPresence(true);
    this.hud.render();
    this.checkPeriodArrival();
    showArrival(this, loc);
    saveToStorage(s); // autosave on every trip
  }

  locName(loc = this.state.loc) {
    if (loc === 'school') return 'Suncrest Academy';
    return LOCATIONS[loc]?.name || loc;
  }

  // Presence
  practiceCtx() {
    const s = this.state;
    if (!practiceToday(s) || s.school.sportsBan) return null;
    return { ids: new Set(s.team.roster), start: s.team.practice.start, end: s.team.practice.end };
  }

  /** Updates which kids are here, from their routines and the time. */
  refreshPresence(force = false) {
    const s = this.state;
    if (!this.desc) return;
    if (['match', 'tryout', 'paper', 'mow', 'stand'].includes(this.mode) && !force) return;
    const ctx = { day: s.time.day, minute: s.time.minute, year: yearOf(s), practice: this.practiceCtx() };
    const mySchool = schoolLocFor(playerGrade(s));
    const desired = new Map();
    const roomFill = new Map();
    const homeroomZone = s.loc === 'school' ? playerClass(s).room : null;
    const chart = s.loc === 'school' ? seatChart(s) : null;
    const hidden = this.hiddenKids || new Set();
    for (const kid of KIDS) {
      if (hidden.has(kid.id)) continue;
      const w = whereIsKid(kid, ctx);
      if (!w) continue;
      let wl = w.loc;
      if (wl === mySchool) wl = 'school';
      else if (['school', 'middleschool', 'highschool'].includes(wl)) continue;
      if (wl !== s.loc) continue;
      desired.set(kid.id, specFor(this, kid, w, { roomFill, homeroomZone, chart }));
    }
    this.desired = desired;
    this.streamNPCs(true);
    this.lastPresence = s.time.minute;
  }

  /** Adds and removes NPCs to match who is here. */
  streamNPCs(force = false) {
    if (this.mode === 'tryout' || this.mode === 'match') return; // scripted scenes manage their own kids
    const e = this.engine;
    const px = e.playerState.x;
    const pz = e.playerState.z;
    let adds = 0;
    for (const [id, n] of e.npcs) {
      if (!id.startsWith('KID-')) continue;
      const want = this.desired.get(id);
      const far = Math.hypot(n.char.root.position.x - px, n.char.root.position.z - pz) > 58;
      if (!want || far) e.removeNPC(id);
      else if (n.specKey !== `${want.zone}|${want.activity}` && !n.talking) e.removeNPC(id);
    }
    for (const spec of this.desired.values()) {
      if (e.npcs.has(spec.id)) continue;
      if (Math.hypot(spec.x - px, spec.z - pz) > 46) continue;
      if (!force && adds >= 4) break;
      const { t, color } = tagFor(this, spec.kid);
      const grade = playerGrade(this.state) + (spec.kid.grade_at_start - 3);
      const npc = e.addNPC({
        id: spec.id,
        look: lookFromKid(spec.kid, grade, heightOf(this.state, spec.id)),
        uniform: spec.uniform,
        tag: t,
        tagColor: color,
        x: spec.x,
        z: spec.z,
        rot: spec.rot,
        mode: spec.mode,
        area: spec.area,
        interact: `Talk to ${knowsName(this.state.kids[spec.id]) ? spec.kid.first_name : 'this kid'}`,
      });
      npc.specKey = `${spec.zone}|${spec.activity}`;
      if (spec.run) npc.animSpeed = 1.4;
      adds++;
    }
  }

  /** Updates a kid's name tag. */
  retag(id) {
    const n = this.engine.npc(id);
    if (!n) return;
    this.engine.removeNPC(id);
    this.streamNPCs(true);
  }

  /** Removes an interaction spot. */
  removeSpot(entry) {
    const i = this.desc.interact.indexOf(entry);
    if (i >= 0) this.desc.interact.splice(i, 1);
    if (entry.data && entry.data.mesh) entry.data.mesh.removeFromParent();
  }

  /** Picks up a pickup. */
  collect(entry) {
    const msg = collectPickup(this.state, entry.data.p);
    sfx(entry.data.p.type === 'money' ? 'coin' : 'pop');
    toast(msg, entry.data.p.type === 'money' ? 'money' : '');
    this.removeSpot(entry);
    this.hud.render();
  }

  /** Puts markers on the map for current tasks. */
  addTaskMarkers() {
    const s = this.state;
    const d = this.desc;
    this.engine.clearMarkers();
    d.interact = d.interact.filter((i) => i.kind !== 'task');
    for (const t of s.tasks) {
      if (t.loc !== s.loc) continue;
      let pos = d.zones[t.zone];
      if (t.zone === 'front yard' && d.houses) {
        const kid = KID_BY_ID.get(t.kidId);
        const house = d.houses.find((hh) => hh.address === kid.residence.address) || d.houses[0];
        pos = house.lawn;
      }
      if (!pos) pos = { x: d.spawn.x, z: d.spawn.z - 3 };
      const x = pos.x + 1.2;
      const z = pos.z + 1.2;
      this.engine.addMarker(
        x,
        z,
        t.kind === 'hook' ? '#ffd23f' : '#4cc9f0',
        t.kind === 'hook' ? 'Recruit task' : 'Favor',
      );
      d.interact.push({ kind: 'task', x, z, r: 1.6, label: t.label, data: { taskId: t.id } });
    }
    if (d.extra && d.extra.mowLawn)
      this.engine.addMarker(d.extra.mowLawn.x, d.extra.mowLawn.z, '#74c69d', 'Mowing job');
    // Still need team shirts? Point at the Sporting Goods counter.
    const need = Math.max(SPORTS[s.team.sport].minRoster, s.team.roster.length);
    const shop = d.interact.find((i) => i.kind === 'shop' && i.data && i.data.shop === 'sporting goods');
    if (shop && s.team.shirts < need) this.engine.addMarker(shop.x, shop.z, '#ffd23f', 'Team shirts here!');
  }

  // Time
  tick(dt) {
    const s = this.state;
    if (!this.desc) return;
    const running =
      (this.mode === 'free' || this.mode === 'class') &&
      !modalOpen() &&
      !$('#overlay').classList.contains('show') &&
      !this.talking;
    this.engine.paused =
      !(this.mode === 'free' || this.mode === 'mow') ||
      modalOpen() ||
      $('#overlay').classList.contains('show') ||
      !!this.talking;
    if (running) {
      this.acc += dt;
      // Passing periods run slow (about a minute of real time) so you can chat on the way.
      let spm =
        this.passing && s.loc === 'school' && this.mode === 'free'
          ? PASS_SPM
          : SPEEDS[this.settings.speed] || SPEEDS.normal;
      // School-day mornings run slower until you get to school, so there's time to get ready and walk over.
      if (s.loc !== 'school' && s.time.minute < 8 * 60 && dayInfo(s.time.day).isSchoolDay) spm *= 1.6;
      this.spm = spm;
      if (this.acc >= spm) {
        this.acc -= spm;
        this.advance(1);
      }
    }
    this.streamT += dt;
    if (this.passing) {
      this.passT = (this.passT || 0) + dt;
      if (this.passT > 0.25) {
        this.passT = 0;
        this.hud.update();
      }
    }
    if (this.streamT > 0.35) {
      this.streamT = 0;
      this.streamNPCs();
      this.checkPeriodArrival();
      monitorPatrol(this);
      checkHangouts(this);
    }
  }

  /** Advance the clock, handling bells and other events. */
  advance(minutes, opts = {}) {
    const s = this.state;
    const before = s.time.minute;
    const events = advance(s, minutes);
    if (Math.floor(s.time.minute / 15) !== Math.floor(before / 15) || events.some((e) => e.type === 'bell'))
      this.refreshPresence();
    this.engine.setTimeOfDay(s.time.minute, this.desc && this.desc.indoor);
    for (const ev of events) this.onEvent(ev, opts);
    if (s.time.minute === 21 * 60 && s.loc !== 'home') toast("It's getting late! Be home by 9:30 PM.", 'bad');
    if (s.time.minute % 10 === 0) this.achievements();
    this.hud.update();
  }

  /** Checks for newly earned achievements. */
  achievements() {
    for (const a of checkAchievements(this.state)) {
      sfx('good');
      toast(`🏅 Achievement: ${a.name} - ${a.desc}`, 'good');
      try {
        window.backyardNative && window.backyardNative.unlockAchievement(a.id);
      } catch {
        /* not on Steam */
      }
    }
  }

  /** Handles a clock event (bell, game day, end of practice, curfew). */
  onEvent(ev, opts) {
    const s = this.state;
    if (ev.type === 'bell') onBell(this, ev.block);
    if (ev.type === 'dismissal') onDismissal(this);
    if (ev.type === 'gameday' && !opts.quiet) this.onGameDay();
    if (ev.type === 'crestcup' && !opts.quiet) startCrestCup(this);
    if (ev.type === 'practiceEnd') {
      const attended = s.loc === 'home' && this.inZone('backyard', 4);
      toast(finishPractice(s, attended), attended ? 'good' : 'bad');
    }
    if (ev.type === 'tryout') {
      if (s.loc === 'home') startTryout(this);
      else toast('Your tryout is starting at home! Get to the backyard!', 'bad');
    }
    if (ev.type === 'curfew') this.goToBed(true);
  }

  /** Jump the clock (used by "pay attention", jobs, waiting). */
  skip(minutes) {
    let left = minutes;
    while (left > 0) {
      const step = Math.min(left, 5);
      this.advance(step, { quiet: false });
      left -= step;
      if (this.mode === 'match' || this.mode === 'tryout') break;
    }
  }

  // School
  inZone(name, pad = 0.5) {
    const z = this.desc && this.desc.zones[name];
    if (!z) return false;
    const p = this.engine.playerState;
    return Math.abs(p.x - z.x) <= z.w / 2 + pad + 1 && Math.abs(p.z - z.z) <= z.d / 2 + pad + 1;
  }

  periodRoom(block) {
    return playerClass(this.state, block.period).room;
  }

  /** Where to stand in the hallway just outside a classroom's door. */
  doorSpot(room) {
    const z = this.desc && this.desc.zones[room];
    return z && z.door ? z.door : null;
  }

  /** "Science, Room 312" for your first class after `minute`, or null. */
  nextClassText(minute) {
    const nb = nextClassBlock(minute);
    if (!nb) return null;
    const c = playerClass(this.state, nb.period);
    return `${c.subject}, Room ${roomNumber(c.grade, c.subject)}`;
  }

  /** Seconds of real time left in the passing period (for the HUD countdown). */
  passingSecondsLeft() {
    const p = this.passing;
    if (!p) return 0;
    return Math.max(0, (p.block.end - this.state.time.minute) * (this.spm || PASS_SPM) - (this.acc || 0));
  }

  /** Checks if the player got to class on time. */
  checkPeriodArrival() {
    const s = this.state;
    if (
      this.passing &&
      s.loc === 'school' &&
      this.mode === 'free' &&
      this.inZone(this.passing.next.room, -1.2)
    ) {
      // Made it! Take your seat and the bell rings.
      const left = this.passing.block.end - s.time.minute;
      this.passing = null;
      if (left > 0) this.skip(left);
      return;
    }
    // Walked into your next classroom early (before school, at recess or lunch)? Skip ahead to the bell.
    if (
      !this.period &&
      s.loc === 'school' &&
      this.mode === 'free' &&
      dayInfo(s.time.day).isSchoolDay &&
      !modalOpen()
    ) {
      const nb = nextClassBlock(s.time.minute);
      if (nb && nb.start > s.time.minute && nb.start - s.time.minute <= 60) {
        const c = playerClass(s, nb.period);
        if (this.inZone(c.room, -1.2)) {
          toast(`You sit down early for ${c.subject}...`);
          this.skip(nb.start - s.time.minute);
          return;
        }
      }
    }
    ensurePeriod(this);
    const p = this.period;
    if (!p || s.loc !== 'school' || this.mode !== 'free') return;
    if (p.attended) {
      // Back from a hall pass (or a sneaky trip)? Sit back down.
      if (this.leftClass && p.block.kind === 'class' && this.inZone(p.room, -1.2)) {
        this.leftClass = false;
        resumeClass(this);
      }
      return;
    }
    if (this.inZone(p.room)) {
      const teacher = teacherInfo(s, p.block.period);
      const late = s.time.minute > p.block.start + teacher.tardyGrace;
      this.attend(late);
    }
  }

  /** Attends the current class (late or not). */
  attend(late) {
    const s = this.state;
    const p = this.period;
    if (!p) return;
    p.attended = true;
    s.school.attended[`${s.time.day}:${p.block.start}`] = true;
    if (late && !p.excusedLate) {
      p.late = true;
      toast(markTardy(s), 'bad');
    }
    enterClass(this, p);
  }

  /** Ends the current class period. */
  closePeriod() {
    const s = this.state;
    const p = this.period;
    this.period = null;
    if (!p || p.attended || p.excused) return;
    const info = dayInfo(s.time.day);
    if (!info.isSchoolDay) return;
    toast(markAbsent(s, p.subject), 'bad');
  }

  hallPassActive() {
    return this.state.time.minute < this.hallPassUntil;
  }

  // Games
  onGameDay() {
    const s = this.state;
    const g = playerGameThisWeek(s);
    if (!g) return;
    const opp = g.home === s.team.name ? g.away : g.home;
    startMatchFlow(this, g, opp);
  }

  /** Jump to the morning of your next game (classes count as attended; Friday quizzes still happen). */
  skipToGame() {
    const s = this.state;
    const n = nextGameInfo(s);
    if (!n) {
      toast('No game coming up. Register your team for the league first!', 'bad');
      return;
    }
    ask(
      '⏭️ Skip to your next game?',
      `Your next game is ${n.label}. You'll go to all your classes on the way (no absences), but any Friday quiz still counts toward your grade. Days you skip, you can't spend recruiting, working or hanging out.`,
      [
        { label: 'Skip ahead!', value: true, cls: 'red' },
        { label: 'Not yet', value: false, cls: 'white' },
      ],
    ).then((go) => {
      if (!go) return;
      exitClass(this);
      if (this.mode !== 'free') this.mode = 'free';
      this.period = null;
      this.passing = null;
      this.hallPassUntil = 0;
      const r = skipToNextGame(s);
      s.loc = 'home';
      saveToStorage(s);
      this.enter('home', 'bed');
      modal({
        title: r.ok ? '🏟️ Game day!' : 'Hmm',
        body: r.msgs.join('\n\n'),
        wide: r.msgs.join('').length > 400,
        buttons: [
          {
            label: r.ok ? "Let's play!" : 'Okay',
            cls: 'green',
            onClick: () => {
              if (r.ok)
                setTimeout(
                  () => this.advance(Math.max(1, (r.at || GAME_TIME) - s.time.minute), { quiet: false }),
                  50,
                );
            },
          },
        ],
      });
      this.hud.render();
    });
  }

  /** Sit out the rest of the school year (from season sign-ups). */
  skipToNextYear(after) {
    const s = this.state;
    ask(
      '⏭️ Skip to next school year?',
      "You'll sit out the rest of this school year's sports seasons and jump to the first day of next school year (and the next grade). You go to every class on the way and Friday quizzes still count. Your team won't play until you sign up again.",
      [
        { label: 'Skip the year', value: true, cls: 'red' },
        { label: 'Never mind', value: false, cls: 'white' },
      ],
    ).then((go) => {
      if (!go) {
        if (after) after();
        return;
      }
      exitClass(this);
      this.mode = 'free';
      this.period = null;
      this.passing = null;
      this.hallPassUntil = 0;
      const r = skipToNextYear(s);
      s.loc = 'home';
      saveToStorage(s);
      this.enter('home', 'bed');
      modal({
        title: `☀️ ${dayInfo(s.time.day).dateLabel}`,
        body: r.msgs.join('\n\n'),
        wide: true,
        buttons: [{ label: 'Rise and shine!', cls: 'green' }],
        onClose: () => maybeOpenSignup(this, after),
      });
      this.hud.render();
    });
  }

  // Sleep
  goToBed(forced = false) {
    const s = this.state;
    exitClass(this);
    if (forced && s.loc !== 'home') {
      addLog(s, 'Out past curfew. Mom & Dad had to come pick you up.');
    }
    if (this.mode === 'stand' || this.mode === 'paper' || this.mode === 'mow') this.mode = 'free';
    const msgs = sleep(s);
    sfx('sleep');
    if (forced && s.loc !== 'home')
      msgs.unshift('😬 You stayed out past curfew. Mom & Dad had to come get you. Embarrassing.');
    s.loc = 'home';
    this.period = null;
    this.passing = null;
    this.hallPassUntil = 0;
    saveToStorage(s);
    this.enter('home', 'bed');
    const info = dayInfo(s.time.day);
    const lines = [...msgs];
    if (info.isSchoolDay) lines.push("School starts at 8:00 AM. Don't be late!");
    if (info.dow === 5 && playerGameThisWeek(s)) lines.push('🏟️ GAME DAY! Your game starts at 10:00 AM.');
    if (crestCupToday(s) && playerInCrestCup(s))
      lines.push(`🏆 CREST CUP DAY! You represent Suncrest Academy vs the ${HILLTOP_TEAM} at 1:00 PM.`);
    modal({
      title: `☀️ ${info.dateLabel}`,
      body: lines.length ? lines.join('\n\n') : 'A brand new day. What will you do?',
      buttons: [
        { label: hasSundayPaper(s) ? 'Rise and shine! (📰 Sunday paper)' : 'Rise and shine!', cls: 'green' },
      ],
      wide: lines.join('').length > 400,
      // Sunday mornings: the paper is on the doorstep.
      // Sign-ups for a new season pop up after that.
      onClose: () => {
        if (hasSundayPaper(s)) openNewspaper(this, () => maybeOpenSignup(this));
        else maybeOpenSignup(this);
      },
    });
  }

  save() {
    const ok = saveToStorage(this.state);
    toast(ok ? 'Game saved.' : 'Could not save (storage is full or blocked).', ok ? 'good' : 'bad');
  }

  // Input
  onKey(e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.code === 'Escape') {
      if (closeTopModal()) return;
      if ($('#overlay').classList.contains('show') && this.overlayClose) {
        this.overlayClose();
        return;
      }
    }
    if (modalOpen() || this.talking) return;
    if (e.code === 'KeyM' && this.mode === 'free') openMap(this);
    if (e.code === 'KeyZ' && this.mode === 'free' && !modalOpen()) openWait(this);
    if (e.code === 'Tab' && (this.mode === 'free' || this.mode === 'class')) {
      e.preventDefault();
      openPhone(this);
    }
    if (e.code === 'KeyI' && (this.mode === 'free' || this.mode === 'class')) openPhone(this, 'backpack');
  }

  /** Interacts with whatever the player is facing. */
  interact(f) {
    if (this.mode !== 'free' || modalOpen() || this.talking) return;
    if (f.type === 'npc') {
      if (f.id.startsWith('KID-')) openTalk(this, f.id);
      else openAdult(this, f.npc);
      return;
    }
    if (f.kind === 'pickup') {
      this.collect(f.spot);
      return;
    }
    handleSpot(this, f.kind, f.data || {}, f.spot);
  }

  /** Travels to another location. */
  travel(dest) {
    const s = this.state;
    const mins = travelMinutes(s, s.loc, dest);
    this.advanceTravel(mins);
    this.enter(dest);
    toast(`Traveled to ${this.locName(dest)} (${mins} min).`);
  }

  advanceTravel(mins) {
    // Walking still lets the clock (and the school bell) do its thing.
    this.skip(mins);
  }

  /** Test/debug helper: eligible free agents for your grade's league. */
  debugEligibleFreeAgents(n = 10) {
    const s = this.state;
    return KIDS.filter((k) => !s.kids[k.id].team && !s.team.roster.includes(k.id))
      .map((k) => k.id)
      .filter((id) => KID_BY_ID.get(id).grade_at_start === 3 && KID_BY_ID.get(id).school_average >= 66)
      .slice(0, n);
  }

  destroy() {
    window.removeEventListener('keydown', this._keys);
  }
}
export { ask, formatTime, h, mowJobs, sectionOf, SPORTS, THREE };
