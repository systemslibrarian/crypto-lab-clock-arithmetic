import { phiByCount, phiByFactor } from '../nt/phi';
import { orderByDivisors } from '../nt/order';

// Compute the unit orders of ℤ₁₅*: their maximum is smaller than φ(15), so no generator exists.
export function compositeCounterexample(): string {
  const units = phiByCount(15n).units.map((x) => ({ x, order: orderByDivisors(x, 15n)! }));
  const largest = units.reduce((v, x) => (x.order > v ? x.order : v), 0n);
  return `<details id="composite-counterexample"><summary>Composite counterexample: ℤ₁₅*</summary><p>${units.map((x) => `${x.x} → order ${x.order}`).join('; ')}. Largest order ${largest} &lt; φ(15) = ${phiByFactor(15n)}. No generator.</p></details>`;
}
