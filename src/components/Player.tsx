import { useCallback, useEffect, useRef, useState } from 'react';
// @ts-ignore - plain JS engine module
import { mountFrames, draw, setStage } from '../render/stage.js';
import type { Frame } from '../types';

/* The renderers carried over from the prototype are imperative: they create
   the cells once and then move them, which is what makes swaps animate. Rather
   than rewrite that as React state, the Stage owns a div and lets the renderer
   work inside it. React manages everything around the stage; the renderer
   manages what is in it. */

export function useFrames(build: (() => Frame[]) | null, deps: unknown[]) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (build) setFrames(build());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);
  return { frames, rebuild: () => setNonce((n) => n + 1) };
}

export function usePlayer(frames: Frame[]) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(650);

  useEffect(() => setIdx(0), [frames]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setIdx((i) => {
        if (i >= frames.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, speed);
    return () => clearInterval(t);
  }, [playing, speed, frames.length]);

  const step = useCallback((d: number) => { setPlaying(false); setIdx((i) => Math.max(0, Math.min(frames.length - 1, i + d))); }, [frames.length]);
  const seek = useCallback((i: number) => { setPlaying(false); setIdx(Math.max(0, Math.min(frames.length - 1, i))); }, [frames.length]);
  const toggle = useCallback(() => {
    setPlaying((p) => { if (!p && idx >= frames.length - 1) setIdx(0); return !p; });
  }, [idx, frames.length]);

  return { idx, playing, speed, setSpeed, step, seek, toggle, atEnd: idx >= frames.length - 1 && frames.length > 0 };
}

export function Stage({ frames, idx, vertical }: { frames: Frame[]; idx: number; vertical?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !frames.length) return;
    setStage(ref.current, vertical);
    mountFrames(frames);
    draw(frames[0]);
    const onResize = () => { if (!ref.current) return; setStage(ref.current, vertical); mountFrames(frames); draw(frames[Math.min(idx, frames.length - 1)]); };
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, vertical]);

  useEffect(() => {
    if (!ref.current || !frames.length) return;
    setStage(ref.current, vertical);
    draw(frames[Math.min(idx, frames.length - 1)]);
  }, [idx, frames, vertical]);

  return <div className="stage" ref={ref} />;
}

export function Controls({
  frames, idx, playing, speed, onStep, onSeek, onToggle, onSpeed, onShuffle,
}: {
  frames: Frame[]; idx: number; playing: boolean; speed: number;
  onStep: (d: number) => void; onSeek: (i: number) => void; onToggle: () => void;
  onSpeed: (n: number) => void; onShuffle?: () => void;
}) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); onStep(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onStep(-1); }
      if (e.key === ' ') { e.preventDefault(); onToggle(); }
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [onStep, onToggle]);

  return (
    <div className="controls">
      <button onClick={() => onStep(-1)} disabled={idx === 0}>Step back</button>
      <button className="primary" onClick={onToggle}>{playing ? 'Pause' : 'Play'}</button>
      <button onClick={() => onStep(1)} disabled={idx >= frames.length - 1}>Step forward</button>
      <input type="range" min={0} max={Math.max(0, frames.length - 1)} value={idx}
             onChange={(e) => onSeek(+e.target.value)} aria-label="Scrub through steps" />
      <span className="count">{frames.length ? idx + 1 : 0} / {frames.length}</span>
      <select value={speed} onChange={(e) => onSpeed(+e.target.value)} aria-label="Speed">
        <option value={1100}>Slow</option>
        <option value={650}>Normal</option>
        <option value={280}>Fast</option>
      </select>
      {onShuffle && <button onClick={onShuffle}>New input</button>}
    </div>
  );
}

export function CodePanel({ code, line }: { code: string[]; line: number }) {
  return (
    <div className="card">
      <h3>The code that is running</h3>
      <pre>{code.map((c, i) => (
        <span key={i} className={'ln' + (i === line ? ' on' : '')}>{c || ' '}</span>
      ))}</pre>
    </div>
  );
}

export function WatchPanel({ watch }: { watch?: [string, string | number][] }) {
  const rows = watch && watch.length ? watch : ([['—', 'nothing yet']] as [string, string][]);
  return (
    <div className="card">
      <h3>What the computer is holding</h3>
      <dl className="watch">
        {rows.map(([k, v], i) => (
          <div key={i} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}
