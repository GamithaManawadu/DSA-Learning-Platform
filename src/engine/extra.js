// @ts-nocheck
/* Additional topics beyond the first seventeen.
   Same contract as lessons.js: a builder returns an array of complete frames,
   and the table entry carries metadata, code, use cases and questions. */

import { rnd, mkEls, snapArr, keepDone } from './algorithms.js';

const DEF = () => rnd(9, 8, 95);

/* ---------- snapshot helpers for the new renderers ---------- */
const snapTreeRaw = (nodes, present, cur, seen, note, line, watch) =>
  ({ kind: 'tree', nodes: nodes.map(n => ({ ...n })), present: [...present], cur,
     seen: [...seen], out: [], note, line, watch: watch || [] });

const snapGrid = (rows, cols, note, line, watch) =>
  ({ kind: 'grid', rows: rows.map(r => ({ label: r.label, cells: r.cells.map(c => ({ ...c })) })),
     cols, note, line, watch: watch || [] });

const snapChain = (nodes, note, line, watch) =>
  ({ kind: 'chain', nodes: nodes.map(n => ({ ...n })), note, line, watch: watch || [] });

const snapBuckets = (buckets, labels, on, note, line, watch) =>
  ({ kind: 'buckets', buckets: buckets.map(b => b.map(p => ({ ...p }))), labels, on,
     hit: null, note, line, watch: watch || [] });

const snapLin2 = (items, roles, note, line, watch) =>
  ({ kind: 'linear', items: items.map(i => ({ ...i })), roles: { ...roles }, tags: [],
     note, line, watch: watch || [] });

/* ============================================================
   HEAPS — array-backed binary min-heap, drawn as a tree
   ============================================================ */
function heapLayout(arr) {
  return arr.map((e, i) => {
    const level = Math.floor(Math.log2(i + 1));
    const slot = i - (2 ** level - 1);
    const width = 560 / 2 ** level;
    return { id: e.id, v: e.v, x: 14 + width * (slot + 0.5), y: 36 + level * 68,
             parent: i === 0 ? null : arr[(i - 1) >> 1].id };
  });
}
export function heapDemo() {
  const vals = [50, 30, 70, 20, 45, 60, 10];
  const a = [], f = [];
  let id = 0, swaps = 0;
  const snap = (cur, note, line, extra) =>
    f.push(snapTreeRaw(heapLayout(a), a.map(e => e.id), cur, [], note, line,
      [['heap as an array', a.map(e => e.v).join(', ') || 'empty'], ['swaps', swaps], ...(extra || [])]));

  f.push(snapTreeRaw([], [], null, [],
    'A heap is an array that you read as a tree. The only rule is that a parent is never larger than its children, which is much weaker than sorting.', 0, []));

  for (const v of vals) {
    a.push({ id: 'h' + id++, v });
    let i = a.length - 1;
    snap(a[i].id, `Add <b>${v}</b> at the end of the array, which is the next free slot in the tree.`, 1);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].v <= a[i].v) {
        snap(a[i].id, `Its parent ${a[p].v} is smaller, so the rule already holds. Stop.`, 3);
        break;
      }
      snap(a[i].id, `Parent ${a[p].v} is larger than ${a[i].v}, so they swap. This is called sifting up.`, 4);
      [a[p], a[i]] = [a[i], a[p]]; swaps++; i = p;
      snap(a[i].id, `Swapped. At most log₂(n) of these can happen, because that is the height.`, 4);
    }
  }
  f.push(snapTreeRaw(heapLayout(a), a.map(e => e.id), a[0].id, [],
    `The smallest value, <b>${a[0].v}</b>, is at the root. Nothing else is sorted, and that is the point: you paid only for the guarantee you needed.`, 5,
    [['heap as an array', a.map(e => e.v).join(', ')], ['swaps', swaps]]));

  for (let round = 0; round < 2; round++) {
    const min = a[0].v;
    snap(a[0].id, `Take the minimum, <b>${min}</b>, from the root. That is what a priority queue is for.`, 6);
    a[0] = a[a.length - 1]; a.pop();
    snap(a.length ? a[0].id : null, `Move the last value to the root so the tree stays complete, then repair downward.`, 7);
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let small = i;
      if (l < a.length && a[l].v < a[small].v) small = l;
      if (r < a.length && a[r].v < a[small].v) small = r;
      if (small === i) { snap(a[i].id, 'Both children are larger, so the rule holds again.', 8); break; }
      snap(a[small].id, `Child ${a[small].v} is smaller than ${a[i].v}, so swap down.`, 9);
      [a[i], a[small]] = [a[small], a[i]]; swaps++; i = small;
    }
  }
  f.push(snapTreeRaw(heapLayout(a), a.map(e => e.id), null, [],
    `Insert and extract are both O(log n) because each walks one root-to-leaf path. Finding the minimum itself is O(1): it is just position 0.`, 6,
    [['heap as an array', a.map(e => e.v).join(', ')], ['swaps', swaps]]));
  return f;
}

/* ============================================================
   COUNTING SORT — grid renderer, no comparisons at all
   ============================================================ */
export function countingSort() {
  const vals = Array.from({ length: 12 }, () => Math.floor(Math.random() * 8));
  const K = 8, counts = Array(K).fill(0), out = Array(vals.length).fill(undefined);
  const f = [];
  const rows = (note, line, watch, inRole, cRole, oRole) => f.push(snapGrid([
    { label: 'input', cells: vals.map((v, i) => ({ t: v, role: inRole === i ? 'cmp' : '' })) },
    { label: 'counts', cells: counts.map((c, i) => ({ t: c, role: cRole === i ? 'mov' : '' })) },
    { label: 'output', cells: out.map((v, i) => ({ t: v, role: oRole === i ? 'done' : (v !== undefined ? 'fill' : '') })) },
  ], null, note, line, watch));

  rows('Counting sort never compares two values. It uses each value as an index, the same trick as a hash map.', 0, [['comparisons', 0]]);
  for (let i = 0; i < vals.length; i++) {
    counts[vals[i]]++;
    rows(`Read <b>${vals[i]}</b> and add one to the counter at position ${vals[i]}. No comparison happened.`, 1, [['comparisons', 0], ['values read', i + 1]], i, vals[i]);
  }
  rows('Every value has been tallied. The counts row already tells you how many of each there are.', 1, [['comparisons', 0]]);

  for (let i = 1; i < K; i++) {
    counts[i] += counts[i - 1];
    rows(`Running total: position ${i} becomes ${counts[i]}, which is where values equal to ${i} finish in the output.`, 2, [['comparisons', 0]], null, i);
  }
  for (let i = vals.length - 1; i >= 0; i--) {
    const v = vals[i];
    counts[v]--;
    out[counts[v]] = v;
    rows(`Place <b>${v}</b> directly at output position ${counts[v]}. Walking the input backwards is what keeps equal values in their original order.`, 4, [['comparisons', 0]], i, v, counts[v]);
  }
  rows(`Sorted in ${vals.length} reads and ${vals.length} writes, with zero comparisons. The O(n log n) floor only applies to sorts that compare.`, 4, [['comparisons', 0]]);
  return f;
}

/* ============================================================
   RADIX SORT — buckets renderer, one pass per digit
   ============================================================ */
export function radixSort() {
  let a = Array.from({ length: 9 }, () => 10 + Math.floor(Math.random() * 890));
  const f = [];
  const empty = () => Array.from({ length: 10 }, () => []);
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const digitName = ['ones', 'tens', 'hundreds'];

  f.push(snapBuckets(empty(), labels, -1,
    'Radix sort sorts by one digit at a time, starting from the right. Each pass is a counting sort, so still nothing is compared.', 0,
    [['current order', a.join(', ')]]));

  for (let d = 0; d < 3; d++) {
    const buckets = empty();
    const div = 10 ** d;
    f.push(snapBuckets(buckets, labels, -1,
      `Pass ${d + 1}: sort by the <b>${digitName[d]}</b> digit. The order from the previous pass is preserved inside each bucket, which is why stability matters here.`, 1,
      [['current order', a.join(', ')]]));
    for (const n of a) {
      const dig = Math.floor(n / div) % 10;
      buckets[dig].push({ k: n, v: '' });
      f.push(snapBuckets(buckets, labels, dig,
        `<b>${n}</b> has ${digitName[d]} digit ${dig}, so it goes in bucket ${dig}. No value is ever compared with another.`, 2,
        [['current order', a.join(', ')]]));
    }
    a = buckets.flat().map(p => p.k);
    f.push(snapBuckets(buckets, labels, -1,
      `Collect the buckets left to right. The list is now sorted by the last ${d + 1} digit${d ? 's' : ''}: ${a.join(', ')}`, 3,
      [['current order', a.join(', ')]]));
  }
  f.push(snapBuckets(empty(), labels, -1,
    `Sorted after three passes. The cost is O(d × n) for d digits, which beats O(n log n) once n is large and the keys are short.`, 3,
    [['final order', a.join(', ')], ['comparisons', 0]]));
  return f;
}

/* ============================================================
   LINKED LISTS — chain renderer
   ============================================================ */
export function linkedList() {
  let nodes = [
    { id: '0x1a', v: 12, role: '' }, { id: '0x2f', v: 7, role: '' },
    { id: '0x3c', v: 41, role: '' }, { id: '0x4b', v: 9, role: '' },
  ];
  const f = [];
  const snap = (note, line, watch) => f.push(snapChain(nodes, note, line, watch));
  const clear = () => nodes.forEach(n => (n.role = ''));

  snap('A linked list is nodes scattered anywhere in memory, each holding a value and the address of the next one. There is no index and no contiguous block.', 0,
    [['length', nodes.length]]);

  for (let i = 0; i < 3; i++) {
    clear(); nodes[i].role = 'cmp';
    snap(`To reach position ${i} you must walk from the head. There is no arithmetic that jumps straight there, which is the whole difference from an array.`, 1,
      [['steps taken', i + 1], ['looking for', 'position 2']]);
  }
  clear(); nodes[2].role = 'done';
  snap('Position 2 found after three steps. Access is O(n), where an array would be O(1).', 2, [['steps taken', 3]]);

  clear(); nodes[1].role = 'cmp';
  snap('Now insert a new node after position 1. First walk to that node, which is again the expensive part.', 3, [['steps taken', 2]]);
  nodes = [...nodes.slice(0, 2), { id: '0x5e', v: 30, role: 'mov' }, ...nodes.slice(2)];
  snap('Point the new node at what came next, then point the previous node at the new one. Two assignments, and nothing else in the list moves.', 4,
    [['length', nodes.length], ['values shifted', 0]]);
  clear();
  snap('That is the trade. An array insert in the middle shifts every later element; here the cost is finding the spot, not making room.', 4,
    [['length', nodes.length]]);

  clear(); nodes[3].role = 'cmp';
  snap('Delete the node holding 41. Walk to the node before it.', 5, [['length', nodes.length]]);
  nodes = nodes.filter(n => n.v !== 41);
  clear();
  snap('Point the previous node past it. The removed node is now unreachable, and in a managed language the garbage collector takes it from there.', 6,
    [['length', nodes.length]]);
  return f;
}

/* ============================================================
   AVL — rotations, with nodes that move
   ============================================================ */
function avlLayout(root) {
  const nodes = [];
  let k = 0;
  (function walk(n, depth, parent) {
    if (!n) return;
    walk(n.left, depth + 1, n.id);
    n.x = 50 + k++ * 84; n.y = 36 + depth * 66;
    nodes.push({ id: n.id, v: n.v, x: n.x, y: n.y, parent });
    walk(n.right, depth + 1, n.id);
  })(root, 0, null);
  return nodes;
}
const height = n => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0);
const balance = n => (n ? height(n.left) - height(n.right) : 0);

export function avlDemo() {
  const f = [];
  let root = null, id = 0;
  const ids = [];
  const snap = (cur, note, line) => {
    const nodes = avlLayout(root);
    f.push(snapTreeRaw(nodes, nodes.map(n => n.id), cur, [], note, line,
      [['height', height(root)], ['balance at root', balance(root)]]));
  };

  f.push(snapTreeRaw([], [], null, [],
    'An AVL tree is a binary search tree that repairs its own shape. After every insert it checks how lopsided each node is, and rotates when the difference reaches two.', 0, []));

  const insert = (node, v, made) => {
    if (!node) { const n = { id: 'a' + id++, v, left: null, right: null }; made.node = n; return n; }
    if (v < node.v) node.left = insert(node.left, v, made);
    else node.right = insert(node.right, v, made);
    return node;
  };
  const rotateLeft = n => { const r = n.right; n.right = r.left; r.left = n; return r; };
  const rotateRight = n => { const l = n.left; n.left = l.right; l.right = n; return l; };

  const rebalance = (node, path) => {
    const b = balance(node);
    if (b < -1) {
      if (balance(node.right) > 0) {
        snap(node.right.id, `Node ${node.v} leans right, but its right child leans left. That needs two rotations, not one.`, 4);
        node.right = rotateRight(node.right);
        snap(node.id, 'First rotate the child right, turning the zig-zag into a straight line.', 5);
      }
      snap(node.id, `Node <b>${node.v}</b> is out of balance by ${b}. Rotate it left so its right child becomes the new parent.`, 3);
      const nn = rotateLeft(node);
      return { node: nn, rotated: true };
    }
    if (b > 1) {
      if (balance(node.left) < 0) {
        snap(node.left.id, `Node ${node.v} leans left, but its left child leans right. Straighten the child first.`, 4);
        node.left = rotateLeft(node.left);
        snap(node.id, 'Now the imbalance is a straight line and one more rotation fixes it.', 5);
      }
      snap(node.id, `Node <b>${node.v}</b> is out of balance by ${b}. Rotate it right.`, 3);
      const nn = rotateRight(node);
      return { node: nn, rotated: true };
    }
    return { node, rotated: false };
  };

  const insertAndFix = v => {
    const made = {};
    root = insert(root, v, made);
    ids.push(made.node.id);
    snap(made.node.id, `Insert <b>${v}</b>. Inserting is exactly the same as in an ordinary search tree; the difference comes next.`, 1);
    const fixUp = node => {
      if (!node) return null;
      node.left = fixUp(node.left); node.right = fixUp(node.right);
      const r = rebalance(node);
      if (r.rotated) snap(r.node.id, `Balanced. Notice the values kept their order: ${'the search tree rule still holds'}.`, 6);
      return r.node;
    };
    root = fixUp(root);
  };

  for (const v of [10, 20, 30, 40, 50, 25]) insertAndFix(v);

  snap(null, `Six values inserted in ascending order. An ordinary search tree would now be a chain six deep; this one is ${height(root)} deep, so lookups stayed at log n.`, 6);
  return f;
}

/* ============================================================
   MEMOISATION — the same table, filled top down
   ============================================================ */
export function memoDemo() {
  const N = 8;
  const memo = Array(N + 1).fill(undefined);
  const f = [];
  let calls = 0, hits = 0;
  const snap = (role, note, line) => f.push(snapGrid(
    [{ label: 'memo', cells: memo.map((v, i) => ({ t: v === undefined ? '' : v, role: role === i ? 'cmp' : (v !== undefined ? 'fill' : '') })) }],
    Array.from({ length: N + 1 }, (_, i) => 'n=' + i), note, line,
    [['calls made', calls], ['answers reused', hits], ['calls without memo', 2 * fibCalls(N) - 1]]));

  f.push(snapGrid([{ label: 'memo', cells: memo.map(() => ({ t: '' })) }],
    Array.from({ length: N + 1 }, (_, i) => 'n=' + i),
    `Plain recursive fib(${N}) makes ${2 * fibCalls(N) - 1} calls because it recomputes the same values over and over. Memoisation writes each answer down the first time.`, 0, []));

  (function fib(n) {
    calls++;
    if (memo[n] !== undefined) {
      hits++;
      snap(n, `fib(${n}) was already worked out. Return <b>${memo[n]}</b> from the table instead of recursing again.`, 2);
      return memo[n];
    }
    snap(n, `fib(${n}) is not in the table yet, so it has to be computed.`, 1);
    const v = n < 2 ? n : fib(n - 1) + fib(n - 2);
    memo[n] = v;
    snap(n, `Write fib(${n}) = <b>${v}</b> into the table. It will never be computed again.`, 4);
    return v;
  })(N);

  snap(null, `Answer ${memo[N]} in ${calls} calls, ${hits} of which were table lookups. Without the table it would have been ${2 * fibCalls(N) - 1}.`, 4);
  return f;
}
function fibCalls(n) { return n < 2 ? 1 : fibCalls(n - 1) + fibCalls(n - 2); }

/* ============================================================
   TABULATION — the same table, filled bottom up
   ============================================================ */
export function tabulationDemo() {
  const N = 8;
  const t = Array(N + 1).fill(undefined);
  const f = [];
  const snap = (role, note, line, watch) => f.push(snapGrid(
    [{ label: 'table', cells: t.map((v, i) => ({ t: v === undefined ? '' : v, role: role === i ? 'cmp' : (v !== undefined ? 'fill' : '') })) }],
    Array.from({ length: N + 1 }, (_, i) => 'n=' + i), note, line, watch || []));

  snap(null, 'Tabulation solves the identical problem in the opposite direction: start from the smallest case and fill forward, with no recursion at all.', 0);
  t[0] = 0; snap(0, 'Base case: fib(0) is 0.', 1);
  t[1] = 1; snap(1, 'Base case: fib(1) is 1.', 2);
  for (let i = 2; i <= N; i++) {
    t[i] = t[i - 1] + t[i - 2];
    snap(i, `fib(${i}) = fib(${i - 1}) + fib(${i - 2}) = ${t[i - 1]} + ${t[i - 2]} = <b>${t[i]}</b>. Both inputs are already sitting in the table to the left.`, 4,
      [['cells filled', i + 1], ['recursion depth', 0]]);
  }
  snap(N, `Answer ${t[N]} in ${N + 1} steps, each one constant work. No call stack, so this version cannot overflow no matter how large n gets.`, 5,
    [['cells filled', N + 1], ['recursion depth', 0]]);
  return f;
}

/* ============================================================
   DYNAMIC PROGRAMMING — 0/1 knapsack, the two-dimensional case
   ============================================================ */
export function knapsack() {
  const items = [{ n: 'rope', w: 3, v: 40 }, { n: 'torch', w: 2, v: 25 },
                 { n: 'tent', w: 4, v: 50 }, { n: 'radio', w: 1, v: 15 }];
  const CAP = 7;
  const T = Array.from({ length: items.length + 1 }, () => Array(CAP + 1).fill(0));
  const f = [];
  const cols = Array.from({ length: CAP + 1 }, (_, c) => c);
  const snap = (ri, ci, note, line, watch) => f.push(snapGrid(
    T.map((row, r) => ({
      label: r === 0 ? 'nothing' : items[r - 1].n,
      cells: row.map((v, c) => ({ t: v, role: r === ri && c === ci ? 'cmp' : (r < ri || (r === ri && c < ci) ? 'fill' : '') })),
    })), cols, note, line, watch || []));

  snap(-1, -1, `Four items, a bag that holds ${CAP} kilos. Every cell answers one small question: using only the items listed so far, what is the best value that fits in this much space?`, 0,
    [['items', items.map(i => `${i.n} ${i.w}kg/$${i.v}`).join('  ')]]);

  for (let r = 1; r <= items.length; r++) {
    const it = items[r - 1];
    for (let c = 0; c <= CAP; c++) {
      const skip = T[r - 1][c];
      if (it.w > c) {
        T[r][c] = skip;
        snap(r, c, `The ${it.n} weighs ${it.w} and only ${c} fits here, so it cannot go in. Copy the answer from the row above.`, 2,
          [['best so far', skip]]);
      } else {
        const take = it.v + T[r - 1][c - it.w];
        T[r][c] = Math.max(skip, take);
        snap(r, c, `Take the ${it.n}? That is $${it.v} plus the best for the remaining ${c - it.w} kilos, which is $${T[r - 1][c - it.w]}, so $${take}. Skip it and you keep $${skip}. Choose <b>$${T[r][c]}</b>.`, 4,
          [['take', '$' + take], ['skip', '$' + skip]]);
      }
    }
  }
  let c = CAP, chosen = [];
  for (let r = items.length; r > 0; r--) {
    if (T[r][c] !== T[r - 1][c]) { chosen.push(items[r - 1].n); c -= items[r - 1].w; }
  }
  snap(items.length, CAP, `Best value is <b>$${T[items.length][CAP]}</b>, from ${chosen.reverse().join(' and ')}. Walking backwards through the table recovers which items were chosen.`, 4,
    [['chosen', chosen.join(', ')]]);
  return f;
}

/* ============================================================
   GREEDY — right answer, then a case where it is wrong
   ============================================================ */
export function greedyDemo() {
  const f = [];
  let items = [], n = 0;
  const snap = (roles, note, line, watch) => f.push(snapLin2(items, roles, note, line, watch));

  snap({}, 'A greedy algorithm takes the best-looking option at every step and never reconsiders. Making change is the classic example.', 0,
    [['target', 63], ['coins used', 0]]);

  let left = 63;
  for (const coin of [25, 10, 5, 1]) {
    while (left >= coin) {
      left -= coin;
      items = [...items, { id: 'c' + n++, v: coin }];
      const roles = {}; roles[items[items.length - 1].id] = 'mov';
      snap(roles, `Take the largest coin that still fits: <b>${coin}</b>. ${left} left to make.`, 1,
        [['target', 63], ['remaining', left], ['coins used', items.length]]);
    }
  }
  snap({}, `63 made with ${items.length} coins, which is the fewest possible. With these denominations greedy happens to be optimal, and it is provable.`, 2,
    [['coins used', items.length]]);

  items = []; n = 0;
  snap({}, 'Now change the coins to 1, 3 and 4, and make 6. Watch greedy make the wrong choice while following exactly the same rule.', 0,
    [['target', 6], ['coins', '1, 3, 4']]);
  left = 6;
  for (const coin of [4, 3, 1]) {
    while (left >= coin) {
      left -= coin;
      items = [...items, { id: 'g' + n++, v: coin }];
      const roles = {}; roles[items[items.length - 1].id] = 'mov';
      snap(roles, `Take <b>${coin}</b>, the largest that fits. ${left} left.`, 1,
        [['target', 6], ['remaining', left], ['coins used', items.length]]);
    }
  }
  const bad = items.length;
  items = [{ id: 'x1', v: 3 }, { id: 'x2', v: 3 }];
  snap({ x1: 'done', x2: 'done' },
    `Greedy used ${bad} coins: 4 + 1 + 1. The optimal answer is <b>two</b> coins, 3 + 3, which greedy can never find because taking the 4 first ruled it out.`, 2,
    [['greedy', bad + ' coins'], ['optimal', '2 coins']]);
  snap({ x1: 'done', x2: 'done' },
    'This is the whole difference between greedy and dynamic programming. Greedy commits and moves on; DP keeps every partial answer so a worse-looking early choice can still win.', 2,
    [['greedy', bad + ' coins'], ['optimal', '2 coins']]);
  return f;
}

/* ============================================================
   LESSON TABLE
   ============================================================ */
export const EXTRA_LESSONS = {
  heap: {
    t: 'Heaps and priority queues', time: 'O(log n) insert and extract, O(1) peek', space: 'O(n)',
    idea: 'A tree kept only loosely ordered: every parent is smaller than its children, and nothing else is promised. That weak rule is cheap to maintain and is exactly enough to always know the smallest item.',
    build: heapDemo,
    code: ['push(x):', '  append x at the end', '  while x < parent:', '    # rule already holds', '    swap x with its parent',
           '# the minimum is always at index 0', 'pop():', '  take index 0, move the last item there', '  # children are larger, done', '  swap down with the smaller child'],
    uses: [
      ['Task schedulers and job queues', 'Anything that must always run the highest-priority waiting item next: OS schedulers, CI runners, background job systems with priorities.'],
      ['Dijkstra and A*', 'The "cheapest unvisited node" step you saw scan the whole list is a heap in every real implementation, turning O(V²) into O(E log V).'],
      ['Top-k and streaming', 'Keep a heap of size k while data streams past and you get the top 1,000 results from a billion rows using memory for 1,000.']],
    quiz: [
      { q: 'What does a heap guarantee about its contents?', o: ['They are fully sorted', 'Only that each parent is smaller than its children', 'That lookups by value are fast'], a: 1,
        why: 'It is a much weaker promise than sorting, and that weakness is the point: maintaining it costs one root-to-leaf path instead of a full ordering.' },
      { q: 'Why are insert and extract both O(log n)?', o: ['The heap is sorted', 'Each one walks a single path from root to leaf, and the height is log n', 'They only touch the root'], a: 1,
        why: 'A complete binary tree of n nodes has height log₂(n), and sifting up or down moves one level at a time.' },
      { q: 'You need the 100 largest values from a stream of 50 million. What do you keep?', o: ['A sorted array of everything', 'A heap of size 100, dropping the smallest as you go', 'A hash map'], a: 1,
        why: 'Memory stays constant at 100 items regardless of stream length, and each item costs O(log 100). Sorting 50 million to take 100 is enormous waste.' },
      { q: 'Can you use a heap to find whether a particular value is present?', o: ['Yes, in O(log n)', 'Not efficiently; that needs a scan', 'Yes, in O(1)'], a: 1,
        why: 'The ordering only relates parents to children, so it gives no guidance about where an arbitrary value sits. Wanting that is a sign you need a hash map or a search tree.' }],
  },

  counting: {
    t: 'Counting sort', time: 'O(n + k)', space: 'O(k)',
    idea: 'Do not compare anything. Count how many of each value there are, then use those counts to work out exactly where each value belongs. Works when the values are integers within a known range.',
    build: countingSort,
    code: ['for v in a:', '  counts[v] += 1', 'make counts cumulative', '', 'for v in reversed(a):', '  counts[v] -= 1', '  out[counts[v]] = v'],
    uses: [
      ['The bucketing step in bigger pipelines', 'Grouping rows by a small set of keys before an aggregation is counting sort with the output step left off.'],
      ['Inside radix sort', 'Each digit pass of a radix sort is a counting sort. It is more often a component than a standalone algorithm.'],
      ['Histograms and image processing', 'Pixel intensities are integers from 0 to 255, which is exactly the shape counting sort wants, so it appears throughout image work.']],
    quiz: [
      { q: 'How many comparisons between two values does counting sort make?', o: ['About n log n', 'About n', 'None at all'], a: 2,
        why: 'It uses values as array indices rather than comparing them, which is precisely why the O(n log n) lower bound does not apply to it.' },
      { q: 'What is the k in O(n + k)?', o: ['The number of comparisons', 'The size of the range of possible values', 'The number of digits'], a: 1,
        why: 'You allocate one counter per possible value. Sorting ten values that range up to a billion would allocate a billion counters, which is why the range must be small.' },
      { q: 'Why does the final loop walk the input backwards?', o: ['It is faster', 'It keeps equal values in their original relative order, making the sort stable', 'It avoids an off-by-one'], a: 1,
        why: 'Stability is not decoration here. Radix sort is built on stable passes, so reversing this loop would break radix sort entirely.' },
      { q: 'Sorting a million records by a floating-point score. Does counting sort apply?', o: ['Yes, directly', 'No, the values are not integers within a small range', 'Only if they are sorted first'], a: 1,
        why: 'This is the usual answer in application code, and it is why you call the library sort most of the time. Counting sort is a specialist that pays off when its preconditions genuinely hold.' }],
  },

  radix: {
    t: 'Radix sort', time: 'O(d × n) for d digits', space: 'O(n + k)',
    idea: 'Sort by the last digit, then the second-to-last, and so on. Each pass is a stable counting sort, and after the final digit the whole list is in order.',
    build: radixSort,
    code: ['for digit in range(d):      # right to left', '  buckets = [[] for _ in range(10)]', '  for n in a:', '    buckets[digit_of(n)].append(n)', '  a = concat(buckets)   # stable'],
    uses: [
      ['Column stores and query engines', 'Sorting fixed-width integer keys is common enough that engines such as ClickHouse and DuckDB use radix or radix-hybrid sorts internally.'],
      ['GPU sorting', 'Radix sort is the standard choice on graphics hardware because it is branch-free and parallelises cleanly, which comparison sorts do not.'],
      ['Suffix arrays and text indexing', 'Building the index behind full-text search and several compression formats relies on radix-style sorting of fixed-width keys.']],
    quiz: [
      { q: 'Why must each digit pass be stable?', o: ['To make it faster', 'Because the work of the earlier passes survives only if equal digits keep their order', 'To save memory'], a: 1,
        why: 'Sorting by tens must not scramble the ones ordering already achieved. With an unstable pass the algorithm produces nonsense.' },
      { q: 'Why sort from the rightmost digit rather than the leftmost?', o: ['It is conventional', 'So that more significant digits, sorted later, take precedence', 'To avoid negative numbers'], a: 1,
        why: 'The last pass dominates, and it is the most significant digit. Going left to right needs recursion into groups, which is a different and messier algorithm.' },
      { q: 'One million 32-bit integers. Radix or the library sort?', o: ['Radix can genuinely win here', 'The library sort is always faster', 'Neither works'], a: 0,
        why: 'Fixed-width integer keys are exactly its case: four passes over a million items beats twenty million comparisons. This is why database engines bother.' },
      { q: 'Does O(d × n) mean radix sort beats every comparison sort?', o: ['Yes, it is linear', 'No, d grows with key length and the constant factors are real', 'Only on sorted input'], a: 1,
        why: 'Long or variable-length keys make d large, and each pass moves all the data. Calling it linear hides a factor that often matters more than the asymptotics.' }],
  },

  linkedlist: {
    t: 'Linked lists', time: 'O(1) insert or delete at a known node, O(n) to find one', space: 'O(n)',
    idea: 'Nodes scattered anywhere in memory, each holding a value and the address of the next. There is no index, so reaching position five means walking five links.',
    build: linkedList,
    code: ['node = head', 'while node and node.value != target:', '  node = node.next', '', 'new.next = node.next    # insert', 'node.next = new', 'prev.next = node.next   # delete'],
    uses: [
      ['Deques and queues inside standard libraries', 'Python\u2019s deque and Java\u2019s LinkedList are built this way, which is why appending and popping at both ends is O(1).'],
      ['LRU caches', 'A doubly linked list plus a hash map is the classic implementation: the map finds the node instantly, the list moves it to the front in constant time.'],
      ['Hash bucket chains and free lists', 'The small list inside a hash bucket, and the list of free blocks in a memory allocator, are both linked lists.']],
    quiz: [
      { q: 'Why is reading position 5 of a linked list slower than of an array?', o: ['Linked lists are stored on disk', 'An array computes the address arithmetically; a list must follow five pointers', 'Arrays are compressed'], a: 1,
        why: 'Contiguous memory means index times element size gives the address directly. Scattered nodes give you no such arithmetic.' },
      { q: 'Where does a linked list genuinely beat an array?', o: ['Random access by index', 'Inserting or removing when you already hold the node', 'Memory usage'], a: 1,
        why: 'Two pointer assignments and nothing else moves, where an array would shift every later element. The catch is that you must already be at the node.' },
      { q: 'Why are linked lists often slower in practice than the big-O suggests?', o: ['The pointers take too much space', 'Scattered nodes defeat the CPU cache, which fetches neighbouring memory', 'They cannot be sorted'], a: 1,
        why: 'An array walk gets several elements per memory fetch. A list walk can stall on every node. This is why array-backed structures win more often than textbooks imply.' },
      { q: 'You need an LRU cache with O(1) get and O(1) eviction. What do you combine?', o: ['A hash map with a doubly linked list', 'Two arrays', 'A binary search tree'], a: 0,
        why: 'The map gives instant lookup of a node; the list gives instant reordering and eviction from the tail. Neither structure can do both alone.' }],
  },

  avl: {
    t: 'AVL trees', time: 'O(log n) guaranteed', space: 'O(n)',
    idea: 'A search tree that repairs its own shape. After each insert it checks how lopsided each node has become and rotates when the difference reaches two, so the height can never drift toward n.',
    build: avlDemo,
    code: ['insert normally, then on the way back up:', '  b = height(left) - height(right)', '  if b < -1: rotate left', '  if the child leans the other way:', '    rotate the child first', '  # zig-zag becomes a straight line', '  # height is back to about log n'],
    uses: [
      ['Ordered maps that must stay fast', 'Java TreeMap and C++ std::map use red-black trees, a cousin with looser balancing but the same purpose: stop the tree degenerating.'],
      ['Database indexes', 'B-trees apply the same self-balancing idea with wide nodes, so an index cannot decay into a scan no matter what order rows arrive in.'],
      ['Anything fed sorted input', 'Timestamps, auto-increment ids and imported data all arrive in order, which is exactly the case that turns an unbalanced tree into a linked list.']],
    quiz: [
      { q: 'What problem do rotations solve?', o: ['Sorting the values', 'Stopping the tree becoming a chain when input arrives in order', 'Saving memory'], a: 1,
        why: 'Without balancing, ascending input gives a tree of height n and every operation degrades to O(n). Rotation is the repair.' },
      { q: 'Does a rotation change which values are in the tree, or their ordering rule?', o: ['Yes, it re-sorts them', 'No, it only changes the shape; the search tree rule still holds', 'It removes duplicates'], a: 1,
        why: 'That is why it is safe. A rotation re-parents three subtrees in a way that preserves left-smaller and right-larger exactly.' },
      { q: 'When does a single rotation not fix the imbalance?', o: ['When the node and its child lean in opposite directions', 'When the tree is large', 'When there are duplicate values'], a: 0,
        why: 'A zig-zag has to be straightened into a line first, which is why the double rotation exists. Recognising the two shapes is the whole of the algorithm.' },
      { q: 'Why might you choose a red-black tree over an AVL tree?', o: ['It is always faster to search', 'It balances less strictly, so inserts do less rotation work', 'It uses no memory'], a: 1,
        why: 'AVL trees are more rigidly balanced, giving slightly faster lookups and slightly slower writes. Standard libraries mostly pick red-black as the middle ground.' }],
  },

  memo: {
    t: 'Memoisation', time: 'O(n) instead of O(2ⁿ)', space: 'O(n)',
    idea: 'Keep the recursion you already wrote, but write each answer down the first time you work it out. Every later request for the same input is a lookup instead of a recomputation.',
    build: memoDemo,
    code: ['def fib(n):', '  if n in memo: return memo[n]', '  # not computed yet', '  v = n if n < 2 else fib(n-1) + fib(n-2)', '  memo[n] = v', '  return v'],
    uses: [
      ['Caching expensive pure functions', 'Python\u2019s functools.cache, React\u2019s useMemo and countless hand-rolled wrappers are this exact idea applied to one function.'],
      ['Parsers and compilers', 'Re-deriving the same sub-expression is the default failure mode of a naive parser, and a memo table is the standard fix.'],
      ['Query and API layers', 'Remembering the result of a call within one request, so ten components asking for the same user cause one fetch, is memoisation with a request-scoped table.']],
    quiz: [
      { q: 'What makes plain recursive fib so slow?', o: ['Recursion is slow in general', 'The same values are recomputed from scratch, exponentially many times', 'It uses too much memory'], a: 1,
        why: 'fib(30) computes fib(10) hundreds of times. The tree of calls is the cost, and the table collapses it.' },
      { q: 'Which functions is it safe to memoise?', o: ['Any function', 'Pure ones, whose output depends only on their arguments', 'Only recursive ones'], a: 1,
        why: 'Memoising something that reads a database or the clock will serve stale answers. This is the most common way the technique goes wrong in production.' },
      { q: 'What is the cost of memoisation?', o: ['Nothing', 'Memory for the table, which grows with the number of distinct inputs', 'Correctness'], a: 1,
        why: 'An unbounded cache on a function with many distinct arguments is a memory leak. Real caches have size limits and eviction for this reason.' },
      { q: 'Memoised recursion on a very large input still crashes. Why?', o: ['The table is too small', 'The recursion depth still grows with n, and the call stack is finite', 'Memoisation does not work'], a: 1,
        why: 'The table fixes repeated work, not depth. That is exactly the problem tabulation solves by removing recursion altogether.' }],
  },

  tabulation: {
    t: 'Tabulation', time: 'O(n)', space: 'O(n), often O(1)',
    idea: 'Solve the same problem from the bottom up. Start with the smallest cases, fill a table forward, and each entry only needs answers already sitting to its left. No recursion at all.',
    build: tabulationDemo,
    code: ['table[0] = 0', 'table[1] = 1', 'for i in range(2, n + 1):', '  # both inputs are already known', '  table[i] = table[i-1] + table[i-2]', 'return table[n]'],
    uses: [
      ['Anything with an input size you cannot bound', 'No call stack means no stack overflow, which matters when n comes from user data.'],
      ['Hot paths where overhead counts', 'A flat loop over an array beats recursive calls and hash lookups, so library implementations of DP are almost always tabulated.'],
      ['Rolling-window state', 'Once you notice each row only needs the previous one, the table collapses to two variables and the space cost disappears.']],
    quiz: [
      { q: 'What is the practical difference between memoisation and tabulation?', o: ['They solve different problems', 'Direction: one fills the table top down through recursion, the other bottom up with a loop', 'Tabulation is always correct'], a: 1,
        why: 'Same subproblems, same table, opposite order. Choosing between them is an engineering decision, not a correctness one.' },
      { q: 'Why can tabulation not overflow the stack?', o: ['It uses less memory', 'There is no recursion, just a loop', 'It is compiled differently'], a: 1,
        why: 'This is the main reason to convert a working memoised solution once it goes to production with unbounded input.' },
      { q: 'This fib table could use O(1) space. How?', o: ['Store only the last two values, since nothing older is ever read', 'Compress the array', 'Use recursion'], a: 0,
        why: 'Spotting how far back a recurrence actually reaches is the standard space optimisation, and it applies to a great many DP problems.' },
      { q: 'When is memoisation the better choice despite the stack risk?', o: ['Never', 'When only a small part of the table is ever needed, so filling it all would be waste', 'When n is large'], a: 1,
        why: 'Top-down computes only the subproblems actually reached. On a sparse state space that can be far less work than filling every cell.' }],
  },

  dp: {
    t: 'Dynamic programming', time: 'O(items × capacity)', space: 'O(items × capacity)',
    idea: 'Break a problem into overlapping subproblems, solve each once and store the answer. Here each cell asks: with only these items and this much space, what is the best value achievable?',
    build: knapsack,
    code: ['for each item i:', '  for each capacity c:', '    # too heavy, carry the row above down', '    if weight[i] > c: T[i][c] = T[i-1][c]', '    else: T[i][c] = max(T[i-1][c],', '                        value[i] + T[i-1][c-weight[i]])'],
    uses: [
      ['Diff and merge tools', 'git diff, editor merges and DNA sequence alignment all fill a grid comparing two sequences, using the same take-or-skip shape.'],
      ['Resource allocation and scheduling', 'Budget under a cap, jobs under a deadline, cargo under a weight limit: knapsack with the words changed.'],
      ['Autocorrect and fuzzy matching', 'Edit distance is a DP grid, and it sits under spell check, search suggestions and record deduplication.']],
    quiz: [
      { q: 'What must be true of a problem before DP applies?', o: ['It must be sortable', 'Its subproblems must overlap and its optimal answer must be built from optimal subanswers', 'It must be recursive'], a: 1,
        why: 'No overlap means nothing is reused and plain recursion is already fine. Those two properties are the actual test, not the presence of a grid.' },
      { q: 'Each cell here is filled from which cells?', o: ['The whole row above', 'One cell directly above and one above-left by the item\u2019s weight', 'Any cell in the table'], a: 1,
        why: 'Skip means copy from above; take means add this value to the cell for the remaining capacity. Two lookups, constant work per cell.' },
      { q: 'Why does greedily taking the highest value per kilo not always work here?', o: ['It is too slow', 'Items are indivisible, so a locally good choice can block a better combination', 'It needs sorted input'], a: 1,
        why: 'That heuristic is optimal for the fractional version, where items can be cut. The 0/1 constraint is what forces DP.' },
      { q: 'How do you recover which items were chosen, not just the best value?', o: ['Store the choice in every cell', 'Walk backwards through the table comparing each cell with the one above it', 'Run it again greedily'], a: 1,
        why: 'A difference means the item on that row was taken. Reconstructing the answer from the table is usually the part people forget to implement.' }],
  },

  greedy: {
    t: 'Greedy algorithms', time: 'usually O(n log n)', space: 'O(1)',
    idea: 'Take the best-looking option at every step and never reconsider. It is simple, fast and sometimes provably optimal. When it is not, the failure is silent and plausible.',
    build: greedyDemo,
    code: ['while target > 0:', '  take the largest coin that fits', '  # commit, never reconsider', 'return coins'],
    uses: [
      ['Scheduling by earliest finishing time', 'Fitting the most meetings into a room is a greedy choice that is provably optimal, and the proof is the reason to trust it.'],
      ['Huffman coding', 'Repeatedly merging the two least frequent symbols builds the optimal prefix code, which is how compression formats assign short codes to common bytes.'],
      ['Minimum spanning trees', 'Prim and Kruskal are greedy and provably correct, which is why they are the standard answer for cheapest-network problems.']],
    quiz: [
      { q: 'What defines a greedy algorithm?', o: ['It is fast', 'It makes the locally best choice at each step and never revisits it', 'It always finds the optimum'], a: 1,
        why: 'Committing immediately is the definition. Whether that reaches the optimum depends entirely on the problem.' },
      { q: 'Greedy gave 4 + 1 + 1 for a target of 6 with coins 1, 3 and 4. Why did it miss 3 + 3?', o: ['A bug in the loop', 'Taking the 4 first made the better combination unreachable, and greedy never backtracks', 'The coins were unsorted'], a: 1,
        why: 'The algorithm is behaving correctly. The mistake would be assuming that correct behaviour implies an optimal answer.' },
      { q: 'How do you know whether greedy is safe for a given problem?', o: ['Test it on examples', 'You need a proof that the local choice is always part of some optimal solution', 'It is always safe'], a: 1,
        why: 'Examples are exactly how this bug reaches production: the common cases pass. Prim, Kruskal and Huffman are trusted because the proofs exist.' },
      { q: 'When would you use greedy over dynamic programming?', o: ['When it is proven correct for the problem, since it is simpler and cheaper', 'Always', 'Only on small inputs'], a: 0,
        why: 'Greedy is O(n log n) and needs no table; DP costs time and memory proportional to the state space. Take the cheap one when it is justified.' }],
  },
};

/* ---------- supporting content ---------- */

export const EXTRA_STDLIB = {
  heap: { calls: [
      ['Python', 'import heapq; heapq.heappush(h, x); heapq.heappop(h)', 'A min-heap over a plain list. Push tuples like (priority, item).'],
      ['Java', 'new PriorityQueue<>(Comparator.comparingInt(Task::priority))', 'Min-heap by default.'],
      ['JavaScript', '\u2014', 'No built-in. This is one you legitimately write or take from a library.'],
      ['C++', 'std::priority_queue<T>', 'Max-heap by default; pass std::greater<> for a min-heap.']],
    costs: [['push / pop', 'O(log n)'], ['peek the extreme', 'O(1)'], ['find an arbitrary value', 'O(n)']],
    gotcha: 'heapq.nlargest and nsmallest exist for top-k and are usually what you actually want. Reach for the raw heap only when items arrive over time.' },

  counting: { calls: [
      ['Python', 'collections.Counter(xs)', 'The counting half, without the output pass. Usually all you need.'],
      ['Any language', 'the library sort', 'Counting sort is almost never written by hand in application code.'],
      ['NumPy', 'np.bincount(arr)', 'Exactly the counts array from the lesson, vectorised.']],
    costs: [['Counting sort', 'O(n + k)'], ['Memory', 'O(k), one counter per possible value']],
    gotcha: 'The moment the value range is large or the keys are not integers, this degrades badly. Check k before reaching for it.' },

  radix: { calls: [
      ['Python', 'sorted(xs)', 'Timsort is the right default; radix is a specialist.'],
      ['C++', 'boost::sort::spreadsort', 'A tuned radix-style sort for when profiling shows the library sort is the bottleneck.'],
      ['GPU / CUDA', 'cub::DeviceRadixSort, thrust::sort', 'Radix is the standard parallel sort on graphics hardware.']],
    costs: [['Radix sort', 'O(d × n)'], ['Memory', 'O(n + k) per pass']],
    gotcha: 'Negative numbers and floats need special handling because their bit patterns do not order the way you expect. Library implementations handle it; hand-rolled ones usually do not.' },

  linkedlist: { calls: [
      ['Python', 'collections.deque', 'A doubly linked structure of blocks: O(1) at both ends, and what you should use instead of list.pop(0).'],
      ['Java', 'LinkedList, or ArrayDeque', 'ArrayDeque is faster for most queue and stack uses despite being array-backed.'],
      ['C++', 'std::list, std::forward_list', 'std::vector usually wins in practice because of cache behaviour.']],
    costs: [['Insert or delete at a known node', 'O(1)'], ['Find a value', 'O(n)'], ['Index access', 'O(n)']],
    gotcha: 'Benchmark before choosing a linked list for performance. Contiguous arrays beat them far more often than the asymptotics suggest, because of how memory is fetched.' },

  avl: { calls: [
      ['Java', 'new TreeMap<>()', 'Red-black tree, self-balancing, ordered iteration.'],
      ['C++', 'std::map, std::set', 'Also red-black. Balanced by construction.'],
      ['Python', 'sortedcontainers.SortedDict', 'Not a tree internally, but it gives you the ordered-map behaviour Python lacks.']],
    costs: [['get / put / delete', 'O(log n) guaranteed'], ['Rotation', 'O(1), a few pointer assignments']],
    gotcha: 'You will almost never implement one. What you need is to recognise when an ordered structure is required, and to know that the library version cannot degrade the way a hand-rolled BST can.' },

  memo: { calls: [
      ['Python', 'from functools import cache; @cache', 'One decorator. Use lru_cache(maxsize=n) when the input space is unbounded.'],
      ['JavaScript', 'a Map keyed by the arguments', 'React\u2019s useMemo and useCallback are the component-scoped version.'],
      ['Java', 'computeIfAbsent on a HashMap', 'The idiomatic memo table.']],
    costs: [['Cached call', 'O(1) lookup'], ['Memory', 'O(distinct inputs)']],
    gotcha: 'Only memoise pure functions, and bound the cache. An unbounded cache on a function with many distinct arguments is a memory leak that looks like a performance fix.' },

  tabulation: { calls: [
      ['Any language', 'an array and a loop', 'That is genuinely all it is.'],
      ['Python', 'prev, cur = cur, prev + cur', 'The rolling-variable form once you notice only the last row is needed.']],
    costs: [['Fill the table', 'O(states)'], ['Memory', 'O(states), often reducible to O(1)']],
    gotcha: 'Write it memoised first to get the recurrence right, then convert to a loop if depth or speed demands it. Going straight to tabulation is where the off-by-one bugs come from.' },

  dp: { calls: [
      ['Python', 'difflib.SequenceMatcher', 'Diffing, built on the same grid.'],
      ['Libraries', 'python-Levenshtein, Apache Commons Text', 'Edit distance is DP and is already written.'],
      ['Any language', 'a 2-D array and two nested loops', 'The general shape.']],
    costs: [['Knapsack', 'O(items × capacity)'], ['Edit distance', 'O(n × m)'], ['Space', 'often reducible to one row']],
    gotcha: 'O(items × capacity) is pseudo-polynomial: it grows with the numeric value of the capacity, not its digit count. A capacity of a billion is intractable even with ten items.' },

  greedy: { calls: [
      ['Python', 'sorted(jobs, key=...)  then one pass', 'Nearly every greedy algorithm is a sort followed by a single loop.'],
      ['Libraries', 'networkx.minimum_spanning_tree', 'Kruskal and Prim, already correct.'],
      ['Compression', 'zlib, brotli', 'Huffman coding, greedy and provably optimal, runs inside all of these.']],
    costs: [['Typical greedy', 'O(n log n), dominated by the sort'], ['Space', 'O(1) beyond the input']],
    gotcha: 'The danger is not that greedy is slow, it is that it returns a plausible wrong answer with no error. If you cannot state why the local choice is safe, treat the result as a guess.' },
};

export const EXTRA_DETAIL = {
  heap: [
    'A CI system has forty queued builds and three runners. Pull requests to main should go before nightly jobs, and a hotfix should go before everything. A plain queue cannot express that, and re-sorting forty items every time a build is submitted is wasted work. A heap keeps only the promise that matters: the next item out is the most urgent. Adding a build costs one walk up the tree, taking the next costs one walk down, and nothing else is ever ordered. Schedulers, message brokers with priority, and operating system run queues all sit on this.',
    'In the Dijkstra lesson, the step that finds the cheapest unvisited node scans every node to do it. On a graph with a million nodes that scan happens a million times, which is a trillion operations. Replace the scan with a heap and each of those steps costs log n instead of n, taking the whole algorithm from O(V²) to O(E log V). For a road network that is the difference between a query that never finishes and one that returns in milliseconds. The algorithm did not change; the structure holding the frontier did.',
    'You are processing a billion-row log and want the thousand slowest requests. Sorting the whole file means holding a billion rows and paying n log n. Instead keep a heap of size one thousand: for each row, if it is slower than the fastest row in your heap, drop that one and insert this. Memory stays fixed at a thousand rows no matter how long the stream runs, and each row costs about ten comparisons. This is the standard shape for top-k over data that does not fit in memory.',
  ],
  counting: [
    'A report groups ten million orders by status, where status is one of six values. You do not need them sorted; you need a tally. Counting them into six slots is one pass with no comparisons, and the counts are the answer. Most of the time in real code this is where counting sort appears: the counting half, without the rearranging half. GROUP BY on a low-cardinality column does something very close to this internally, which is why it is so much faster than grouping on a high-cardinality one.',
    'Radix sort works by sorting on one digit at a time, and each of those passes is a counting sort over ten buckets. That is the main way the algorithm earns its keep in production: as a component, not as the thing you call. It also explains why the stability detail matters so much. If the counting pass did not preserve the order of equal digits, the earlier passes would be undone and radix sort would produce garbage.',
    'A photograph is millions of pixels, each an integer from 0 to 255. That is exactly the shape counting sort wants: many values, a small known range. Building a histogram of brightness is the counting pass. Operations like histogram equalisation, which spreads out contrast, then use the cumulative counts in the same way the algorithm uses them to work out where each value belongs. Image pipelines lean on this constantly because the preconditions always hold.',
  ],
  radix: [
    'Analytical databases store each column separately and spend much of their time sorting large runs of fixed-width values: timestamps, integer ids, prices in cents. Those keys are exactly what radix sort wants, and engines such as ClickHouse and DuckDB include radix or radix-hybrid sorts for them. The gain is real but narrow. On the same engine, sorting a variable-length text column falls back to a comparison sort, because the number of passes would grow with the longest string.',
    'Graphics hardware runs thousands of threads that do best when they all execute the same instruction. A comparison sort is full of data-dependent branches, which is the worst possible shape for that. Radix sort has none: every element goes through the same digit extraction and the same bucket increment. That is why cub::DeviceRadixSort and thrust::sort use it, and why sorting a hundred million keys on a GPU is routine while doing the same with a branchy algorithm is not.',
    'Full-text search needs to know, for every position in a document, where that suffix falls in sorted order. Building that index for a large corpus means sorting an enormous number of fixed-width keys, and radix-style passes are the standard approach. The same structure sits under several compression formats. You will not write this yourself, but it explains why a search index takes minutes to build and then answers queries instantly.',
  ],
  linkedlist: [
    'When you use collections.deque in Python or ArrayDeque in Java, you are using a structure that can add and remove at both ends in constant time. A plain array cannot: removing the front means shifting every remaining element left. That is the whole reason the queue lesson warns against list.pop(0). The linked structure is not something you build, but knowing what it does explains the advice, and advice you understand is advice you follow correctly in situations nobody warned you about.',
    'An LRU cache must do two things fast: find an entry by key, and move the entry it just used to the front so the least recently used one falls off the end. A hash map does the first and cannot do the second, because it has no order. A linked list does the second and cannot do the first, because finding takes a scan. Combining them gives both: the map stores key to node, and the node can be unlinked and relinked in constant time because it already knows its neighbours. Nearly every LRU implementation you will read is this pair.',
    'Inside a hash map, the entries that collide into the same bucket are kept as a small linked list. Inside a memory allocator, the blocks that are free form another one. In both cases the list is short, is walked from the start, and gains from cheap insertion and removal in the middle. This is the natural habitat of the linked list in real systems: a small internal detail of a larger structure, rather than something an application chooses directly.',
  ],
  avl: [
    'Standard library ordered maps such as Java TreeMap and C++ std::map use red-black trees, which balance slightly more loosely than AVL but exist for the same reason. Without balancing, a map built by inserting rows in id order would be a chain, and every lookup would walk the whole thing. Because the library balances for you, TreeMap gives a guarantee a hand-written BST cannot: O(log n) no matter what order data arrives in. That guarantee, not the rotations, is what you are buying.',
    'Database indexes face the same threat and it is worse there, because inserts genuinely do arrive in order: auto-increment primary keys, timestamps on new rows, imported data sorted by the exporter. A B-tree applies the same self-balancing idea with nodes wide enough to match a disk page. The practical consequence is that an index cannot silently decay into a scan, which is exactly what would happen with an unbalanced structure fed a month of ascending timestamps.',
    'The failure mode this prevents is quiet and it appears in testing as nothing at all. Random test data builds a reasonably balanced tree and everything looks fine. Production data arrives sorted, the tree becomes a chain, and performance degrades in proportion to how long the system has been running. By the time it is slow enough to notice, the shape is far from the code that caused it. This is the single strongest argument for using the balanced structure your library already ships.',
  ],
  memo: [
    'Decorate a function with @cache in Python and every call with arguments seen before returns instantly from a dictionary. It is the technique in one line. The same idea appears as useMemo in React, keeping an expensive computation from re-running on every render, and as computeIfAbsent in Java. Recognising the pattern matters more than the syntax: whenever you notice a function being called repeatedly with the same arguments, you are looking at a memoisation opportunity.',
    'A parser that re-derives the same sub-expression every time it encounters it can take exponential time on quite ordinary input. Packrat parsing is the memoised version: each position and rule is recorded once, which makes the parse linear. The same shape appears in build systems, which cache the result of compiling a file by its content hash, so a rebuild only touches what actually changed. Both are the fib table with a different key.',
    'Within a single web request, ten components might each ask for the current user. Without a memo table that is ten database round trips for identical data. With a request-scoped cache it is one, and the other nine are dictionary lookups. The scope matters: cache for the whole process and you will serve stale data after the user updates their profile. This is the practical form of the rule that only pure functions are safe to memoise, and where the scope ends is what makes a call pure enough.',
  ],
  tabulation: [
    'A memoised solution still recurses, and recursion depth grows with the input. Python stops at about a thousand frames by default, and raising the limit only moves the cliff. If n comes from a file a user uploaded, you cannot bound it. Converting to a loop removes the failure entirely: the table is on the heap, which is orders of magnitude larger, and depth stops being a concept. This conversion is a routine step when a working prototype goes to production.',
    'Recursive calls cost stack frames and dictionary lookups cost hashing. A flat loop over an array does neither, and walks memory in the order the CPU predicts. When the same DP runs millions of times in a hot path, that difference is several times the running time even though both versions are the same complexity class. This is why library implementations of edit distance and similar algorithms are almost always tabulated.',
    'Look at the fib table and notice that when computing position 8 you only ever read positions 7 and 6. Positions 0 through 5 are dead weight. Keep two variables instead of an array and the memory cost vanishes, turning O(n) space into O(1). The same observation applies widely: if each row of a DP grid only reads the previous row, you need two rows, not the whole grid. Spotting how far back the recurrence reaches is the standard space optimisation.',
  ],
  dp: [
    'When git shows you a diff, it is solving the problem of finding the smallest set of edits that turns one file into another. That is a grid where one file runs along the top and the other down the side, and each cell holds the best answer for the prefixes that meet there. Sequence alignment in bioinformatics uses the identical structure to compare DNA. The take-or-skip shape you filled in the knapsack table is the same decision, phrased as keep-this-line or edit-it.',
    'A team has a fixed budget and a list of projects, each with a cost and an expected return, and projects cannot be done halfway. That is the knapsack table with the words changed. So is choosing which jobs fit before a deadline, and which cargo fits in a container. Recognising the shape is the valuable skill, because once you see it the algorithm is already written and the only work is deciding what the rows, columns and cell values mean.',
    'Autocorrect needs to know how close a typed word is to each dictionary candidate. Edit distance answers that by filling a grid where each cell is the cheapest way to turn one prefix into another, using insert, delete or substitute. Search suggestions, fuzzy record matching when deduplicating customer data, and plagiarism detection all run this. It is probably the DP algorithm you will actually encounter, and it is worth being able to recognise the grid when you see one.',
  ],
  greedy: [
    'A single room and a list of meeting requests, each with a start and an end time. Fit in as many as possible. The greedy rule is to repeatedly take the meeting that finishes earliest among those that still fit, and it is provably optimal. The proof is short: whatever the best schedule is, swapping its first meeting for the earliest-finishing one cannot make things worse, and the argument repeats. That proof is why you can trust the answer, and its absence is why you cannot trust greedy coin change with arbitrary denominations.',
    'Compression assigns short bit patterns to common bytes and long ones to rare bytes. Huffman coding builds that assignment greedily: repeatedly merge the two least frequent symbols into one node, and the tree that results is provably the best possible prefix code for those frequencies. It runs inside zip, gzip and JPEG. Again the value is not the greed, it is the proof: someone established that the local choice is always part of an optimal answer, so the simple algorithm is safe.',
    'Connecting a set of sites with cable at the lowest total cost is a minimum spanning tree, and both standard solutions are greedy. Kruskal repeatedly takes the cheapest edge that does not form a cycle; Prim grows one tree by always taking the cheapest edge leaving it. Both are provably optimal, and both appear in network design, clustering and circuit layout. The pattern to take from all three examples: greedy is trustworthy exactly when someone has proved the local choice is safe, and a guess otherwise.',
  ],
};

/* Counting and radix make zero comparisons, so they are deliberately absent
   from the complexity lab: a flat line at zero on a comparison chart would
   read as a bug rather than as the point. */

export const EXTRA_PRACTICE = {
  counting: {
    sig: 'sort(a)',
    brief: 'Sort ascending without comparing any two values. Every value is an integer from 0 to 9. Count them, then write the output back with a.set.',
    starter: 'function sort(a) {\n  const counts = new Array(10).fill(0);\n  for (let i = 0; i < a.length; i++) {\n    // tally a.get(i)\n  }\n  let k = 0;\n  // walk the counts and write values back with a.set\n}',
    ref(a) {
      const counts = new Array(10).fill(0);
      for (let i = 0; i < a.length; i++) counts[a.get(i)]++;
      let k = 0;
      for (let v = 0; v < 10; v++) for (let c = 0; c < counts[v]; c++) a.set(k++, v);
    },
    check: 'sorted', range: [0, 9],
  },
};
