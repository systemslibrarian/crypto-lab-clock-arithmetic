import {
  createMontgomeryContext,
  MAX_MONTGOMERY_MODULUS,
  montgomeryFixedWork,
  montMultTrace,
  ordinaryFixedWork,
  redcTrace,
  toMontgomeryTrace,
} from '../nt/montgomery';
import { check, table, verdict } from './common';

const FIXED_WORK_ROUNDS = 4096n;

function canonical(value: bigint, modulus: bigint): bigint {
  return ((value % modulus) + modulus) % modulus;
}

function elapsed(start: number): string {
  return (performance.now() - start).toFixed(3);
}

export function act7([a, b, N, R]: bigint[]) {
  if (N <= 1n)
    return verdict(
      'info',
      `Montgomery modulus N must be greater than 1; got ${N}.`,
      'montgomery-refusal',
    );
  if (N > MAX_MONTGOMERY_MODULUS)
    return verdict(
      'info',
      `Montgomery modulus N must be at most ${MAX_MONTGOMERY_MODULUS} in this bounded lab.`,
      'montgomery-refusal',
    );

  const setupStart = performance.now();
  let context;
  try {
    context = createMontgomeryContext(N, R);
  } catch (error) {
    return verdict('info', (error as Error).message, 'montgomery-refusal');
  }
  const aEncoding = toMontgomeryTrace(a, context);
  const bEncoding = toMontgomeryTrace(b, context);
  const setupMs = elapsed(setupStart);

  const product = montMultTrace(
    aEncoding.result,
    bEncoding.result,
    N,
    context.nPrime,
    R,
  );
  const decodedProduct = redcTrace(product.result, N, context.nPrime, R);
  const ordinaryProduct = canonical(a * b, N);
  const independentProduct = canonical(canonical(a, N) * canonical(b, N), N);

  const square = montMultTrace(product.result, product.result, N, context.nPrime, R);
  const timesA = montMultTrace(square.result, aEncoding.result, N, context.nPrime, R);
  const decodedChain = redcTrace(timesA.result, N, context.nPrime, R);
  const ordinaryChain = canonical(ordinaryProduct * ordinaryProduct * canonical(a, N), N);

  const ordinaryStart = performance.now();
  const ordinaryFixed = ordinaryFixedWork(
    aEncoding.normalized,
    bEncoding.normalized,
    N,
    FIXED_WORK_ROUNDS,
  );
  const ordinaryMs = elapsed(ordinaryStart);
  const montgomeryStart = performance.now();
  const montgomeryFixedBar = montgomeryFixedWork(
    aEncoding.result,
    bEncoding.result,
    context,
    FIXED_WORK_ROUNDS,
  );
  const montgomeryMs = elapsed(montgomeryStart);
  const decodeStart = performance.now();
  const montgomeryFixed = redcTrace(montgomeryFixedBar, N, context.nPrime, R).result;
  const decodeMs = elapsed(decodeStart);

  let html = `<h3>Set up R = 2<sup>k</sup> and encode</h3>`;
  html += `<p id="montgomery-context">N = ${N}; R = 2<sup>${context.shift}</sup> = ${R}; N′ = -N<sup>−1</sup> mod R = <span id="n-prime">${context.nPrime}</span>; R² mod N = <span id="r-squared-mod-n">${context.rSquared}</span>.</p>`;
  html += `<p>Encoding executes REDC(x · (R² mod N)): <span id="a-normalized">${aEncoding.normalized}</span> → <span id="a-bar">${aEncoding.result}</span> and <span id="b-normalized">${bEncoding.normalized}</span> → <span id="b-bar">${bEncoding.result}</span>.</p>`;
  html += check(
    'montgomery-encoding',
    aEncoding.result === canonical(a * R, N) && bEncoding.result === canonical(b * R, N),
    `Both encodings equal x · R mod N.`,
  );

  html += `<h3>Multiply and expose REDC</h3>`;
  html += `<p>T = ā · b̄ = ${aEncoding.result} · ${bEncoding.result} = <span id="mont-t">${product.T}</span>, with 0 ≤ T < N·R = ${N * R}.</p>`;
  html += `<ol>`;
  html += `<li>T mod R = <span id="mont-low">${product.low}</span>.</li>`;
  html += `<li>m = (T mod R) · N′ mod R = ${product.low} · ${context.nPrime} mod ${R} = <span id="mont-m">${product.m}</span>.</li>`;
  html += `<li>m·N = ${product.m} · ${N} = <span id="mont-m-times-n">${product.mTimesN}</span>.</li>`;
  html += `<li>Low-word cancellation: ${product.low} + (${product.mTimesN} mod ${R}) = ${product.low + (product.mTimesN & (R - 1n))} ≡ <span id="mont-cancelled-low">${product.cancelledLow}</span> (mod R).</li>`;
  html += `<li>Radix shift: (T + m·N) / R = ${product.sum} / ${R} = ${product.sum} &gt;&gt; ${context.shift} = <span id="mont-candidate">${product.candidate}</span>.</li>`;
  html += `<li id="mont-final-subtraction">Final subtraction: ${product.candidate} ${product.subtracted ? '≥' : '<'} ${N}, so ${product.subtracted ? `${product.candidate} − ${N}` : product.candidate} = <span id="mont-product-bar">${product.result}</span>.</li>`;
  html += `</ol>`;
  html += check(
    'montgomery-cancellation',
    product.cancelledLow === 0n && product.sum === product.T + product.mTimesN,
    `The low radix word cancels before the ${context.shift}-bit shift.`,
  );
  html += `<p>Decode once: REDC(${product.result}) = <span id="result">${decodedProduct.result}</span>. Ordinary canonical remainder: ${a} · ${b} mod ${N} = <span id="direct">${ordinaryProduct}</span>.</p>`;
  html += check(
    'montgomery-result',
    decodedProduct.result === ordinaryProduct,
    `Montgomery and ordinary multiplication agree at ${ordinaryProduct}.`,
  );
  html += check(
    'independent-check',
    decodedProduct.result === independentProduct,
    `A separately normalized native BigInt remainder confirms ${independentProduct}.`,
  );

  html += `<h3>Stay encoded for a product and a square</h3>`;
  html += table(
    'Montgomery product and square chain',
    ['Encoded operation', 'T', 'Pre-subtraction candidate', 'Final subtraction', 'Encoded output'],
    [
      ['ā · b̄', String(product.T), String(product.candidate), product.subtracted ? 'yes' : 'no', String(product.result)],
      ['(ā · b̄)²', String(square.T), String(square.candidate), square.subtracted ? 'yes' : 'no', String(square.result)],
      ['(ā · b̄)² · ā', String(timesA.T), String(timesA.candidate), timesA.subtracted ? 'yes' : 'no', String(timesA.result)],
    ],
    'montgomery-chain',
  );
  html += `<p>One conversion out gives <span id="chain-result">${decodedChain.result}</span> for (a·b)²·a mod N; the ordinary route gives <span id="chain-direct">${ordinaryChain}</span>.</p>`;
  html += check(
    'montgomery-chain',
    decodedChain.result === ordinaryChain,
    `The chained product and square remained encoded until one final REDC.`,
  );

  html += `<h3>Separate setup from repeated work</h3>`;
  html += `<p id="fixed-work-definition">This worker executed exactly <span id="fixed-rounds">${FIXED_WORK_ROUNDS}</span> alternating operations—${FIXED_WORK_ROUNDS / 2n} multiplications by b and ${FIXED_WORK_ROUNDS / 2n} squarings—on both routes.</p>`;
  html += table(
    'One worker timing observation',
    ['Phase actually executed', 'Measured time'],
    [
      ['Montgomery setup: validate supplied R, compute N′ and R², then encode a and b through REDC', `<span id="setup-ms">${setupMs}</span> ms`],
      ['Ordinary repeated loop: canonical a and b from setup; BigInt multiply followed by % N every operation', `<span id="ordinary-loop-ms">${ordinaryMs}</span> ms`],
      ['Montgomery repeated loop: validated mask/multiply/add/shift/optional-subtraction trace every operation; setup and decode excluded', `<span id="montgomery-loop-ms">${montgomeryMs}</span> ms`],
      ['One final Montgomery decode through REDC', `<span id="decode-ms">${decodeMs}</span> ms`],
    ],
    'montgomery-measurements',
  );
  html += check(
    'montgomery-fixed-work',
    montgomeryFixed === ordinaryFixed,
    `Both executed ${FIXED_WORK_ROUNDS}-operation schedules finish at ${ordinaryFixed}.`,
  );
  html += verdict(
    'info',
    'These are single Worker observations of this TypeScript BigInt implementation, including its stated validation and trace-object work. They are not a benchmark, a speedup claim, or evidence of constant-time behavior.',
    'montgomery-measurement-limit',
  );

  html += `<h3>Scope and limits</h3><ul>`;
  html += `<li>Repeated Montgomery operations avoid division or remainder by N; setup still uses extended Euclid and computes R² mod N.</li>`;
  html += `<li>JavaScript BigInt is not constant-time. Neither the displayed trace nor timing establishes side-channel resistance.</li>`;
  html += `<li>This bounded specialization requires odd N and a supplied power-of-two R &gt; N. It is teaching code, not production cryptography.</li>`;
  html += `<li>Montgomery modular multiplication is distinct from the Montgomery ladder used for exponentiation or scalar multiplication.</li>`;
  html += `</ul>`;
  return html;
}
