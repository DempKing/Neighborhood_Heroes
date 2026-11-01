// Friendships, chats, hangouts, invites and tryouts.
import assert from 'node:assert/strict';
import test from 'node:test';
import { KIDS } from '../src/data/kids.js';
import {
  callCheck,
  chat,
  doHangout,
  hasNumber,
  invite,
  inviteCheck,
  inviteHangout,
  parseHook,
  routineKey,
} from '../src/game/social.js';
import { newGame } from '../src/game/state.js';
import { runDrill } from '../src/game/team.js';
import { opts } from './helpers.mjs';

test('social: chatting raises friendship and reveals routine facts', () => {
  const s = newGame(opts());
  const id = KIDS[5].id;
  const before = s.kids[id].f;
  const r = chat(s, id);
  assert.ok(s.kids[id].f > before);
  assert.ok(r.revealed);
  assert.equal(chat(s, id).gained, 0); // once per part of the day
  for (const k of KIDS) assert.ok(parseHook(k).label);
});
test('social: chat quality depends on the topic, and resets each period', () => {
  const kid = KIDS.find((k) => k.personality === 'Rule Follower');
  const gains = { like: 0, joke: 0 };
  for (let seed = 1; seed <= 40; seed++) {
    for (const topic of ['like', 'joke']) {
      const s = newGame({ ...opts(), seed });
      s.player.charisma = 40;
      const r = chat(s, kid.id, topic === 'like' ? `like:${kid.likes[0]}` : 'joke');
      gains[topic] += r.gained;
    }
  }
  assert.ok(gains.like > gains.joke * 1.5, `their interests land better (${gains.like} vs ${gains.joke})`);
  // In class, then the passing period after it: two separate chats.
  const s = newGame(opts());
  s.time.day = 1;
  s.time.minute = 8 * 60 + 30;
  assert.ok(chat(s, kid.id).gained > 0);
  assert.equal(chat(s, kid.id).gained, 0);
  const k1 = routineKey(s);
  s.time.minute = 9 * 60 + 11;
  assert.notEqual(routineKey(s), k1);
  assert.ok(chat(s, kid.id).gained > 0);
});
test('social: hangouts beat chats but can fail; numbers unlock at Friends', () => {
  const kid = KIDS[7];
  let yes = 0;
  let no = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const s = newGame({ ...opts(), seed });
    s.time.day = 1;
    s.time.minute = 10 * 60;
    s.kids[kid.id].f = 20;
    const r = inviteHangout(s, kid.id);
    if (r.ok) {
      yes++;
      assert.equal(r.when, 'after');
      assert.equal(s.hangouts.length, 1);
    } else no++;
    assert.equal(inviteHangout(s, kid.id).ok, false); // once per part of the day
  }
  assert.ok(yes > 0 && no > 0, `sometimes yes, sometimes no (${yes}/${no})`);
  const s = newGame(opts());
  s.kids[kid.id].f = 20;
  const before = s.kids[kid.id].f;
  const h = doHangout(s, kid.id);
  assert.ok(h.gained >= 10 && s.kids[kid.id].f > before + 9);
  assert.ok(hasNumber(s.kids[kid.id]), 'meeting a kid gets you their number');
  const stranger = KIDS.find((k) => !s.kids[k.id].met).id;
  s.time.minute = 16 * 60;
  assert.equal(callCheck(s, stranger).ok, false, 'no number for kids you have not met');
  s.time.day = 1;
  s.time.minute = 10 * 60;
  assert.equal(callCheck(s, kid.id).ok, false); // school hours
  s.time.minute = 16 * 60;
  assert.ok(callCheck(s, kid.id).ok);
});
test('invites respect friendship and league eligibility', () => {
  const s = newGame(opts());
  const easy = KIDS.find(
    (k) => k.recruitment.difficulty === 'Easy' && k.grade_at_start === 3 && !k.recruitment.current_team,
  );
  s.kids[easy.id].f = 0;
  assert.equal(inviteCheck(s, easy.id).ok, false);
  s.kids[easy.id].f = 80;
  assert.ok(invite(s, easy.id).ok);
  const sixth = KIDS.find((k) => k.grade_at_start === 6);
  assert.equal(inviteCheck(s, sixth.id).code, 'old');
});
test('tryout drill reveals stats as a range without laser gates', () => {
  const s = newGame(opts());
  const id = KIDS[3].id;
  const [r] = runDrill(s, 'sprints', [id]);
  assert.ok(r.values.SPD.label);
  assert.equal(s.kids[id].rev.SPD, 'range');
});
