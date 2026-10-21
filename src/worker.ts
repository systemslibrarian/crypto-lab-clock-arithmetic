import { act1 } from './ui/act1';
import { act2 } from './ui/act2';
import { act3 } from './ui/act3';
import { act4 } from './ui/act4';
import { act5 } from './ui/act5';
import { act6 } from './ui/act6';
// Evaluate the selected arithmetic exhibit with BigInt inputs and return only its current result.
self.onmessage = (e: MessageEvent<{ act: number; values: bigint[] }>) => {
  const start = performance.now();
  try {
    const html = [act1, act2, act3, act4, act5, act6][e.data.act - 1](e.data.values);
    self.postMessage({ ok: true, html, ms: performance.now() - start });
  } catch (e) {
    self.postMessage({ ok: false, error: (e as Error).message });
  }
};
