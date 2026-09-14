import { useEffect, useState, useSyncExternalStore } from 'react';
// @ts-ignore
import { CURRICULUM } from './engine/curriculum.js';
import { Rail, Tabs } from './components/Shared';
import { Learn } from './views/Learn';
import { Practice, Lab, DebugList, Drills, Review, Path } from './views/Rest';
import { useRoute } from './router';
import * as store from './store/progress';
import type { CurriculumGroup } from './types';

export default function App() {
  const [route, go] = useRoute();
  const [topic, setTopic] = useState('bubble');

  const snapshot = useSyncExternalStore(store.subscribe, () => store.get(), () => store.get());
  void snapshot; // re-renders the rail and counters when progress changes

  useEffect(() => {
    if ((route.view === 'learn' || route.view === 'practice') && route.id) setTopic(route.id);
  }, [route]);

  const dueCount = store.due().length;

  return (
    <>
      <header className="top">
        <h1>DSA, one step at a time</h1>
        <p>
          Every algorithm runs as a sequence of frames you can step through, rewind and scrub. Watch what changes, read
          why it changed, then write it yourself and measure what it costs.
        </p>
      </header>

      <div className="app">
        <Rail curriculum={CURRICULUM as CurriculumGroup[]} current={topic}
              onPick={(id) => go({ view: 'learn', id })} />

        <main>
          <Tabs view={route.view} topic={topic} dueCount={dueCount} />

          {route.view === 'learn' && <Learn id={route.id} onLeaveBug={() => go({ view: 'learn', id: topic })} />}
          {route.view === 'debug' && route.id && (
            <Learn id={topic} bugId={route.id} onLeaveBug={() => go({ view: 'learn', id: topic })} />
          )}
          {route.view === 'debug' && !route.id && <DebugList />}
          {route.view === 'practice' && <Practice id={route.id} onPick={(id) => go({ view: 'practice', id })} />}
          {route.view === 'lab' && <Lab />}
          {route.view === 'drills' && <Drills />}
          {route.view === 'review' && <Review />}
          {route.view === 'path' && <Path onPick={(id) => go({ view: 'learn', id })} />}
        </main>
      </div>

    </>
  );
}
