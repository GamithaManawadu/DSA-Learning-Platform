/* Minimal DOM so the components can render on the server. */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.location = { hash: '#/learn/bubble' };
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.Worker = class { postMessage() {} terminate() {} };
globalThis.document = { getElementById: () => null };
await import('../ssr-dist/smoke-entry.js');
