import { useEffect, useState } from 'react';
// @ts-ignore
import { L } from '../engine/lessons.js';
// @ts-ignore
import { USE_DETAIL } from '../engine/useDetail.js';
// @ts-ignore
import { STDLIB } from '../engine/stdlib.js';
// @ts-ignore
import { BUGS } from '../engine/bugs.js';
import { Stage, Controls, CodePanel, WatchPanel, usePlayer, useFrames } from '../components/Player';
import { Questions, Sheet } from '../components/Shared';
import * as store from '../store/progress';
import type { Bug, Lesson, StdlibEntry } from '../types';

export function Learn({ id, bugId, onLeaveBug }: { id: string; bugId?: string; onLeaveBug: () => void }) {
  const bug: Bug | undefined = bugId ? BUGS.find((b: Bug) => b.id === bugId) : undefined;
  const lesson: Lesson = L[id];
  const subject = bug ?? lesson;

  const { frames, rebuild } = useFrames(subject.build, [subject]);
  const p = usePlayer(frames);
  const [sheet, setSheet] = useState<{ title: string; lead: string; body: string } | null>(null);

  const frame = frames[Math.min(p.idx, frames.length - 1)];

  useEffect(() => { if (!bug && p.atEnd) store.markComplete(id); }, [p.atEnd, id, bug]);

  const std: StdlibEntry | undefined = bug ? undefined : STDLIB[id];

  return (
    <section className="view">
      {bug && (
        <div className="banner">
          Debug challenge. This code is deliberately broken.
          <button onClick={onLeaveBug}>Back to the working version</button>
        </div>
      )}

      <div className="head">
        <h2>{subject.t}</h2>
        <span className="chip">time {subject.time}</span>
        <span className="chip">space {subject.space}</span>
      </div>
      <p className="idea">{subject.idea}</p>

      <Stage frames={frames} idx={p.idx} vertical={id === 'stack' && !bug} />
      <p className="note" dangerouslySetInnerHTML={{ __html: frame?.note ?? '' }} />

      <Controls frames={frames} idx={p.idx} playing={p.playing} speed={p.speed}
                onStep={p.step} onSeek={p.seek} onToggle={p.toggle} onSpeed={p.setSpeed}
                onShuffle={bug?.id === 'bug-bfs' ? undefined : rebuild} />

      <div className="lower">
        <CodePanel code={subject.code} line={frame?.line ?? 0} />
        <WatchPanel watch={frame?.watch as [string, string | number][]} />
      </div>

      {!bug && (
        <div className="card uses">
          <h3>Where this runs in production</h3>
          <ul>
            {lesson.uses.map(([where, how], i) => (
              <li key={where}>
                <b>{where}</b><span>{how}</span>
                <button onClick={() => setSheet({
                  title: where, lead: how,
                  body: (USE_DETAIL[id] ?? [])[i] ?? 'No longer explanation written for this one yet.',
                })}>Explain this with an example</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {std && (
        <div className="card api-card">
          <h3>What you would actually write at work</h3>
          <table className="api"><tbody>
            {std.calls.map(([lang, call, note]) => (
              <tr key={lang + call}><th>{lang}</th><td><code>{call}</code>{note && <em>{note}</em>}</td></tr>
            ))}
          </tbody></table>
          <table className="api costs"><tbody>
            {std.costs.map(([o, c]) => <tr key={o}><th>{o}</th><td><code>{c}</code></td></tr>)}
          </tbody></table>
          <p className="gotcha">{std.gotcha}</p>
        </div>
      )}

      {bug
        ? <Questions list={[bug.q]} src="debug" title="What is wrong with it?" />
        : <Questions list={lesson.quiz} src={'lesson:' + id} title="Check yourself" />}

      {sheet && <Sheet {...sheet} onClose={() => setSheet(null)} />}
    </section>
  );
}
