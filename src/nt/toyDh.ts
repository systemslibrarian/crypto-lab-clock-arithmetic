import { mod, pow } from './mod';
import { primeGroup } from './cyclic';
// Enumerate the distinct powers g^0, g^1, … until the first return to 1.
export function searchSpace(g: bigint, p: bigint): { size: bigint; members: bigint[] } {
  primeGroup(p);
  g = mod(g, p);
  if (g === 0n) throw Error('Base must be nonzero modulo p.');
  const members: bigint[] = [];
  let x = 1n;
  do {
    members.push(x);
    x = (x * g) % p;
  } while (x !== 1n);
  return { size: BigInt(members.length), members };
}
// Count the 1-based position of the secret in the distinct powers starting at g^0.
export function guess(secret: bigint, g: bigint, p: bigint): { found: boolean; guesses: bigint } {
  let guesses = 0n;
  for (const x of searchSpace(g, p).members) {
    guesses++;
    if (x === secret) return { found: true, guesses };
  }
  return { found: false, guesses };
}
// Both parties compute g^(a·b) mod p by raising the other public share.
export function toyExchange(g: bigint, p: bigint, a: bigint, b: bigint) {
  primeGroup(p);
  if (a < 1n || b < 1n) throw Error('Toy private exponents must be positive.');
  const A = pow(g, a, p),
    B = pow(g, b, p),
    secret = pow(B, a, p);
  return { A, B, secret, agrees: secret === pow(A, b, p) };
}
