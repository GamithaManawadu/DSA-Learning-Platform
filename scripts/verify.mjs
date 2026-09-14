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
    let vals = p.range ? rnd(7, p.range[0], p.range[1]) : rnd(7, 1, 60);
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


/* ---- the newer topics: check the algorithm, not just that frames exist ---- */
const lastWatch = (frames, key) => {
  for (let i = frames.length - 1; i >= 0; i--) {
    const row = (frames[i].watch || []).find(([k]) => k === key);
    if (row) return row[1];
  }
  return null;
};

// heap: the min-heap property must hold in the final array
{
  const arr = String(lastWatch(L.heap.build(), 'heap as an array')).split(', ').map(Number);
  arr.forEach((v, i) => {
    if (i > 0) check(arr[(i - 1) >> 1] <= v, 'heap: parent larger than child at ' + i);
  });
}

// counting sort: the output row must be a sorted permutation of the input row
for (let t = 0; t < 40; t++) {
  const f = L.counting.build();
  const input = f[1].rows[0].cells.map((c) => c.t);
  const out = f[f.length - 1].rows[2].cells.map((c) => c.t);
  check(out.every((v, i) => i === 0 || out[i - 1] <= v), 'counting sort: output not sorted');
  check([...input].sort().join() === [...out].sort().join(), 'counting sort: values lost or invented');
}

// radix sort: final order sorted, and still the same multiset
for (let t = 0; t < 40; t++) {
  const f = L.radix.build();
  const start = String(lastWatch([f[0]], 'current order')).split(', ').map(Number);
  const end = String(lastWatch(f, 'final order')).split(', ').map(Number);
  check(end.every((v, i) => i === 0 || end[i - 1] <= v), 'radix sort: not sorted');
  check([...start].sort((a, b) => a - b).join() === [...end].join(), 'radix sort: values lost');
}

// AVL: six ascending inserts must not produce a chain, and in-order must ascend
{
  const f = L.avl.build();
  const last = f[f.length - 1];
  check(last.nodes.length === 6, 'avl: wrong node count');
  check(+lastWatch(f, 'height') <= 3, 'avl: tree did not stay balanced');
  const inorder = [...last.nodes].sort((a, b) => a.x - b.x).map((n) => n.v);
  check(inorder.every((v, i) => i === 0 || inorder[i - 1] < v), 'avl: rotation broke the search-tree order');
}

// memoisation and tabulation must agree, and both must be right
{
  const memoF = L.memo.build();
  const tabF = L.tabulation.build();
  const memoCells = memoF[memoF.length - 1].rows[0].cells.map((c) => c.t);
  const tabCells = tabF[tabF.length - 1].rows[0].cells.map((c) => c.t);
  check(memoCells.join() === tabCells.join(), 'memo and tabulation disagree');
  check(tabCells[8] === 21, 'fib(8) should be 21, got ' + tabCells[8]);
}

// knapsack: compare the table against brute force over all subsets
{
  const f = L.dp.build();
  const last = f[f.length - 1];
  const best = last.rows[last.rows.length - 1].cells[7].t;
  const items = [[3, 40], [2, 25], [4, 50], [1, 15]];
  let brute = 0;
  for (let mask = 0; mask < 16; mask++) {
    let w = 0, v = 0;
    items.forEach(([iw, iv], i) => { if (mask & (1 << i)) { w += iw; v += iv; } });
    if (w <= 7) brute = Math.max(brute, v);
  }
  check(best === brute, `knapsack: table says ${best}, brute force says ${brute}`);
}

// greedy: the failure case must genuinely fail
{
  const f = L.greedy.build();
  check(f.some((fr) => /optimal answer is <b>two<\/b>/.test(fr.note)), 'greedy: the counter-example is missing');
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

const entries = CURRICULUM.flatMap(([, items]) => items);
check(entries.every(([, id]) => id && L[id]), 'the sidebar lists a topic that has no lesson behind it');
check(entries.length === Object.keys(L).length, 'curriculum and lesson table disagree on what is built');
if (fail.length) { console.error('FAILED:\n  ' + fail.join('\n  ')); process.exit(1); }
console.log(`pass: ${Object.keys(L).length} topics, all reachable from the sidebar, ` +
  `${Object.values(L).reduce((n, m) => n + m.quiz.length, 0) + DRILLS.length + BUGS.length} questions, ` +
  `${Object.keys(PRACTICE).length} exercises, ${BUGS.length} debug challenges`);
