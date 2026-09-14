import { useEffect, useState } from 'react';
import type { Question, CurriculumGroup } from '../types';
import * as store from '../store/progress';
import { href, type Route } from '../router';

/* ---------- questions ---------- */

export function Questions({ list, src, title }: { list: Question[]; src: string; title?: string }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  useEffect(() => setPicked({}), [list]);

  const answered = Object.keys(picked).length;
  const right = Object.entries(picked).filter(([i, choice]) => list[+i].a === choice).length;

  return (
    <div className="card quiz">
      {title && <h3>{title}</h3>}
      {list.map((q, n) => {
        const choice = picked[n];
        const done = choice !== undefined;
        return (
          <div className={'qz' + (n === 0 ? ' first' : '')} key={q.q}>
            <p><span className="qnum">{n + 1}.</span>{q.q}</p>
            {q.o.map((o, i) => {
              let cls = 'opt';
              if (done && i === q.a) cls += ' right';
              else if (done && i === choice) cls += ' wrong';
              return (
                <button key={i} className={cls} disabled={done}
                        onClick={() => {
                          setPicked((p) => ({ ...p, [n]: i }));
                          store.recordAnswer(src, q.q, i === q.a);
                        }}>{o}</button>
              );
            })}
            {done && <p className="why">{q.why}</p>}
          </div>
        );
      })}
      <p className="score">
        {answered === 0 ? `${list.length} questions` : `${right} of ${answered} correct, ${list.length - answered} left`}
      </p>
    </div>
  );
}

/* ---------- explanation sheet ---------- */

export function Sheet({ title, lead, body, onClose }: { title: string; lead: string; body: string; onClose: () => void }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        <p className="lead">{lead}</p>
        <p className="body">{body}</p>
        <button className="close" onClick={onClose} autoFocus>Close</button>
      </div>
    </div>
  );
}

/* ---------- curriculum rail ---------- */

export function Rail({ curriculum, current, onPick }: {
  curriculum: CurriculumGroup[];
  current: string;
  onPick: (id: string) => void;
}) {
  const done = store.get().completed;
  return (
    <nav className="rail" aria-label="Topics">
      {curriculum.map(([group, items]) => (
        <div key={group}>
          <div className="grp">{group}</div>
          {items.map(([label, id]) => (
            <button key={label}
                    className={['live', done[id] ? 'done' : '', id === current ? 'sel' : ''].filter(Boolean).join(' ')}
                    onClick={() => onPick(id)}>
              <span className="dot" /><span>{label}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

/* ---------- tabs ---------- */

const TABS: { v: Route['view']; label: string }[] = [
  { v: 'path', label: 'Your path' },
  { v: 'learn', label: 'Learn' },
  { v: 'practice', label: 'Write it' },
  { v: 'lab', label: 'Measure it' },
  { v: 'debug', label: 'Find the bug' },
  { v: 'drills', label: 'Decide it' },
  { v: 'review', label: 'Review' },
];

export function Tabs({ view, topic, dueCount }: { view: Route['view']; topic: string; dueCount: number }) {
  return (
    <nav className="tabs" id="tabs">
      {TABS.map((t) => (
        <a key={t.v}
           className={t.v === view ? 'on' : ''}
           href={href(({ view: t.v, id: t.v === 'learn' || t.v === 'practice' ? topic : undefined } as unknown) as Route)}>
          {t.label}{t.v === 'review' && dueCount > 0 ? ` (${dueCount})` : ''}
        </a>
      ))}
    </nav>
  );
}

