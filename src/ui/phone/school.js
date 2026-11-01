// School app: classes, grades and homework.
import { CORE_SUBJECTS, roomNumber, SCHOOL_BLOCKS } from '../../data/world.js';
import { letterFor, playerClass } from '../../game/school.js';
import { gradeAverage } from '../../game/team.js';
import { dayInfo, formatTime } from '../../game/time.js';
import { h } from '../dom.js';

// School
const ampm = (m) => formatTime(m).replace(' AM', 'am').replace(' PM', 'pm');
/** The school app: classes, grades and quizzes. */
export function schoolApp(game, root) {
  const s = game.state;
  const info = dayInfo(s.time.day);
  const avg = gradeAverage(s);
  // Just the periods: time range, then the class (or lunch/recess) and where.
  const rows = SCHOOL_BLOCKS.filter((b) => ['class', 'lunch', 'recess'].includes(b.kind)).map((b) => {
    let what = b.label;
    let where = b.kind === 'lunch' ? 'Cafeteria' : 'Playground or gym';
    if (b.kind === 'class') {
      const c = playerClass(s, b.period);
      what = c.subject;
      where = `${c.teacher}, Room ${roomNumber(c.grade, c.subject)}`;
    }
    const now = s.time.minute >= b.start && s.time.minute < b.end && info.isSchoolDay;
    return h(
      'div',
      { class: `sched-row ${now ? 'now' : ''}` },
      h('div', { class: 'sched-time' }, `${ampm(b.start)} - ${ampm(b.end)}`),
      h('div', {}, h('b', {}, what), h('div', { class: 'muted' }, where)),
    );
  });
  const prep = h(
    'div',
    {},
    ...CORE_SUBJECTS.map((sub) =>
      h(
        'div',
        { class: 'row' },
        h('span', { style: { width: '120px' } }, sub),
        h(
          'div',
          { class: 'bar', style: { width: '120px' } },
          h('i', { style: { width: `${((s.school.prep[sub] || 0) / 8) * 100}%`, background: '#8a5cd6' } }),
        ),
      ),
    ),
  );
  root.append(
    h(
      'div',
      { class: 'grid2' },
      h(
        'div',
        { class: 'box' },
        h(
          'h3',
          {},
          info.isSchoolDay ? `Class schedule (${info.dowLong})` : 'Class schedule (no school today)',
        ),
        ...rows,
        h(
          'p',
          { class: 'muted' },
          'Get to your next room during the 5-minute passing period. Walking into the room skips ahead to the bell. Weekly quiz every Friday in period 1.',
        ),
      ),
      h(
        'div',
        { class: 'box' },
        h('h3', {}, 'Report card'),
        h(
          'div',
          { class: 'row' },
          'Average:',
          h('b', { style: { fontSize: '24px' } }, `${letterFor(avg)} (${avg}%)`),
        ),
        h('div', { class: 'muted' }, `Recent scores: ${s.school.scores.slice(-6).join(', ')}`),
        h(
          'p',
          {},
          s.school.sportsBan
            ? '🚫 GROUNDED FROM SPORTS until your average is a C- (70%) or better.'
            : avg < 70
              ? "⚠️ Below a C-. Two weeks like this and you're grounded from sports!"
              : '✅ Mom & Dad are happy with your grades.',
        ),
        h(
          'p',
          {},
          `Tardies this season: ${s.school.tardies}. ${s.school.detentionDay > s.time.day - 1 && s.school.detentionDay ? '⚠️ Detention coming up!' : ''}`,
        ),
        h('h3', { style: { marginTop: '8px' } }, 'Quiz prep'),
        prep,
        h(
          'p',
          { class: 'muted' },
          'Prep = hints and more time on quizzes. Pay attention in class, do homework on your computer, or study at the library.',
        ),
      ),
    ),
  );
}
