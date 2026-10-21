import { mod, modulus, pow } from '../nt/mod';
import { gcd } from '../nt/euclid';
import { phiByFactor, isPrime } from '../nt/phi';
import { orderByWalk, orderByDivisors } from '../nt/order';
import { diagram } from './strip';
import { check, verdict } from './common';
// Compare power-walk and divisor orders, then check Euler, Fermat and Lagrange.
export function act4([a, n]: bigint[]) {
  modulus(n, 10000n);
  const A = mod(a, n),
    w = orderByWalk(A, n),
    other = orderByDivisors(A, n),
    phi = phiByFactor(n),
    unit = gcd(a, n) === 1n,
    euler = pow(A, phi, n),
    prime = isPrime(n);
  let html = `<p>${a} mod ${n} = ${A}; φ(${n}) = ${phi}.</p>${diagram(n, w.walk)}<p id="power-walk">Walk: ${w.walk.join(' → ')}${w.order ? '' : ' → ' + w.repeated + ' (cycle repeats; never reaches 1)'}. ${w.order ? `Order = <span id="order">${w.order}</span>.` : 'No multiplicative order: this base is not a unit.'}</p>`;
  html += check(
    'routes',
    w.order === other,
    `Walking order ${w.order ?? 'undefined'}; divisor-search order ${other ?? 'undefined'}.`,
  );
  if (unit) {
    html +=
      '<div id="identity-checks">' +
      check('euler', euler === 1n, `Euler: ${A}^${phi} mod ${n} = ${euler}`);
    if (prime)
      html += check(
        'fermat',
        pow(A, n - 1n, n) === 1n,
        `Fermat: ${A}^${n - 1n} mod ${n} = ${pow(A, n - 1n, n)}`,
      );
    html +=
      check(
        'lagrange',
        w.order !== null && phi % w.order === 0n,
        `Order ${w.order} divides φ(${n}) = ${phi}`,
      ) +
      check('return', w.walk.at(-1) === 1n, 'Walk returned to 1') +
      '</div>';
  } else
    html += verdict(
      'info',
      `gcd(${A}, ${n}) = ${gcd(A, n)}: Euler’s precondition fails. ${A}^${phi} mod ${n} = ${euler}, not 1. The open walk enters a cycle without returning to 1.`,
    );
  if (prime && w.order === 2n)
    html += verdict(
      'alarm',
      `EULER HOLDS — AND THE CYCLE HAS LENGTH 2. Euler’s identity holding for a base says nothing about how long its cycle is: a^(p−1) ≡ 1 holds for every non-zero a modulo a prime, including a base whose cycle has length 2. This cycle is {${[...w.walk].sort((a, b) => (a < b ? -1 : 1)).join(', ')}}; a Diffie–Hellman base with this cycle allows only two shared secrets.`,
      'cycle-warning',
    );
  return (
    html +
    '<details><summary>How are large powers evaluated?</summary><p>Square-and-multiply computes powers efficiently. Follow the trace in <a href="https://systemslibrarian.github.io/crypto-lab-rsa-educational/">Educational RSA</a>. Here Fermat is a statement about cycles, not a primality test; <a href="https://systemslibrarian.github.io/crypto-lab-prime-witness/">Prime Witness</a> explores the test and its liars.</p></details>'
  );
}
