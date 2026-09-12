# DSA, one step at a time

An interactive platform for learning data structures and algorithms, built around the idea that
**every algorithm compiles to an array of frames**. Each frame is a complete snapshot — the data, what is
being compared, the line of code executing, the variables in scope, and a plain-English sentence about why
this step happened. Stepping, rewinding and scrubbing are all just `render(frames[i])`.

That one decision is what makes the rest possible: the debug challenges reuse the player, the practice
grader diffs a learner's operation trace against the reference, and the complexity lab counts the same
comparisons the animation shows.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # content correctness gate
npm run typecheck
npm run build
```

## What is here

| Route | What it does |
|---|---|
| `#/path` | Progress across the syllabus, and a suggested order |
| `#/learn/:id` | Stepper, narration, code highlight, variable watch, production use cases, standard-library mapping, questions |
| `#/practice/:id` | Editor, sandboxed run, correctness on random inputs, trace diff against the reference |
| `#/lab` | Measured comparison counts from n = 10 to n = 1000 |
| `#/debug` and `#/debug/:bugId` | Deliberately broken implementations loaded into the player |
| `#/drills` | Cross-topic "which tool would you pick" scenarios |
| `#/review` | Spaced repetition over everything answered anywhere in the app |

26 topics are built. The sidebar lists the whole W3Schools syllabus plus a **Beyond the syllabus** group,
because that syllabus omits several structures that matter more in production than some of what it includes —
heaps and priority queues most of all.

Recently added: heaps, counting sort, radix sort, linked lists, AVL rotations, memoisation, tabulation,
0/1 knapsack and greedy algorithms with a worked counter-example where greedy gives the wrong answer.

## Architecture

```
src/
  engine/          pure, DOM-free, node-testable
    algorithms.js  frame builders — one function per algorithm
    lessons.js     the lesson table: metadata, code, uses, quiz
    practice.js    Tape (instrumented array) + challenges + reference solutions
    counters.js    lightweight counting versions for the complexity lab
    bugs.js        broken implementations for the debug gallery
    stdlib.js      what to type in Python / Java / JS / C++
    drills.js      cross-topic scenarios
    useDetail.js   long-form explanations behind each use case
    curriculum.js  the full syllabus, built and unbuilt
    *.d.ts         types for the above
    extra.js       the later topics: heaps, counting, radix, linked lists, AVL, the DP arc, greedy
  render/stage.js  imperative renderers (array, linear, buckets, tree, graph, grid, chain)
  components/      Player, Stage, Controls, Questions, Sheet, Rail, Tabs
  views/           Learn, Practice, Lab, DebugList, Drills, Review, Path
  practice/        Web Worker sandbox + runner with a 4s kill switch
  store/progress   localStorage, completion tracking, spaced repetition
```

**Why the renderers stay imperative.** They create the cells once and then move them, which is what makes a
swap animate rather than jump. `<Stage>` owns a div and lets the renderer work inside it; React manages
everything around the stage, the renderer manages what is in it. Rewriting them as React state would cost
the animation and buy nothing.

**Why learner code runs in a Worker.** `new Function` on the main thread means a loop that never touches the
array freezes the tab. The worker is terminated from outside after four seconds, so no loop can hang the page.

## Adding a topic

A lesson is a frame builder plus a table entry. Nothing else.

**1. Write the builder** in `src/engine/algorithms.js`. Push a snapshot at every decision point:

```js
export function countingSort(vals) {
  const a = mkEls(vals), f = [], roles = {};
  f.push(snapArr(a, roles, 'Counting sort never compares two values...', 0, [], []));
  // ... push a frame whenever something changes
  return f;
}
```

Snapshot helpers, one per renderer: `snapArr`, `snapLin`, `snapTree`, `snapGraph`, and the buckets shape
used by `hashDemo`. Every frame needs a `note` (one sentence, plain English, present tense), a `line`
(index into the lesson's `code`), and optionally `watch` rows.

**2. Add the table entry** in `src/engine/lessons.js`:

```js
'counting': {
  t: 'Counting sort', time: 'O(n + k)', space: 'O(k)',
  idea: 'One or two sentences a beginner can hold in their head.',
  build: () => countingSort(DEF_VALS()),
  code: ['for v in a:', '  counts[v] += 1', ...],
  uses: [['Where', 'How, in one line'], ...],   // three of these
  quiz: [{ q, o, a, why }, ...],                 // four: mechanism, cost, edge case, judgement
}
```

**3. Flip the curriculum entry** in `curriculum.js` from `['Counting sort', null]` to
`['Counting sort', 'counting']`.

**4. Optional but recommended:** an entry in `stdlib.js`, three long explanations in `useDetail.js`,
a challenge in `practice.js`, and a counting version in `counters.js`.

**5. Run `npm test`.** For anything with a real algorithm behind it, add a correctness check there too:
the suite brute-forces the knapsack table against all subsets, checks the heap property in the final array,
confirms AVL rotations preserve in-order ordering, and verifies counting and radix sort output is a sorted
permutation of the input.

The gate also checks that The gate checks that the lesson builds frames, every `line` points at a real code
line, sorts actually sort over 100 random inputs, references return correct answers over 60, every answer
index is in range, and the curriculum agrees with the lesson table.

### The four-question contract

Each topic's questions target a different failure mode, in this order:

1. **Mechanism** — what the visualization just showed
2. **Cost** — where the complexity comes from, not what it is called
3. **Edge case** — what breaks it
4. **Judgement** — given a real situation, would you pick this

## Roadmap

1. **Tries** — autocomplete and prefix search; needs a compact tree layout
2. **Union-find** — the missing half of Kruskal, and the standard cycle-detection tool
3. **Sliding window and two pointers** — patterns rather than structures, but they appear constantly
4. **LRU cache** — combines the hash map and linked-list lessons into one build-it-yourself exercise
5. **MST and max flow** — existing graph renderer, new builders only
6. **Free-text recall** — an "explain it back" box graded by a model. Multiple choice is the weakest part of
   the assessment layer

Deliberately excluded: streaks and badges, which optimise for return visits rather than understanding, and a
full multi-language in-browser IDE, which is months of work to duplicate something that already exists.

Counting and radix sort are deliberately absent from the complexity lab. They make zero comparisons, so a
flat line at zero on a comparison chart would read as a bug rather than as the point. The claim is made in
their lessons and tested in `npm test` instead.

## Known limits

- Progress is per-device (`localStorage`). Accounts and sync are not built.
- The practice sandbox accepts JavaScript only, even though the lessons show Python-style pseudocode.
- Trace diffing exists for the seven array challenges; the tree and graph challenges are correctness-only.
- Review intervals are fixed (1, 3, 7, 21, 60 days) rather than adapting to per-item difficulty.
