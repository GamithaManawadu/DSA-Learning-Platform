/* Server-renders every view once. Catches broken imports, bad props and
   anything that throws during render, without needing a browser. */
import { renderToString } from 'react-dom/server';
import App from '../src/App';

const views = ['#/path', '#/learn/bubble', '#/learn/dijkstra', '#/practice/binary',
               '#/lab', '#/debug', '#/debug/bug-binary', '#/drills', '#/review'];

let total = 0;
for (const hash of views) {
  location.hash = hash;
  const html = renderToString(<App />);
  if (html.length < 400) throw new Error(hash + ' rendered almost nothing');
  total += html.length;
  console.log(hash.padEnd(22), html.length.toLocaleString().padStart(8), 'chars');
}
console.log('all views rendered,', total.toLocaleString(), 'chars total');
