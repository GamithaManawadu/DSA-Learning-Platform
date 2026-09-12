/* Spawns the sandbox worker and kills it if the learner's code will not stop. */

export interface RunResult {
  error?: string;
  result?: { passed: number; cases: number; firstBad: { in: string; got: string; want: string } | null };
  trace?: {
    identical: boolean;
    at: number;
    from: number;
    mine: string[];
    ref: string[];
    mineLen: number;
    refLen: number;
  } | null;
}

const TIMEOUT = 4000;

export function runInSandbox(id: string, code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./sandbox.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        error:
          'Your code was still running after 4 seconds, so it was stopped. ' +
          'That almost always means a loop whose condition never becomes false.',
      });
    }, TIMEOUT);

    worker.onmessage = (e: MessageEvent<RunResult>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ error: e.message || 'The sandbox failed to start.' });
    };
    worker.postMessage({ id, code });
  });
}
