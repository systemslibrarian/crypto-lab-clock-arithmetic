import { mod, modulus, pow } from './mod';
import { factor, isPrime } from './phi';
import { orderByWalk } from './order';
// Require a prime p within budget so the nonzero residues form a cyclic group.
export function primeGroup(p: bigint): void {
  modulus(p, 10000n);
  if (!isPrime(p))
    throw Error(
      'Generator search requires a prime p, checked by exact trial division. Use act 4 for composite moduli and the ℤ₁₅* counterexample below.',
    );
}
// A nonzero g generates exactly when g^((p−1)/q) ≠ 1 for every prime q | p−1.
export function isGenerator(g: bigint, p: bigint) {
  primeGroup(p);
  g = mod(g, p);
  const checks = factor(p - 1n).map(({ p: q }) => ({ q, value: pow(g, (p - 1n) / q, p) }));
  return { generator: g !== 0n && checks.every((c) => c.value !== 1n), checks };
}
// Enumerate all nonzero residues satisfying the prime-factor generator criterion.
export function generators(p: bigint): bigint[] {
  primeGroup(p);
  const out: bigint[] = [];
  for (let g = 1n; g < p; g++) if (isGenerator(g, p).generator) out.push(g);
  return out;
}
// Stop at the first primitive root instead of enumerating every generator.
export function firstGenerator(p: bigint): bigint {
  primeGroup(p);
  for (let g = 1n; g < p; g++) if (isGenerator(g, p).generator) return g;
  throw Error('Implementation disagreement: no generator for a prime group.');
}
// A supplied primitive root is reused; its (p−1)/d power generates the order-d subgroup.
export function subgroup(
  d: bigint,
  p: bigint,
  root = firstGenerator(p),
): { base: bigint; members: bigint[] } {
  primeGroup(p);
  if (d < 1n || (p - 1n) % d !== 0n) throw Error('Subgroup order must divide p−1.');
  if (!isGenerator(root, p).generator) throw Error('Subgroup construction needs a primitive root.');
  const base = pow(root, (p - 1n) / d, p);
  return { base, members: orderByWalk(base, p).walk };
}
// [extension] point: decompose ℤₙ* into a product of cyclic groups.
