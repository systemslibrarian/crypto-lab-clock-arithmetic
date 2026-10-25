import { it, expect, describe } from 'vitest';
import {
  computeNPrime,
  isPowerOfTwo,
  powerOfTwoExponent,
  nextPowerOfTwo,
  createMontgomeryContext,
  redc,
  redcTrace,
  montMult,
  montMultTrace,
  toMontgomery,
  toMontgomeryTrace,
  fromMontgomery,
  montgomeryMultiply,
  montgomeryChain,
  ordinaryFixedWork,
  montgomeryFixedWork,
  validateCriticalRegression,
  validateExampleN17R32,
} from './montgomery';

// Independent reference implementation for oracle checking
// This does NOT import from montgomery.ts
function independentMod(a: bigint, n: bigint): bigint {
  return ((a % n) + n) % n;
}

function independentExtendedGcd(a: bigint, n: bigint): { g: bigint; s: bigint } {
  let r0 = a < 0n ? -a : a,
    r1 = n,
    s0 = a < 0n ? -1n : 1n,
    s1 = 0n;
  while (r1) {
    const q = r0 / r1,
      r = r0 - q * r1,
      s = s0 - q * s1;
    [r0, r1] = [r1, r];
    [s0, s1] = [s1, s];
  }
  return { g: r0, s: s0 };
}

function independentInverse(a: bigint, n: bigint): bigint | null {
  const { g, s } = independentExtendedGcd(a, n);
  if (g !== 1n) return null;
  return independentMod(s, n);
}

// Independent REDC implementation for verification
// REDC computes T * R^(-1) mod N
function independentRedc(
  T: bigint,
  N: bigint,
  nPrime: bigint,
  R: bigint,
): bigint {
  const T_mod_R = T & (R - 1n);
  const m = (T_mod_R * nPrime) & (R - 1n);
  const sum = T + m * N;
  if (sum % R !== 0n) throw Error('Independent REDC: sum not divisible by R');
  const u = sum / R;
  return u >= N ? u - N : u;
}

describe('Montgomery arithmetic basic utilities', () => {
  it('isPowerOfTwo correctly identifies powers of two', () => {
    expect(isPowerOfTwo(1n)).toBe(true);
    expect(isPowerOfTwo(2n)).toBe(true);
    expect(isPowerOfTwo(4n)).toBe(true);
    expect(isPowerOfTwo(8n)).toBe(true);
    expect(isPowerOfTwo(16n)).toBe(true);
    expect(isPowerOfTwo(32n)).toBe(true);
    expect(isPowerOfTwo(64n)).toBe(true);
    expect(isPowerOfTwo(1024n)).toBe(true);

    expect(isPowerOfTwo(0n)).toBe(false);
    expect(isPowerOfTwo(3n)).toBe(false);
    expect(isPowerOfTwo(5n)).toBe(false);
    expect(isPowerOfTwo(6n)).toBe(false);
    expect(isPowerOfTwo(7n)).toBe(false);
    expect(isPowerOfTwo(9n)).toBe(false);
    expect(isPowerOfTwo(10n)).toBe(false);
  });

  it('powerOfTwoExponent returns correct exponent', () => {
    expect(powerOfTwoExponent(1n)).toBe(0n);
    expect(powerOfTwoExponent(2n)).toBe(1n);
    expect(powerOfTwoExponent(4n)).toBe(2n);
    expect(powerOfTwoExponent(8n)).toBe(3n);
    expect(powerOfTwoExponent(16n)).toBe(4n);
    expect(powerOfTwoExponent(32n)).toBe(5n);
    expect(powerOfTwoExponent(64n)).toBe(6n);
    expect(powerOfTwoExponent(1024n)).toBe(10n);
  });

  it('powerOfTwoExponent throws for non-powers of two', () => {
    expect(() => powerOfTwoExponent(3n)).toThrow();
    expect(() => powerOfTwoExponent(5n)).toThrow();
    expect(() => powerOfTwoExponent(6n)).toThrow();
    expect(() => powerOfTwoExponent(0n)).toThrow();
    expect(() => powerOfTwoExponent(-1n)).toThrow();
  });

  it('nextPowerOfTwo returns smallest power of two > N', () => {
    expect(nextPowerOfTwo(1n)).toBe(2n);
    expect(nextPowerOfTwo(2n)).toBe(4n);
    expect(nextPowerOfTwo(3n)).toBe(4n);
    expect(nextPowerOfTwo(4n)).toBe(8n);
    expect(nextPowerOfTwo(5n)).toBe(8n);
    expect(nextPowerOfTwo(7n)).toBe(8n);
    expect(nextPowerOfTwo(8n)).toBe(16n);
    expect(nextPowerOfTwo(9n)).toBe(16n);
    expect(nextPowerOfTwo(15n)).toBe(16n);
    expect(nextPowerOfTwo(16n)).toBe(32n);
    expect(nextPowerOfTwo(17n)).toBe(32n);
  });

  it('nextPowerOfTwo throws for invalid input', () => {
    expect(() => nextPowerOfTwo(0n)).toThrow();
    // nextPowerOfTwo(1n) returns 2n, which is valid
    expect(nextPowerOfTwo(1n)).toBe(2n);
  });
});

describe('computeNPrime', () => {
  it('computes nPrime = -N^(-1) mod R correctly', () => {
    // N=9, R=16: 9*9=81 ≡ 1 mod 16, so inv=9, nPrime = -9 mod 16 = 7
    expect(computeNPrime(9n, 16n)).toBe(7n);

    // N=17, R=32: 17*17=289 ≡ 1 mod 32 (289-9*32=289-288=1), so inv=17, nPrime = -17 mod 32 = 15
    expect(computeNPrime(17n, 32n)).toBe(15n);

    // N=5, R=8: 5*5=25 ≡ 1 mod 8, so inv=5, nPrime = -5 mod 8 = 3
    expect(computeNPrime(5n, 8n)).toBe(3n);

    // N=7, R=16: 7*7=49 ≡ 1 mod 16, so inv=7, nPrime = -7 mod 16 = 9
    expect(computeNPrime(7n, 16n)).toBe(9n);
  });

  it('throws for invalid preconditions', () => {
    expect(() => computeNPrime(1n, 16n)).toThrow();
    expect(() => computeNPrime(9n, 8n)).toThrow(); // R <= N
    expect(() => computeNPrime(4n, 8n)).toThrow(); // gcd(4,8)=4 != 1
  });
});

describe('redc', () => {
  it('keeps cancellation, radix shift and final subtraction as distinct trace values', () => {
    const defaultContext = createMontgomeryContext(17n, 32n);
    const defaultTrace = montMultTrace(11n, 7n, 17n, defaultContext.nPrime, 32n);
    expect(defaultTrace).toEqual({
      T: 77n,
      low: 13n,
      m: 3n,
      mTimesN: 51n,
      sum: 128n,
      cancelledLow: 0n,
      candidate: 4n,
      subtracted: false,
      result: 4n,
    });

    const subtractContext = createMontgomeryContext(9n, 16n);
    const subtractTrace = redcTrace(9n, 9n, subtractContext.nPrime, 16n);
    expect(subtractTrace.mTimesN).toBe(135n);
    expect(subtractTrace.sum).toBe(144n);
    expect(subtractTrace.candidate).toBe(9n);
    expect(subtractTrace.subtracted).toBe(true);
    expect(subtractTrace.result).toBe(0n);
  });

  it('critical regression: N=9, R=16, T=9 (3*3) produces u=N and reduces to 0', () => {
    const N = 9n;
    const R = 16n;
    const nPrime = computeNPrime(N, R);
    const T = 9n; // 3 * 3
    const result = redc(T, N, nPrime, R);
    expect(result).toBe(0n);
  });

  it('example: N=17, R=32, various T values', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);

    // REDC(T) = T * R^(-1) mod N
    // R^(-1) mod 17: R=32, 32 mod 17 = 15, so we need 15 * x ≡ 1 mod 17
    // 15 * 8 = 120 ≡ 120 - 7*17 = 120 - 119 = 1 mod 17, so R^(-1) = 8 mod 17
    // Therefore: redc(1, N, nPrime, R) = 1 * 8 mod 17 = 8

    // T = 0: 0 * R^(-1) mod N = 0
    expect(redc(0n, N, nPrime, R)).toBe(0n);

    // T = 1: 1 * R^(-1) mod N = 8
    expect(redc(1n, N, nPrime, R)).toBe(8n);

    // T = 15: 15 * 8 mod 17 = 120 mod 17 = 120 - 7*17 = 120 - 119 = 1
    expect(redc(15n, N, nPrime, R)).toBe(1n);

    // T = 16: 16 * 8 mod 17 = 128 mod 17 = 128 - 7*17 = 128 - 119 = 9
    expect(redc(16n, N, nPrime, R)).toBe(9n);
  });

  it('boundary: T = NR-1', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);
    const T = N * R - 1n; // Maximum valid T
    const result = redc(T, N, nPrime, R);
    // T = NR-1
    // T * R^(-1) mod N = (NR-1) * R^(-1) mod N
    // = N * R * R^(-1) - R^(-1) mod N
    // = N - R^(-1) mod N
    // = -R^(-1) mod N
    // R^(-1) mod 17 = 8 (from earlier)
    // So result = -8 mod 17 = 9
    expect(result).toBe(9n);
  });

  it('throws when T >= NR', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);
    expect(() => redc(N * R, N, nPrime, R)).toThrow();
    expect(() => redc(N * R + 1n, N, nPrime, R)).toThrow();
  });

  it('throws for negative T', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);
    expect(() => redc(-1n, N, nPrime, R)).toThrow();
  });

  it('throws for invalid N', () => {
    const R = 16n;
    const nPrime = computeNPrime(9n, R);
    expect(() => redc(5n, 1n, nPrime, R)).toThrow();
    expect(() => redc(5n, 0n, nPrime, R)).toThrow();
  });

  it('throws for invalid R', () => {
    const N = 9n;
    const nPrime = computeNPrime(N, 16n);
    expect(() => redc(5n, N, nPrime, 8n)).toThrow(); // R <= N
  });

  it('throws for even N with R=2^k', () => {
    const N = 10n; // even
    const R = 32n; // gcd(10,32)=2 != 1
    // Since gcd(N,R) != 1, redc should throw during precondition check
    expect(() => {
      // We can't compute nPrime for gcd(N,R) != 1, but redc should check this
      // Let's use a fake nPrime value
      const fakeNPrime = 1n;
      redc(5n, N, fakeNPrime, R);
    }).toThrow();
  });

  it('throws when gcd(N,R) != 1', () => {
    const N = 9n;
    const R = 27n; // gcd(9,27)=9 != 1
    expect(() => computeNPrime(N, R)).toThrow();
  });
});

describe('toMontgomery and fromMontgomery', () => {
  it('executes conversion through REDC of x times R squared', () => {
    const context = createMontgomeryContext(17n, 32n);
    const trace = toMontgomeryTrace(3n, context);
    expect(trace.rSquared).toBe(4n);
    expect(trace.input).toBe(12n);
    expect(trace.result).toBe(11n);
    expect(trace.result).toBe(toMontgomery(3n, 17n, 32n));
  });

  it('toMontgomery converts a to a * R mod N', () => {
    const N = 17n;
    const R = 32n;

    expect(toMontgomery(0n, N, R)).toBe(0n);
    expect(toMontgomery(1n, N, R)).toBe((1n * R) % N);
    expect(toMontgomery(2n, N, R)).toBe((2n * R) % N);
  });

  it('toMontgomery normalizes negative values', () => {
    const N = 17n;
    const R = 32n;
    expect(toMontgomery(-1n, N, R)).toBe(toMontgomery(16n, N, R));
    expect(toMontgomery(-2n, N, R)).toBe(toMontgomery(15n, N, R));
  });

  it('toMontgomery reduces oversized values', () => {
    const N = 17n;
    const R = 32n;
    expect(toMontgomery(17n, N, R)).toBe(toMontgomery(0n, N, R));
    expect(toMontgomery(18n, N, R)).toBe(toMontgomery(1n, N, R));
    expect(toMontgomery(100n, N, R)).toBe(toMontgomery(100n % N, N, R));
  });

  it('fromMontgomery reverses toMontgomery', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);

    for (let a = 0n; a < 100n; a++) {
      const aBar = toMontgomery(a, N, R);
      const result = fromMontgomery(aBar, N, nPrime, R);
      expect(result).toBe(independentMod(a, N));
    }
  });
});

describe('montMult', () => {
  it('multiplies in Montgomery representation', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);

    // a = 3, b = 5, so a * b mod N = 15
    const a = 3n, b = 5n;
    const expected = (a * b) % N; // 15n

    const aBar = toMontgomery(a, N, R);
    const bBar = toMontgomery(b, N, R);
    const cBar = montMult(aBar, bBar, N, nPrime, R);
    const result = fromMontgomery(cBar, N, nPrime, R);

    expect(result).toBe(expected);
  });

  it('throws when aBar not in [0, N)', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);
    expect(() => montMult(N, 5n, N, nPrime, R)).toThrow();
    expect(() => montMult(-1n, 5n, N, nPrime, R)).toThrow();
  });

  it('throws when bBar not in [0, N)', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);
    expect(() => montMult(5n, N, N, nPrime, R)).toThrow();
    expect(() => montMult(5n, -1n, N, nPrime, R)).toThrow();
  });
});

describe('montgomeryMultiply', () => {
  it('computes a * b mod N for various inputs', () => {
    expect(montgomeryMultiply(0n, 0n, 17n)).toBe(0n);
    expect(montgomeryMultiply(0n, 5n, 17n)).toBe(0n);
    expect(montgomeryMultiply(5n, 0n, 17n)).toBe(0n);

    expect(montgomeryMultiply(1n, 1n, 17n)).toBe(1n);
    expect(montgomeryMultiply(1n, 5n, 17n)).toBe(5n);
    expect(montgomeryMultiply(5n, 1n, 17n)).toBe(5n);

    expect(montgomeryMultiply(2n, 3n, 17n)).toBe(6n);
    expect(montgomeryMultiply(3n, 5n, 17n)).toBe(15n);
    expect(montgomeryMultiply(4n, 5n, 17n)).toBe(20n % 17n); // 3n
    expect(montgomeryMultiply(7n, 8n, 17n)).toBe(56n % 17n); // 56-3*17=56-51=5
  });

  it('handles negative inputs via normalization', () => {
    const N = 17n;
    expect(montgomeryMultiply(-1n, 5n, N)).toBe((16n * 5n) % N);
    expect(montgomeryMultiply(3n, -2n, N)).toBe((3n * 15n) % N);
  });

  it('handles oversized inputs via reduction', () => {
    const N = 17n;
    expect(montgomeryMultiply(17n, 5n, N)).toBe(0n);
    expect(montgomeryMultiply(18n, 5n, N)).toBe((1n * 5n) % N);
    expect(montgomeryMultiply(100n, 200n, N)).toBe((100n % N) * (200n % N) % N);
  });

  it('throws for invalid N', () => {
    expect(() => montgomeryMultiply(3n, 5n, 1n)).toThrow();
    expect(() => montgomeryMultiply(3n, 5n, 0n)).toThrow();
    expect(() => montgomeryMultiply(3n, 5n, -5n)).toThrow();
  });

  it('throws for even N', () => {
    expect(() => montgomeryMultiply(3n, 5n, 10n)).toThrow();
    expect(() => montgomeryMultiply(3n, 5n, 2n)).toThrow();
  });

  it('throws above the advertised Montgomery modulus budget', () => {
    const largeN = 1000000000001n;
    expect(() => montgomeryMultiply(3n, 5n, largeN)).toThrow();
  });
});

describe('montgomeryChain', () => {
  it('chains multiplications correctly', () => {
    const N = 17n;

    // Chain: 2 * 3 * 4 * 5 mod 17
    // 2*3=6, 6*4=24≡7, 7*5=35≡1 mod 17
    const result = montgomeryChain([2n, 3n, 4n, 5n], N);
    expect(result).toBe(1n);

    // Verify with direct computation
    const expected = [[...[2n, 3n, 4n, 5n]].reduce((a, b) => (a * b) % N, 1n)];
    expect(result).toBe(expected[0]);
  });

  it('single value returns the value', () => {
    const N = 17n;
    expect(montgomeryChain([5n], N)).toBe(5n);
  });

  it('handles empty chain', () => {
    const N = 17n;
    expect(() => montgomeryChain([], N)).toThrow();
  });
});

describe('context and fixed-work comparison', () => {
  it('accepts the full promised modulus budget across the 2^39 radix boundary', () => {
    expect(createMontgomeryContext(549755813887n).R).toBe(549755813888n);
    expect(createMontgomeryContext(549755813889n).R).toBe(1099511627776n);
    const largest = createMontgomeryContext(999999999999n);
    expect(largest.R).toBe(1099511627776n);
    expect((largest.N * largest.nPrime) % largest.R).toBe(largest.R - 1n);
    expect(() => createMontgomeryContext(1000000000001n)).toThrow(/at most/);
  });

  it('rejects invalid modulus and radix combinations', () => {
    expect(() => createMontgomeryContext(10n, 16n)).toThrow(/odd/);
    expect(() => createMontgomeryContext(17n, 16n)).toThrow(/greater than N/);
    expect(() => createMontgomeryContext(17n, 24n)).toThrow(/power of two/);
    expect(() => createMontgomeryContext(17n, 64n)).not.toThrow();
  });

  it('runs the same alternating product and square schedule on both routes', () => {
    const context = createMontgomeryContext(17n, 32n);
    const aBar = toMontgomeryTrace(-3n, context).result;
    const bBar = toMontgomeryTrace(5n, context).result;
    for (const rounds of [1n, 2n, 3n, 32n, 257n]) {
      const ordinary = ordinaryFixedWork(14n, 5n, 17n, rounds);
      const encoded = montgomeryFixedWork(aBar, bBar, context, rounds);
      expect(fromMontgomery(encoded, 17n, context.nPrime, 32n)).toBe(ordinary);
    }
    expect(() => ordinaryFixedWork(3n, 5n, 17n, 0n)).toThrow(/positive/);
    expect(() => ordinaryFixedWork(-3n, 5n, 17n, 1n)).toThrow(/aResidue/);
    expect(() => ordinaryFixedWork(3n, 17n, 17n, 1n)).toThrow(/bResidue/);
    expect(() => montgomeryFixedWork(aBar, bBar, context, 0n)).toThrow(/positive/);
  });
});

describe('validate regression and examples', () => {
  it('critical regression N=9, R=16, x=y=3 produces 0', () => {
    expect(validateCriticalRegression()).toBe(true);
  });

  it('example N=17, R=32 validates', () => {
    expect(validateExampleN17R32()).toBe(true);
  });
});

describe('independent oracle verification', () => {
  it('redc matches independent implementation for all valid inputs', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);

    // Test all T in [0, N*R)
    for (let T = 0n; T < N * R; T++) {
      const result = redc(T, N, nPrime, R);
      const expected = independentRedc(T, N, nPrime, R);
      expect(result, `Mismatch at T=${T}`).toBe(expected);
    }
  }, 120000); // Allow more time for exhaustive test

  it('montgomeryMultiply matches direct computation for bounded odd moduli', () => {
    // Test all odd N from 3 to 100 (step 2)
    // For each N, test all a, b in [0, N)
    for (let nInt = 3; nInt <= 100; nInt += 2) {
      const N = BigInt(nInt);
      for (let aInt = 0; aInt < nInt; aInt++) {
        for (let bInt = 0; bInt < nInt; bInt++) {
          const a = BigInt(aInt);
          const b = BigInt(bInt);
          const expected = (a * b) % N;
          const result = montgomeryMultiply(a, b, N);
          expect(result, `Mismatch at N=${N}, a=${a}, b=${b}`).toBe(expected);
        }
      }
    }
  }, 120000); // Allow more time for exhaustive test
});

describe('mathematical properties', () => {
  it('REDC preserves congruence: redc(T, N) ≡ T * R^(-1) mod N', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);

    // Compute R^(-1) mod N
    const R_inv = independentInverse(R, N);
    if (!R_inv) throw Error('R should have an inverse mod N');

    for (let T = 0n; T < N * R; T += 1n) {
      const u = redc(T, N, nPrime, R);
      // u ≡ T * R^(-1) mod N
      const expected = (T * R_inv) % N;
      expect(u).toBe(independentMod(expected, N));
    }
  }, 120000);

  it('REDC output is in [0, N)', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);

    for (let T = 0n; T < N * R; T++) {
      const u = redc(T, N, nPrime, R);
      expect(u).toBeGreaterThanOrEqual(0n);
      expect(u).toBeLessThan(N);
    }
  }, 120000);

  it('the repeated REDC path exposes a radix mask and shift rather than a quotient by N', () => {
    const context = createMontgomeryContext(17n, 32n);
    const trace = montMultTrace(7n, 11n, 17n, context.nPrime, 32n);
    expect(trace.low).toBe(trace.T & 31n);
    expect(trace.candidate).toBe(trace.sum >> 5n);
    expect(trace.result).toBe(trace.candidate >= 17n ? trace.candidate - 17n : trace.candidate);
  });
});

describe('edge cases', () => {
  it('T=0 produces 0', () => {
    const N = 17n;
    const R = 32n;
    const nPrime = computeNPrime(N, R);
    // 0 * R^(-1) mod N = 0
    expect(redc(0n, N, nPrime, R)).toBe(0n);
  });

  it('N-1 inputs', () => {
    const N = 17n;
    const a = N - 1n;
    const b = N - 1n;
    const result = montgomeryMultiply(a, b, N);
    // (N-1)^2 mod N = (N^2 - 2N + 1) mod N = 1
    expect(result).toBe(1n);
  });

  it('zero input', () => {
    const N = 17n;
    expect(montgomeryMultiply(0n, 5n, N)).toBe(0n);
    expect(montgomeryMultiply(5n, 0n, N)).toBe(0n);
    expect(montgomeryMultiply(0n, 0n, N)).toBe(0n);
  });

  it('composite odd modulus', () => {
    // N = 9 (composite, odd)
    expect(montgomeryMultiply(3n, 3n, 9n)).toBe(0n);
    expect(montgomeryMultiply(2n, 5n, 9n)).toBe(1n); // 2*5=10 ≡ 1 mod 9
    expect(montgomeryMultiply(4n, 7n, 9n)).toBe(1n); // 4*7=28 ≡ 1 mod 9
  });

  it('different radices for same N', () => {
    const N = 17n;
    const a = 5n, b = 7n;
    const expected = (a * b) % N;

    for (const R of [32n, 64n, 128n, 256n]) {
      const context = createMontgomeryContext(N, R);
      const aBar = toMontgomeryTrace(a, context).result;
      const bBar = toMontgomeryTrace(b, context).result;
      const productBar = montMult(aBar, bBar, N, context.nPrime, R);
      const result = fromMontgomery(productBar, N, context.nPrime, R);
      expect(result, `Mismatch with R=${R}`).toBe(expected);
    }
  });
});
