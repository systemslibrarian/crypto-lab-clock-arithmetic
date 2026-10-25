import { gcd } from './euclid';
import { mod } from './mod';

export const MAX_MONTGOMERY_MODULUS = 1_000_000_000_000n;

export type RedcTrace = {
  T: bigint;
  low: bigint;
  m: bigint;
  mTimesN: bigint;
  sum: bigint;
  cancelledLow: bigint;
  candidate: bigint;
  subtracted: boolean;
  result: bigint;
};

export type MontgomeryContext = {
  N: bigint;
  R: bigint;
  shift: bigint;
  nPrime: bigint;
  rSquared: bigint;
};

export type EncodingTrace = {
  input: bigint;
  normalized: bigint;
  rSquared: bigint;
  reduction: RedcTrace;
  result: bigint;
};

export function isPowerOfTwo(x: bigint): boolean {
  return x > 0n && (x & (x - 1n)) === 0n;
}

export function powerOfTwoExponent(R: bigint): bigint {
  if (!isPowerOfTwo(R)) throw Error('Radix R must be a power of two.');
  let shift = 0n;
  for (let value = R; value > 1n; value >>= 1n) shift++;
  return shift;
}

export function nextPowerOfTwo(N: bigint): bigint {
  if (N < 1n) throw Error('N must be at least 1.');
  let R = 1n;
  while (R <= N) R <<= 1n;
  return R;
}

// Setup has a modulus budget for N, but its power-of-two radix can be slightly
// larger. Keep that internal radix out of the lab-wide modulus(n) input gate.
function setupInverse(a: bigint, modulus: bigint): bigint {
  let oldR = a;
  let r = modulus;
  let oldS = 1n;
  let s = 0n;
  while (r !== 0n) {
    const quotient = oldR / r;
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
  }
  if (oldR !== 1n) throw Error('N has no inverse modulo R.');
  return mod(oldS, modulus);
}

// Return N' with N · N' ≡ -1 (mod R).
export function computeNPrime(N: bigint, R: bigint): bigint {
  if (N <= 1n) throw Error('Montgomery modulus N must be greater than 1.');
  if (R <= N) throw Error('Montgomery radix R must be greater than N.');
  if (gcd(N, R) !== 1n) throw Error('Montgomery modulus N and radix R must be coprime.');
  return mod(-setupInverse(N, R), R);
}

export function createMontgomeryContext(N: bigint, R = nextPowerOfTwo(N)): MontgomeryContext {
  if (N <= 1n) throw Error('Montgomery modulus N must be greater than 1.');
  if (N > MAX_MONTGOMERY_MODULUS)
    throw Error(`Montgomery modulus N must be at most ${MAX_MONTGOMERY_MODULUS}.`);
  if (N % 2n === 0n)
    throw Error('Montgomery modulus N must be odd for the R = 2^k specialization.');
  if (!isPowerOfTwo(R)) throw Error('Montgomery radix R must be a power of two.');
  if (R <= N) throw Error('Montgomery radix R must be greater than N.');
  const nPrime = computeNPrime(N, R);
  return {
    N,
    R,
    shift: powerOfTwoExponent(R),
    nPrime,
    rSquared: mod(R * R, N),
  };
}

// REDC for 0 <= T < N·R. Keep the pre-subtraction candidate separate from
// the reduced result so the learner can see when the final subtraction runs.
export function redcTrace(T: bigint, N: bigint, nPrime: bigint, R: bigint): RedcTrace {
  if (N <= 1n) throw Error('Montgomery modulus N must be greater than 1.');
  if (R <= N) throw Error('Montgomery radix R must be greater than N.');
  if (!isPowerOfTwo(R)) throw Error('REDC requires a power-of-two radix R.');
  if (N % 2n === 0n) throw Error('Montgomery modulus N must be odd when R = 2^k.');
  if (T < 0n || T >= N * R) throw Error('REDC input T must satisfy 0 <= T < N·R.');
  if (mod(N * nPrime, R) !== R - 1n)
    throw Error("Montgomery constant N' must satisfy N·N' ≡ -1 (mod R).");

  const mask = R - 1n;
  const low = T & mask;
  const m = (low * nPrime) & mask;
  const mTimesN = m * N;
  const sum = T + mTimesN;
  const cancelledLow = sum & mask;
  if (cancelledLow !== 0n) throw Error('REDC cancellation failed: R does not divide T + m·N.');
  const candidate = sum >> powerOfTwoExponent(R);
  if (candidate >= 2n * N) throw Error('REDC candidate escaped its proven [0, 2N) bound.');
  const subtracted = candidate >= N;
  const result = subtracted ? candidate - N : candidate;
  return { T, low, m, mTimesN, sum, cancelledLow, candidate, subtracted, result };
}

export function redc(T: bigint, N: bigint, nPrime: bigint, R: bigint): bigint {
  return redcTrace(T, N, nPrime, R).result;
}

export function montMultTrace(
  aBar: bigint,
  bBar: bigint,
  N: bigint,
  nPrime: bigint,
  R: bigint,
): RedcTrace {
  if (aBar < 0n || aBar >= N) throw Error(`aBar must be in [0, N), got ${aBar}.`);
  if (bBar < 0n || bBar >= N) throw Error(`bBar must be in [0, N), got ${bBar}.`);
  // aBar,bBar < N < R, hence aBar·bBar < N² < N·R.
  return redcTrace(aBar * bBar, N, nPrime, R);
}

export function montMult(
  aBar: bigint,
  bBar: bigint,
  N: bigint,
  nPrime: bigint,
  R: bigint,
): bigint {
  return montMultTrace(aBar, bBar, N, nPrime, R).result;
}

// Direct definition, retained as a compact utility and cross-check.
export function toMontgomery(a: bigint, N: bigint, R: bigint): bigint {
  if (N <= 1n) throw Error('Montgomery modulus N must be greater than 1.');
  return mod(mod(a, N) * R, N);
}

// Executed conversion used by the lesson: REDC(a · R² mod N) = a · R mod N.
export function toMontgomeryTrace(a: bigint, context: MontgomeryContext): EncodingTrace {
  const normalized = mod(a, context.N);
  const input = normalized * context.rSquared;
  const reduction = redcTrace(input, context.N, context.nPrime, context.R);
  return {
    input,
    normalized,
    rSquared: context.rSquared,
    reduction,
    result: reduction.result,
  };
}

export function fromMontgomery(
  aBar: bigint,
  N: bigint,
  nPrime: bigint,
  R: bigint,
): bigint {
  if (aBar < 0n || aBar >= N) throw Error(`aBar must be in [0, N), got ${aBar}.`);
  return redc(aBar, N, nPrime, R);
}

export function montgomeryMultiply(a: bigint, b: bigint, N: bigint): bigint {
  const context = createMontgomeryContext(N);
  const aBar = toMontgomeryTrace(a, context).result;
  const bBar = toMontgomeryTrace(b, context).result;
  const productBar = montMult(aBar, bBar, N, context.nPrime, context.R);
  return fromMontgomery(productBar, N, context.nPrime, context.R);
}

export function montgomeryChain(values: bigint[], N: bigint): bigint {
  if (values.length === 0) throw Error('Cannot chain an empty array.');
  const context = createMontgomeryContext(N);
  const bars = values.map((value) => toMontgomeryTrace(value, context).result);
  let result = bars[0];
  for (const next of bars.slice(1))
    result = montMult(result, next, N, context.nPrime, context.R);
  return fromMontgomery(result, N, context.nPrime, context.R);
}

// Alternate multiply/square steps give both paths the same fixed operation schedule.
// Callers supply canonical residues so the measured loop can exclude one-time normalization.
export function ordinaryFixedWork(
  aResidue: bigint,
  bResidue: bigint,
  N: bigint,
  rounds: bigint,
): bigint {
  if (rounds < 1n) throw Error('Rounds must be positive.');
  if (N <= 1n) throw Error('Ordinary fixed work requires N greater than 1.');
  if (aResidue < 0n || aResidue >= N) throw Error('aResidue must be in [0, N).');
  if (bResidue < 0n || bResidue >= N) throw Error('bResidue must be in [0, N).');
  let state = aResidue;
  const factor = bResidue;
  for (let i = 0n; i < rounds; i++)
    state = i % 2n === 0n ? mod(state * factor, N) : mod(state * state, N);
  return state;
}

export function montgomeryFixedWork(
  aBar: bigint,
  bBar: bigint,
  context: MontgomeryContext,
  rounds: bigint,
): bigint {
  if (rounds < 1n) throw Error('Rounds must be positive.');
  let state = aBar;
  for (let i = 0n; i < rounds; i++)
    state =
      i % 2n === 0n
        ? montMult(state, bBar, context.N, context.nPrime, context.R)
        : montMult(state, state, context.N, context.nPrime, context.R);
  return state;
}

export function validateCriticalRegression(): boolean {
  const context = createMontgomeryContext(9n, 16n);
  const trace = redcTrace(9n, context.N, context.nPrime, context.R);
  return trace.candidate === 9n && trace.subtracted && trace.result === 0n;
}

export function validateExampleN17R32(): boolean {
  return montgomeryMultiply(3n, 5n, 17n) === 15n;
}
