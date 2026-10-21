// Require 2 ≤ n ≤ the declared exact-arithmetic budget.
export function modulus(n: bigint, max = 1000000000000n): void {
  if (n < 2n) throw Error('ℤ₁ has one element; nothing wraps. Use n ≥ 2.');
  if (n > max) throw Error(`Input exceeds this experiment’s exact budget of ${max}.`);
}
// Return the unique residue congruent to a in [0, n).
export function mod(a: bigint, n: bigint): bigint {
  if (n < 1n) throw Error('Positive modulus required.');
  return ((a % n) + n) % n;
}
// Compute a^e mod n by repeated squaring for e ≥ 0.
export function pow(a: bigint, e: bigint, n: bigint): bigint {
  if (e < 0n || n < 2n) throw Error('Nonnegative exponent and modulus ≥ 2 required.');
  let out = 1n,
    b = mod(a, n);
  for (; e; e >>= 1n, b = (b * b) % n) if (e & 1n) out = (out * b) % n;
  return out;
}
// Enumerate (a + b) mod n and (a · b) mod n for every residue pair.
export function tables(n: bigint): { add: bigint[][]; multiply: bigint[][] } {
  modulus(n, 13n);
  const add: bigint[][] = [],
    multiply: bigint[][] = [];
  for (let a = 0n; a < n; a++) {
    const ar: bigint[] = [],
      mr: bigint[] = [];
    for (let b = 0n; b < n; b++) {
      ar.push(mod(a + b, n));
      mr.push(mod(a * b, n));
    }
    add.push(ar);
    multiply.push(mr);
  }
  return { add, multiply };
}
