import { phiByCount, phiByFactor, factor } from '../nt/phi';
import { modulus } from '../nt/mod';
import { check, verdict } from './common';
// Compare φ(n) from coprime residue counting with its prime-factor formula.
export function act3([n]: bigint[]) {
  modulus(n);
  const f = factor(n),
    phi = phiByFactor(n);
  let html = `<p>Factorisation: ${f.map((x) => `${x.p}^${x.e}`).join(' · ')}. Formula: ${f.map((x) => `${x.p}^(${x.e}−1) · (${x.p}−1)`).join(' · ')} = <span id="phi-formula">${phi}</span>.</p>`;
  if (n <= 1000000n) {
    const counted = phiByCount(n);
    html += check(
      'phi',
      counted.value === phi,
      `<span id="phi-count">${counted.value}</span> units counted; φ(${n}) = ${phi}. Both routes agree.`,
    );
    html += `<p>Units are the residues coprime to ${n}. <span id="unit-window"></span></p><div id="unit-cells" class="residue-strip" tabindex="0" role="region" aria-label="Units" data-units="${counted.units.join(',')}"></div><button id="units-prev">Previous units</button> <button id="units-next">Next units</button>`;
  } else
    html += verdict(
      'info',
      `φ(${n}) = ${phi}; single route (factorisation). Counting is limited to n ≤ 10⁶.`,
    );
  return html;
}
