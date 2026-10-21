import { mod } from '../nt/mod';
import { gcd, inverse } from '../nt/euclid';
import { phiByFactor } from '../nt/phi';
import { orderByWalk } from '../nt/order';
import { searchSpace } from '../nt/toyDh';
import { crt } from '../nt/crt';

// Derive each fixed prediction from the same exact arithmetic primitives as the exhibits.
export function predictionAnswer(act: number): string {
  switch (act) {
    case 1:
      return `6 · 5 mod 10 = ${mod(6n * 5n, 10n)}. Two nonzero residues can multiply to zero.`;
    case 2: {
      const result = inverse(6n, 15n);
      return `gcd(6, 15) = ${gcd(6n, 15n)}; ${result.kind === 'none' ? 'no inverse exists' : `inverse = ${result.value}`}.`;
    }
    case 3:
      return `φ(36) = ${phiByFactor(36n)}. These are exactly the invertible residues.`;
    case 4: {
      const result = orderByWalk(2n, 10n);
      return `2’s walk cycles ${result.walk.join(' → ')}${result.order === null ? ' and never reaches 1' : `; order = ${result.order}`}.`;
    }
    case 5:
      return `|⟨22⟩| = ${searchSpace(22n, 23n).size}: only this many possible shared secrets modulo 23.`;
    case 6: {
      const result = crt([
        { a: 1n, n: 4n },
        { a: 2n, n: 6n },
      ]);
      return result.kind === 'NoSolution'
        ? `No solution: gcd ${result.g} does not divide ${result.delta}. The remainders have incompatible parity.`
        : `x = ${result.x} modulo ${result.modulus}.`;
    }
    default:
      throw Error('Unknown prediction.');
  }
}
