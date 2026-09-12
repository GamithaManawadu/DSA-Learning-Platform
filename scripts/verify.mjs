/* Correctness gate for the content, run with `npm test`.
   Every lesson must build frames, every sort must sort, every practice
   reference must be right, and every question must point at a real option. */
import { L } from '../src/engine/lessons.js';
import { BUGS } from '../src/engine/bugs.js';
import { PRACTICE, Tape } from '../src/engine/practice.js';
import { COUNTERS } from '../src/engine/counters.js';
import { DRILLS } from '../src/engine/drills.js';
import { STDLIB } from '../src/engine/stdlib.js';
import { USE_DETAIL } from '../src/engine/useDetail.js';
import { CURRICULUM } from '../src/engine/curriculum.js';
import { rnd } from '../src/engine/algorithms.js';

const fail = [];
const check = (cond, msg) => { if (!cond) fail.push(msg); };

// lessons
for (const id of Object.keys(L)) {
  const m = L[id];
  check(m.build().length > 0, id + ': builds no frames');
  check(m.uses.length >= 3, id + ': fewer than 3 use cases');
  check(m.quiz.length >= 4, id + ': fewer than 4 questions');
  check(STDLIB[id], id + ': no standard-library entry');
  check((USE_DETAIL[id] || []).length === m.uses.length, id + ': use-case explanations do not line up');
  m.quiz.forEach((q, i) => {
    check(q.a >= 0 && q.a < q.o.length, `${id} q${i}: answer index out of range`);
    check(!!q.why, `${id} q${i}: no explanation`);
  });
  m.build().forEach((f, i) => check(f.line >= 0 && f.line < m.code.length, `${id} frame ${i}: code line out of range`));
}

// sorting correctness, over random inputs
for (const id of ['bubble', 'selection', 'insertion', 'merge', 'quick']) {
  for (let t = 0; t < 100; t++) {
    const frames = L[id].build();
    const last = frames[frames.length - 1];
    const out = last.order.map((k) => last.vals[k]);
    check(out.every((v, i) => i === 0 || out[i - 1] <= v), id + ': final frame is not sorted');
  }
}

// practice references
for (const [id, p] of Object.entries(PRACTICE)) {
  check(typeof new Function('return (' + p.starter + ')')() === 'function', id + ': starter does not compile');
  if (!p.ref) continue;
  for (let t = 0; t < 60; t++) {
    let vals = rnd(7, 1, 60);
    if (p.sorted) vals.sort((a, b) => a - b);
    if (p.check === 'sorted') {
      const tape = new Tape(vals);
      p.ref(tape);
      check(tape.a.join() === [...vals].sort((a, b) => a - b).join(), id + ': reference does not sort');
    } else {
      const target = vals[Math.floor(Math.random() * vals.length)];
      check(vals[p.ref(new Tape(vals), target)] === target, id + ': reference returns the wrong index');
      check(p.ref(new Tape(vals), 9999) === -1, id + ': reference does not return -1 when absent');
    }
  }
}

// counters must grow the way the labels claim
const small = 10, big = 1000;
const ratio = (k) => COUNTERS[k](rnd(big, 1, 999)) / Math.max(1, COUNTERS[k](rnd(small, 1, 999)));
check(ratio('bubble') > 1000, 'bubble does not grow quadratically');
check(ratio('merge') < 1000, 'merge grows faster than expected');

// bugs and drills
for (const b of BUGS) {
  check(b.build().length > 0, b.id + ': builds no frames');
  check(b.q.a >= 0 && b.q.a < b.q.o.length, b.id + ': answer index out of range');
}
DRILLS.forEach((d, i) => check(d.a >= 0 && d.a < d.o.length && !!d.why, 'drill ' + i + ': malformed'));

const live = CURRICULUM.flatMap(([, items]) => items.filter(([, id]) => id));
check(live.length === Object.keys(L).length, 'curriculum and lesson table disagree on what is built');

const topics = CURRICULUM.reduce((n, [, i]) => n + i.length, 0);
if (fail.length) { console.error('FAILED:\n  ' + fail.join('\n  ')); process.exit(1); }
console.log(`pass: ${Object.keys(L).length} lessons built of ${topics} syllabus topics, ` +
  `${Object.values(L).reduce((n, m) => n + m.quiz.length, 0) + DRILLS.length + BUGS.length} questions, ` +
  `${Object.keys(PRACTICE).length} exercises, ${BUGS.length} debug challenges`);
