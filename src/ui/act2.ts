import { gcdSteps, egcdTable, inverse } from '../nt/euclid';
import { mod } from '../nt/mod';
import { table, check, verdict } from './common';
// Render Euclidean divisions, Bézout identities and the normalized inverse when it exists.
export function act2([a, n]: bigint[]) {
  const euclid = gcdSteps(a, n),
    e = egcdTable(a, n),
    inv = inverse(a, n);
  let html = `<p>Orientation: s · a + t · n = gcd(a,n). Here a = <span id="egcd-a">${a}</span>, n = <span id="egcd-n">${n}</span>.</p><div class="euclid-steps">${euclid.rows.map((r, i) => `<p data-step="${i}"${i ? ' hidden' : ''}>${r.a} = ${r.q} · ${r.b} + ${r.r}</p>`).join('')}</div><button class="step-euclid">Next Euclid division</button><p>gcd(${a}, ${n}) = ${e.g}.</p>`;
  html += table(
    'Extended Euclid with checked Bézout rows',
    ['q', 'r', 's', 't', 's·a + t·n', 'Check'],
    e.rows.map((r) => [
      r.q === null ? '—' : String(r.q),
      String(r.r),
      String(r.s),
      String(r.t),
      String(r.check),
      check('bezout', r.check === r.r, `${r.s} · ${a} + ${r.t} · ${n} = ${r.check}`),
    ]),
    'egcd-table',
  );
  html +=
    inv.kind === 'none'
      ? verdict(
          'info',
          `No inverse: gcd(${a}, ${n}) = ${inv.g}. Shared factor ${inv.g}; this is why RSA requires gcd(e, φ(n)) = 1.`,
          'inverse-verdict',
        )
      : check(
          'inverse',
          inv.value >= 0n && inv.value < n && mod(a * inv.value, n) === 1n,
          `Inverse <span id="inverse-value">${inv.value}</span> from s = ${inv.s}; ${a} · ${inv.value} mod ${n} = ${mod(a * inv.value, n)}`,
        );
  return (
    html +
    '<p>Use this inverse to find d in <a href="https://systemslibrarian.github.io/crypto-lab-rsa-educational/">Educational RSA</a>.</p>'
  );
}
