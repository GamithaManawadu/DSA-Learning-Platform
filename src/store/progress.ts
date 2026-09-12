/* Progress and spaced repetition.
   Everything a learner accumulates lives here: which topics they finished,
   which questions they have answered, and when each question is next due.

   Scheduling is a deliberately small SM-2 variant. A correct answer advances
   the item one step along INTERVALS; a wrong answer sends it back to the start.
   That is enough to keep missed material circulating without pretending to be
   a full flashcard system. */

const KEY = 'dsa-platform:v1';
const DAY = 86_400_000;
export const INTERVALS = [0, 1, 3, 7, 21, 60]; // days until the next review

export interface ReviewItem {
  id: string;          // stable key: source + question text
  src: string;         // 'lesson:bubble' | 'drill' | 'debug'
  box: number;         // index into INTERVALS
  due: number;         // epoch ms
  seen: number;
  missed: number;
  last: number;
}

interface State {
  completed: Record<string, number>;   // lesson id -> epoch ms first finished
  practiceSolved: Record<string, number>;
  savedCode: Record<string, string>;
  review: Record<string, ReviewItem>;
}

const empty: State = { completed: {}, practiceSolved: {}, savedCode: {}, review: {} };

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(empty);
    return { ...structuredClone(empty), ...JSON.parse(raw) };
  } catch {
    return structuredClone(empty);
  }
}

let state: State = read();
const listeners = new Set<() => void>();

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private browsing, quota, or a file:// origin. Progress stays in memory. */
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const get = () => state;

export function markComplete(lessonId: string) {
  if (state.completed[lessonId]) return;
  state.completed[lessonId] = Date.now();
  commit();
}

export function markPracticeSolved(id: string) {
  if (state.practiceSolved[id]) return;
  state.practiceSolved[id] = Date.now();
  commit();
}

export function saveCode(id: string, code: string) {
  state.savedCode[id] = code;
  commit();
}

export const loadCode = (id: string) => state.savedCode[id];

export function keyFor(src: string, questionText: string) {
  return src + '::' + questionText.slice(0, 90);
}

export function recordAnswer(src: string, questionText: string, correct: boolean) {
  const id = keyFor(src, questionText);
  const now = Date.now();
  const prev = state.review[id];
  const box = correct ? Math.min((prev?.box ?? 0) + 1, INTERVALS.length - 1) : 0;
  state.review[id] = {
    id,
    src,
    box,
    due: now + INTERVALS[box] * DAY,
    seen: (prev?.seen ?? 0) + 1,
    missed: (prev?.missed ?? 0) + (correct ? 0 : 1),
    last: now,
  };
  commit();
}

/** Items whose review date has arrived, hardest and oldest first. */
export function due(now = Date.now()): ReviewItem[] {
  return Object.values(state.review)
    .filter((r) => r.due <= now)
    .sort((a, b) => b.missed - a.missed || a.due - b.due);
}

export function stats() {
  const all = Object.values(state.review);
  return {
    answered: all.length,
    shaky: all.filter((r) => r.box === 0).length,
    solid: all.filter((r) => r.box >= 3).length,
    dueNow: due().length,
    lessonsDone: Object.keys(state.completed).length,
    practiceDone: Object.keys(state.practiceSolved).length,
  };
}

export function reset() {
  state = structuredClone(empty);
  commit();
}
