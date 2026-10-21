import { mod, modulus, pow } from './mod';
import { gcd } from './euclid';
import { phiByFactor, divisors } from './phi';
// Multiply by a until the first return to 1, or detect a nonunit repeat.
export function orderByWalk(
  a: bigint,
  n: bigint,
): { order: bigint | null; walk: bigint[]; cycleStart: bigint; repeated: bigint } {
  modulus(n, 1000000n);
  a = mod(a, n);
  const seen = new Map<bigint, bigint>(),
    walk: bigint[] = [];
  let x = a,
    k = 0n;
  while (!seen.has(x)) {
    seen.set(x, k);
    walk.push(x);
    k++;
    if (x === 1n) return { order: k, walk, cycleStart: 0n, repeated: 1n };
    x = (x * a) % n;
  }
  return { order: null, walk, cycleStart: seen.get(x)!, repeated: x };
}
// For a unit, find the least divisor d of φ(n) with a^d ≡ 1 (mod n).
export function orderByDivisors(a: bigint, n: bigint): bigint | null {
  modulus(n);
  if (gcd(a, n) !== 1n) return null;
  for (const d of divisors(phiByFactor(n))) if (pow(a, d, n) === 1n) return d;
  throw Error('Implementation disagreement: no order among divisors.');
}
