# DSA, one step at a time

An interactive platform for learning data structures and algorithms, built around the idea that
**every algorithm compiles to an array of frames**. Each frame is a complete snapshot - the data, what is
being compared, the line of code executing, the variables in scope, and a plain-English sentence about why
this step happened. Stepping, rewinding and scrubbing are all just `render(frames[i])`.

That one decision is what makes the rest possible: the debug challenges reuse the player, the practice
grader diffs a learner's operation trace against the reference, and the complexity lab counts the same
comparisons the animation shows.

**Live site:** [dsa-learn-platform.netlify.app](https://dsa-learn-platform.netlify.app/)

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # content correctness gate
npm run typecheck
npm run build
```

## What is here

| Route                          | What it does                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `#/path`                       | Progress across the syllabus, and a suggested order                                                           |
| `#/learn/:id`                  | Stepper, narration, code highlight, variable watch, production use cases, standard-library mapping, questions |
| `#/practice/:id`               | Editor, sandboxed run, correctness on random inputs, trace diff against the reference                         |
| `#/lab`                        | Measured comparison counts from n = 10 to n = 1000                                                            |
| `#/debug` and `#/debug/:bugId` | Deliberately broken implementations loaded into the player                                                    |
| `#/drills`                     | Cross-topic "which tool would you pick" scenarios                                                             |
| `#/review`                     | Spaced repetition over everything answered anywhere in the app                                                |

26 topics, and every entry in the sidebar opens a working lesson. Nothing is listed that is not built.

The set does not match the W3Schools syllabus exactly. Several pages there are theory introductions that the
lessons cover inline, and the whole Time complexity chapter is better served by the Measure it lab. Going the
other way, heaps and priority queues are missing from that syllabus and matter more in production than some of
what it does include, so they are here.

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

### The four-question contract

Each topic's questions target a different failure mode, in this order:

1. **Mechanism** - what the visualization just showed
2. **Cost** - where the complexity comes from, not what it is called
3. **Edge case** - what breaks it
4. **Judgement** - given a real situation, would you pick this

## Roadmap

Nothing below is in the app yet, by design. The sidebar shows only what works.

1. **Tries** - autocomplete and prefix search; needs a compact tree layout
2. **Union-find** - the missing half of Kruskal, and the standard cycle-detection tool
3. **Sliding window and two pointers** - patterns rather than structures, but they appear constantly
4. **LRU cache** - combines the hash map and linked-list lessons into one build-it-yourself exercise
5. **MST and max flow** - existing graph renderer, new builders only
6. **Free-text recall** - an "explain it back" box graded by a model. Multiple choice is the weakest part of
   the assessment layer

## Known limits

- Progress is per-device (`localStorage`). Accounts and sync are not built.
- The practice sandbox accepts JavaScript only, even though the lessons show Python-style pseudocode.
- Trace diffing exists for the seven array challenges; the tree and graph challenges are correctness-only.
- Review intervals are fixed (1, 3, 7, 21, 60 days) rather than adapting to per-item difficulty.
