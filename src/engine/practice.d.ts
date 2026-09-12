import type { PracticeChallenge } from '../types';
export class Tape {
  constructor(vals: number[]);
  a: number[];
  ops: string[];
  readonly length: number;
  get(i: number): number;
  set(i: number, v: number): void;
  swap(i: number, j: number): void;
}
export const PRACTICE: Record<string, PracticeChallenge>;
