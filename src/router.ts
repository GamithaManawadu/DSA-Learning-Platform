/* A hash router in thirty lines. The app has six routes and no need for a
   dependency that ships its own data layer. */
import { useEffect, useState } from 'react';

export type Route =
  | { view: 'learn'; id: string }
  | { view: 'practice'; id: string }
  | { view: 'debug'; id?: string }
  | { view: 'lab' }
  | { view: 'drills' }
  | { view: 'review' }
  | { view: 'path' };

export function parse(hash: string): Route {
  const [view, id] = hash.replace(/^#\/?/, '').split('/');
  switch (view) {
    case 'practice': return { view: 'practice', id: id || 'bubble' };
    case 'debug':    return { view: 'debug', id };
    case 'lab':      return { view: 'lab' };
    case 'drills':   return { view: 'drills' };
    case 'review':   return { view: 'review' };
    case 'path':     return { view: 'path' };
    default:         return { view: 'learn', id: id || 'bubble' };
  }
}

export const href = (r: Route) =>
  '#/' + r.view + ('id' in r && r.id ? '/' + r.id : '');

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(location.hash));
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return [route, (r) => { location.hash = href(r); }];
}
