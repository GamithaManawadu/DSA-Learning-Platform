/* Shared domain types. The engine modules are plain JS carried over from the
   prototype, so they are declared here rather than annotated in place. */

export type FrameKind = 'array' | 'linear' | 'buckets' | 'tree' | 'graph';

export interface Frame {
  kind: FrameKind;
  note: string;
  line: number;
  watch?: [string, string | number][];
  [k: string]: unknown;
}

export interface Question {
  q: string;
  o: string[];
  a: number;
  why: string;
}

export interface Lesson {
  t: string;
  time: string;
  space: string;
  idea: string;
  build: () => Frame[];
  code: string[];
  uses: [string, string][];
  quiz: Question[];
}

export interface Bug {
  id: string;
  t: string;
  time: string;
  space: string;
  idea: string;
  build: () => Frame[];
  code: string[];
  q: Question;
}

export interface StdlibEntry {
  calls: [string, string, string][];
  costs: [string, string][];
  gotcha: string;
}

export interface PracticeChallenge {
  sig: string;
  brief: string;
  starter: string;
  check: 'sorted' | 'index' | 'tree' | 'bfs';
  sorted?: boolean;
  ref?: (...args: never[]) => unknown;
  saved?: string;
}

export type CurriculumGroup = [string, [string, string | null][]];

export interface Verdict {
  kind: 'good' | 'bad' | 'warn';
  title: string;
  detail?: string;
  trace?: { mine: string[]; ref: string[]; at: number; mineLen: number; refLen: number };
}
