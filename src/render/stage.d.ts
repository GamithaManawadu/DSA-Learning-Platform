import type { Frame } from '../types';
export function setStage(el: HTMLElement, vertical?: boolean): void;
export function mountFrames(frames: Frame[]): void;
export function draw(frame: Frame): void;
