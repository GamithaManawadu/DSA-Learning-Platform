import { useEffect, useMemo, useState } from 'react';
// @ts-ignore
import { L } from '../engine/lessons.js';
// @ts-ignore
import { PRACTICE } from '../engine/practice.js';
// @ts-ignore
import { COUNTERS, LAB_COLOURS } from '../engine/counters.js';
// @ts-ignore
import { BUGS } from '../engine/bugs.js';
// @ts-ignore
import { DRILLS } from '../engine/drills.js';
// @ts-ignore
import { CURRICULUM } from '../engine/curriculum.js';
// @ts-ignore
import { rnd } from '../engine/algorithms.js';
import { Questions } from '../components/Shared';
import { runInSandbox, type RunResult } from '../practice/runner';
import * as store from '../store/progress';
import { href } from '../router';
import type { Bug, CurriculumGroup, PracticeChallenge, Question } from '../types';

/* ============================ Write it ============================ */

export function Practice({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const ids = Object.keys(PRACTICE);
  const active = PRACTICE[id] ? id : 'bubble';
  const p: PracticeChallenge = PRACTICE[active];
  const [code, setCode] = useState(() => store.loadCode(active) ?? p.starter);
  const [res, setRes] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRef, setShowRef] = useState(false);

  useEffect(() => { setCode(store.loadCode(active) ?? PRACTICE[active].starter); setRes(null); setShowRef(false); }, [active]);

  async function run() {
    setBusy(true); setShowRef(false);
    store.saveCode(active, code);
    const out = await runInSandbox(active, code);
    setRes(out);
    if (out.result && out.result.passed === out.result.cases) store.markPracticeSolved(active);
    setBusy(false);
  }

  const solved = !!store.get().practiceSolved[active];

  return (
    <section className="view">
      <div className="card">
        <h3>Write it yourself</h3>
        <p className="pick">
          {ids.map((k) => (
            <button key={k} className={'chipbtn' + (k === active ? ' on' : '')} onClick={() => onPick(k)}>
              {L[k].t}{store.get().practiceSolved[k] ? ' \u2713' : ''}
            </button>
          ))}
        </p>
        <p className="brief">{p.brief}</p>
        <p className="api-note">
          The array is wrapped so every access can be recorded. Use <code>a.length</code>, <code>a.get(i)</code>,{' '}
          <code>a.set(i, v)</code> and <code>a.swap(i, j)</code> rather than <code>a[i]</code>. Your code runs in a
          worker, so an endless loop is stopped rather than freezing the page.
        </p>
        <textarea id="ed" spellCheck={false} rows={14} value={code} onChange={(e) => setCode(e.target.value)} />
        <p className="runrow">
          <button className="primary" onClick={run} disabled={busy}>{busy ? 'Running…' : 'Run and check'}</button>
          <button onClick={() => setCode(p.starter)}>Reset to starter</button>
          <button onClick={() => setShowRef((s) => !s)}>{showRef ? 'Hide' : 'Show'} reference solution</button>
          {solved && <span className="solved">Solved</span>}
        </p>

        {showRef && (
          <div className="verdict note-plain">
            <h4>Reference implementation</h4>
            <pre className="ref">{p.ref ? String(p.ref) : 'Correctness only for this one; there is no single canonical shape.'}</pre>
          </div>
        )}
        {res && <Results res={res} />}
      </div>
    </section>
  );
}

function Results({ res }: { res: RunResult }) {
  if (res.error) return <div className="verdict bad"><h4>Your code did not run</h4><p className="sub">{res.error}</p></div>;
  const r = res.result!;
  const t = res.trace;
  return (
    <>
      {r.passed === r.cases
        ? <div className="verdict good"><h4>Correct on all {r.cases} test cases.</h4></div>
        : <div className="verdict bad">
            <h4>Passed {r.passed} of {r.cases} cases</h4>
            <p className="sub">
              Input: [{r.firstBad?.in}]<br />Your result: {r.firstBad?.got}<br />Expected: {r.firstBad?.want}
            </p>
          </div>}

      {t && (t.identical
        ? <div className="verdict good"><h4>Your steps match the reference implementation exactly, all {t.at} of them.</h4></div>
        : <div className="verdict warn">
            <h4>Your steps diverge from the reference at step {t.at}</h4>
            <p className="sub">Not necessarily wrong. It means you took a different route to the same answer. Compare, then decide whether the difference was deliberate.</p>
            <div className="tracecols">
              <div><b>Yours</b><pre>{t.mine.map((o, k) => (
                <span key={k} className={t.from + k === t.at ? 'hit' : ''}>{t.from + k}: {o || '(ended)'}</span>))}</pre></div>
              <div><b>Reference</b><pre>{t.ref.map((o, k) => (
                <span key={k} className={t.from + k === t.at ? 'hit' : ''}>{t.from + k}: {o || '(ended)'}</span>))}</pre></div>
            </div>
            <p className="sub">Total operations: yours {t.mineLen}, reference {t.refLen}.</p>
          </div>)}
    </>
  );
}

/* ============================ Measure it ============================ */

const LAB_N = [10, 25, 50, 100, 250, 500, 1000];

export function Lab() {
  const [data, setData] = useState<Record<string, number[]> | null>(null);
  const [log, setLog] = useState(false);

  function measure() {
    const res: Record<string, number[]> = {};
    for (const k of Object.keys(COUNTERS)) {
      res[k] = LAB_N.map((n) => {
        let s = 0;
        for (let r = 0; r < 3; r++) s += COUNTERS[k](rnd(n, 1, 999));
        return Math.round(s / 3);
      });
    }
    setData(res);
  }

  return (
    <section className="view">
      <div className="card">
        <h3>Count the comparisons instead of trusting the label</h3>
        <p className="brief">
          Each algorithm runs on random arrays of increasing size and the comparisons are counted. Three runs per size,
          averaged. Nothing here is estimated.
        </p>
        <p className="runrow">
          <button className="primary" onClick={measure}>Run the measurements</button>
          <button onClick={() => setLog((l) => !l)}>Switch to {log ? 'linear' : 'log'} scale</button>
        </p>
        {data ? <Chart data={data} log={log} /> : <p className="brief">No measurements yet.</p>}
      </div>
    </section>
  );
}

function Chart({ data, log }: { data: Record<string, number[]>; log: boolean }) {
  const keys = Object.keys(data);
  const W = 640, H = 340, PL = 64, PR = 14, PT = 16, PB = 42;
  const max = Math.max(...keys.flatMap((k) => data[k]));
  const yv = (v: number) => (log ? Math.log10(Math.max(v, 1)) : v);
  const ymax = yv(max) || 1;
  const X = (i: number) => PL + (W - PL - PR) * (i / (LAB_N.length - 1));
  const Y = (v: number) => H - PB - (H - PT - PB) * (yv(v) / ymax);
  const ticks = log
    ? [1, 10, 100, 1000, 10000, 100000, 1000000].filter((t) => t <= max * 1.2)
    : [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  const b = data.bubble, m = data.merge;

  return (
    <>
      <svg className="canvas lab" viewBox={`0 0 ${W} ${H}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={PL} y1={Y(t)} x2={W - PR} y2={Y(t)} />
            <text className="wlabel" x={PL - 8} y={Y(t) + 4} textAnchor="end">{t >= 1000 ? t / 1000 + 'k' : t}</text>
          </g>
        ))}
        {LAB_N.map((n, i) => <text key={n} className="wlabel" x={X(i)} y={H - PB + 18} textAnchor="middle">{n}</text>)}
        <text className="wlabel" x={(W + PL) / 2} y={H - 6} textAnchor="middle">array size (n)</text>
        {keys.map((k) => (
          <g key={k}>
            <polyline points={data[k].map((v, i) => X(i) + ',' + Y(v)).join(' ')} fill="none" stroke={LAB_COLOURS[k]} strokeWidth="2.5" />
            {data[k].map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="3" fill={LAB_COLOURS[k]} />)}
          </g>
        ))}
      </svg>
      <p className="legend">{keys.map((k) => <span key={k}><i style={{ background: LAB_COLOURS[k] }} />{L[k].t}</span>)}</p>
      <table className="api lab"><tbody>
        <tr><th>n</th>{LAB_N.map((n) => <td key={n}>{n}</td>)}</tr>
        {keys.map((k) => <tr key={k}><th>{L[k].t}</th>{data[k].map((v, i) => <td key={i}>{v.toLocaleString()}</td>)}</tr>)}
      </tbody></table>
      <p className="gotcha">
        From n = {LAB_N[0]} to n = {LAB_N[LAB_N.length - 1]} the array grew {LAB_N[LAB_N.length - 1] / LAB_N[0]} times.
        Bubble sort&rsquo;s work grew {Math.round(b[b.length - 1] / b[0])} times. Merge sort&rsquo;s grew{' '}
        {Math.round(m[m.length - 1] / m[0])} times. That gap is the whole of what O(n²) versus O(n log n) means, and you
        measured it rather than being told it.
      </p>
    </>
  );
}

/* ============================ Find the bug ============================ */

export function DebugList() {
  return (
    <section className="view">
      <div className="card">
        <h3>Find the fault by stepping</h3>
        <p className="brief">
          Each of these runs without crashing. Three of the four produce output that looks plausible. Open one, step
          through it in the player, and work out what is wrong before answering.
        </p>
        <ul className="buglist">
          {BUGS.map((b: Bug) => (
            <li key={b.id}>
              <b>{b.t}</b><span>{b.idea}</span>
              <a className="btnlink" href={href({ view: 'debug', id: b.id })}>Open in the player</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================ Decide it ============================ */

export function Drills() {
  return (
    <section className="view">
      <div className="card">
        <h3>Pick the right tool under real constraints</h3>
        <p className="brief">
          Nobody at work tells you which chapter a problem belongs to. These mix every topic, and several have a
          tempting wrong answer that is technically correct but the wrong call.
        </p>
      </div>
      <Questions list={DRILLS as Question[]} src="drill" />
    </section>
  );
}

/* ============================ Review ============================ */

const ALL_QUESTIONS: Record<string, Question> = (() => {
  const map: Record<string, Question> = {};
  for (const id of Object.keys(L)) for (const q of L[id].quiz) map[store.keyFor('lesson:' + id, q.q)] = q;
  for (const b of BUGS as Bug[]) map[store.keyFor('debug', b.q.q)] = b.q;
  for (const d of DRILLS as Question[]) map[store.keyFor('drill', d.q)] = d;
  return map;
})();

export function Review() {
  const [session, setSession] = useState<Question[] | null>(null);
  const s = store.stats();
  const dueItems = store.due();

  if (!s.answered) {
    return (
      <section className="view"><div className="card">
        <h3>Review</h3>
        <p className="brief">
          Answer some questions first, in Learn, Find the bug or Decide it. Everything you answer is scheduled to come
          back: one day later, then three, seven, twenty-one and sixty. Anything you get wrong goes back to the start of
          that ladder.
        </p>
      </div></section>
    );
  }

  return (
    <section className="view">
      <div className="card">
        <h3>Review</h3>
        <p className="brief">
          {s.answered} questions in rotation. {s.shaky} still shaky, {s.solid} solid, {s.dueNow} due right now.
          Reviews are ordered by how often you have missed the item, then by how long it has waited.
        </p>
        <p className="runrow">
          <button className="primary" disabled={!dueItems.length}
                  onClick={() => setSession(dueItems.slice(0, 8).map((r) => ALL_QUESTIONS[r.id]).filter(Boolean))}>
            {dueItems.length ? `Review ${Math.min(8, dueItems.length)} questions` : 'Nothing due yet'}
          </button>
          <button onClick={() => { if (confirm('Clear all progress on this device?')) { store.reset(); setSession(null); } }}>
            Reset progress
          </button>
        </p>
        {!dueItems.length && (
          <p className="gotcha">
            Nothing is due, which is the system working. Come back tomorrow, or add new material in the meantime.
          </p>
        )}
      </div>
      {session && session.length > 0 && <Questions list={session} src="review" />}
    </section>
  );
}

/* ============================ Your path ============================ */

export function Path({ onPick }: { onPick: (id: string) => void }) {
  const s = store.stats();
  const done = store.get().completed;
  const solved = store.get().practiceSolved;
  const live = useMemo(
    () => (CURRICULUM as CurriculumGroup[]).flatMap(([, items]) => items.map(([, id]) => id)),
    [],
  );


  return (
    <section className="view">
      <div className="card">
        <h3>Where you are</h3>
        <div className="statgrid">
          <div><b>{s.lessonsDone}</b><span>of {live.length} topics stepped to the end</span></div>
          <div><b>{s.practiceDone}</b><span>of {Object.keys(PRACTICE).length} written from scratch</span></div>
          <div><b>{s.answered}</b><span>questions in rotation</span></div>
          <div><b>{s.dueNow}</b><span>due for review</span></div>
        </div>
        <p className="gotcha">
          Every topic in the sidebar is built and working. What is planned but not written lives in the roadmap in
          README.md, alongside the authoring contract for adding one.
        </p>
      </div>

      <div className="card">
        <h3>Suggested order</h3>
        <p className="brief">
          Each topic is worth stepping through, then writing from scratch where a challenge exists. The tick marks
          what you have finished on this device.
        </p>
        <ol className="pathlist">
          {live.map((id) => (
            <li key={id}>
              <button onClick={() => onPick(id)}>{L[id].t}</button>
              <span className="marks">
                {done[id] ? <i className="ok">stepped</i> : <i>not yet</i>}
                {PRACTICE[id] ? (solved[id] ? <i className="ok">written</i> : <i>not written</i>) : <i className="dim">no exercise</i>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
