/* Runs learner-written code off the main thread.

   The prototype ran this with new Function on the UI thread, which meant a
   loop that never touched the array could freeze the tab. Here the worker is
   terminated from outside after a timeout, so no loop can hang the page. */

/// <reference lib="webworker" />
// @ts-nocheck
import { Tape, PRACTICE } from '../engine/practice.js';
import { rnd, buildTree, nbrs, TREE_VALUES } from '../engine/algorithms.js';

type Msg = { id: string; code: string };

function compile(src: string) {
  // eslint-disable-next-line no-new-func
  return new Function('"use strict"; return (' + src + ');')();
}

function correctness(p, fn) {
  let passed = 0,
    cases = 0,
    firstBad = null;

  if (p.check === 'sorted') {
    for (let k = 0; k < 10; k++) {
      const vals = p.range ? rnd(6 + k, p.range[0], p.range[1]) : rnd(6 + k, 3, 60);
      const tape = new Tape(vals);
      cases++;
      fn(tape);
      const want = [...vals].sort((x, y) => x - y);
      if (tape.a.join() === want.join()) passed++;
      else if (!firstBad) firstBad = { in: vals.join(', '), got: tape.a.join(', '), want: want.join(', ') };
    }
  } else if (p.check === 'index') {
    for (let k = 0; k < 10; k++) {
      const vals = rnd(7 + k, 3, 60);
      if (p.sorted) vals.sort((x, y) => x - y);
      const absent = k >= 8;
      const target = absent ? 9999 : vals[Math.floor(Math.random() * vals.length)];
      const want = vals.indexOf(target);
      cases++;
      const got = fn(new Tape(vals), target);
      const ok = got === want || (want >= 0 && vals[got] === target);
      if (ok) passed++;
      else if (!firstBad)
        firstBad = { in: vals.join(', '), got: 'returned ' + got, want: 'expected ' + want + ' for target ' + target };
    }
  } else if (p.check === 'tree') {
    const t = buildTree(TREE_VALUES);
    cases = 1;
    const got = fn(t.root);
    const want = [...TREE_VALUES].sort((x, y) => x - y);
    if (Array.isArray(got) && got.join() === want.join()) passed = 1;
    else firstBad = { in: 'the tree from the Learn tab', got: String(got), want: want.join(', ') };
  } else if (p.check === 'bfs') {
    cases = 1;
    const got = fn('A', (u: string) => nbrs(u).map((x) => x[0]));
    const want = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    if (Array.isArray(got) && got.join() === want.join()) passed = 1;
    else firstBad = { in: 'the graph from the Learn tab', got: String(got), want: want.join(', ') };
  }
  return { passed, cases, firstBad };
}

function traceDiff(p, fn) {
  if (!p.ref) return null;
  let vals = rnd(7, 5, 60);
  if (p.check === 'index' && p.sorted) vals = [...vals].sort((a, b) => a - b);
  const target = p.check === 'index' ? vals[3] : undefined;
  const mine = new Tape(vals);
  const ref = new Tape(vals);
  fn(mine, target);
  p.ref(ref, target);
  let i = 0;
  while (i < mine.ops.length && i < ref.ops.length && mine.ops[i] === ref.ops[i]) i++;
  const identical = i >= mine.ops.length && i >= ref.ops.length;
  const win = (arr: string[]) => arr.slice(Math.max(0, i - 2), i + 3);
  return {
    identical,
    at: i,
    from: Math.max(0, i - 2),
    mine: win(mine.ops),
    ref: win(ref.ops),
    mineLen: mine.ops.length,
    refLen: ref.ops.length,
  };
}

self.onmessage = (e: MessageEvent<Msg>) => {
  const { id, code } = e.data;
  const p = PRACTICE[id];
  try {
    const fn = compile(code);
    if (typeof fn !== 'function') {
      self.postMessage({ error: 'No function found. Keep the function declaration in place so it can be called.' });
      return;
    }
    const result = correctness(p, fn);
    let trace = null;
    try {
      trace = traceDiff(p, fn);
    } catch {
      /* correctness is already reported; a trace failure is not worth surfacing */
    }
    self.postMessage({ result, trace });
  } catch (err) {
    self.postMessage({ error: (err as Error).message });
  }
};
