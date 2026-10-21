import { test, expect, type Page } from '@playwright/test';
import { boot } from './gate';
import {
  mod,
  gcd,
  units,
  phi,
  primeFactors,
  power,
  walk,
  powersFromZero,
  checksPass,
  assertPowerClaims,
} from './reference';

async function ready(page: Page, n: number) {
  await expect(page.locator('#notice-' + n)).toContainText('Computed');
  if (n === 4) await assertPowerClaims(page);
}
async function act(page: Page, n: number) {
  await page.locator('#tab-' + n).click();
  await page.locator('#compute-' + n).click();
  await ready(page, n);
}
async function compute(page: Page, n: number, values: Record<string, string>) {
  for (const [key, value] of Object.entries(values))
    await page.locator(`#a${n}-${key}`).fill(value);
  await page.locator('#compute-' + n).click();
}

test('Arrival preserves every prediction until the learner computes or reveals', async ({
  page,
}) => {
  await boot(page);
  const answers = [
    `6 · 5 mod 10 = ${mod(6 * 5, 10)}`,
    `gcd(6, 15) = ${gcd(6, 15)}; no inverse exists`,
    `φ(36) = ${phi(36)}`,
    `2’s walk cycles ${walk(2, 10).values.join(' → ')} and never reaches 1`,
    `|⟨22⟩| = ${powersFromZero(22, 23).length}`,
    `No solution: gcd ${gcd(4, 6)} does not divide ${2 - 1}`,
  ];
  for (let n = 1; n <= 6; n++) {
    await page.locator('#tab-' + n).click();
    await expect(page.locator('#result-' + n)).toBeEmpty();
    await expect(page.locator('#notice-' + n)).toBeEmpty();
    const disclosure = page.locator(`#act-${n} .predict details`);
    await expect(disclosure).not.toHaveAttribute('open', '');
    await disclosure.locator('summary').click();
    await expect(disclosure.locator('p')).toBeVisible();
    await expect(disclosure.locator('p')).toContainText(answers[n - 1]);
    await expect(page.locator('#result-' + n)).toBeEmpty();
  }
  await page.locator('#compute-6').click();
  await ready(page, 6);
  await page.locator('#tab-3').click();
  await page.getByRole('button', { name: 'Use 36', exact: true }).click();
  await ready(page, 3);
  await expect(page.locator('#phi-count')).toHaveText(String(phi(36)));
});

test('Wrap reductions and every printed multiplication row own their permutation claim', async ({
  page,
}) => {
  await boot(page);
  await act(page, 1);
  const n = Number(await page.locator('#a1-n').inputValue());
  for (const a of [-3, 47])
    await expect(page.locator('#result-1')).toContainText(`${a} mod ${n} = ${mod(a, n)}`);
  const table = page.getByRole('region', { name: 'Multiplication modulo 10', exact: true });
  const rows = await table
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((r) => Array.from(r.querySelectorAll('td'), (c) => c.textContent!)),
    );
  expect(rows).toHaveLength(n);
  const all = Array.from({ length: n }, (_, i) => i);
  for (const row of rows) {
    const a = Number(row[0]),
      printed = row.slice(1, -1).map(Number);
    expect(printed).toEqual(all.map((b) => mod(a * b, n)));
    const permutation = [...printed].sort((a, b) => a - b).every((x, i) => x === all[i]);
    expect(row.at(-1)).toBe(permutation ? 'permutation · inverse exists' : 'repeats · no inverse');
  }
});

test('Bézout every printed row and reduced inverse independently checked', async ({ page }) => {
  await boot(page);
  await act(page, 2);
  for (const [a, n] of [
    [7n, 40n],
    [391n, 299n],
    [-7n, 40n],
  ]) {
    await compute(page, 2, { a: String(a), n: String(n) });
    await ready(page, 2);
    const rows = await page
      .locator('.egcd-table tbody tr')
      .evaluateAll((rows) =>
        rows.map((r) => Array.from(r.querySelectorAll(':scope > td'), (t) => t.textContent!)),
      );
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      const [r, s, t, value] = row.slice(1, 5).map(BigInt);
      expect(s * a + t * n).toBe(r);
      expect(value).toBe(r);
    }
    const invertible = gcd(Number(a), Number(n)) === 1;
    await checksPass(page.locator('#result-2'), rows.length + (invertible ? 1 : 0));
    if (invertible) {
      const inv = BigInt((await page.locator('#inverse-value').textContent())!);
      expect(inv >= 0n && inv < n).toBe(true);
      expect((((a * inv) % n) + n) % n).toBe(1n);
      await expect(page.locator('#result-2')).toContainText(
        'Use this inverse to find d in Educational RSA',
      );
    } else {
      await expect(page.locator('#inverse-verdict')).toHaveAttribute('data-verdict', 'info');
      await expect(page.locator('#inverse-verdict')).toHaveClass('verdict-info');
      await expect(page.locator('#inverse-verdict')).toContainText(
        `gcd(${a}, ${n}) = ${gcd(Number(a), Number(n))}`,
      );
      await expect(page.locator('#result-2')).not.toContainText('Use this inverse');
    }
  }
});

test('Phi drawn units match count and independent formula', async ({ page }) => {
  await boot(page);
  await act(page, 3);
  for (const n of [36, 97, 100]) {
    await compute(page, 3, { n: String(n) });
    await ready(page, 3);
    const expected = units(n);
    expect(await page.locator('.unit').allTextContents()).toEqual(expected.map(String));
    await expect(page.locator('#phi-count')).toHaveText(String(expected.length));
    await expect(page.locator('#phi-formula')).toHaveText(String(expected.length));
    await checksPass(page.locator('#result-3'), 1);
  }
});

test('Generators, subgroups and toy DH search spaces rederive from multiplication', async ({
  page,
}) => {
  await boot(page);
  await act(page, 5);
  for (const g of [22, 2, 5]) {
    await compute(page, 5, { g: String(g) });
    await ready(page, 5);
    const p = Number(await page.locator('#group-p').textContent()),
      members = powersFromZero(g, p);
    const generators = units(p).filter((x) => powersFromZero(x, p).length === p - 1);
    expect(await page.locator('[data-generator]').allTextContents()).toHaveLength(
      generators.length,
    );
    expect(
      await page
        .locator('[data-generator]')
        .evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.generator))),
    ).toEqual(generators);
    await expect(page.locator('#generator-count')).toHaveText(String(phi(p - 1)));
    expect(generators.length).toBe(phi(p - 1));
    await checksPass(page.locator('#result-5'), 1);
    const orders = await page
      .getByRole('region', { name: 'Every element and its order', exact: true })
      .locator('tbody tr')
      .allTextContents();
    expect(orders).toHaveLength(p - 1);
    for (const [i, row] of orders.entries())
      expect(row).toBe(
        `${i + 1}${powersFromZero(i + 1, p).length}${generators.includes(i + 1) ? 'generator' : 'proper subgroup'}`,
      );
    const qRows = await page
      .getByRole('region', { name: 'Generator test for the selected base', exact: true })
      .locator('tbody tr')
      .evaluateAll((rows) =>
        rows.map((r) => Array.from(r.querySelectorAll('td'), (c) => c.textContent!)),
      );
    const primes = primeFactors(p - 1);
    expect(qRows.map((r) => Number(r[0]))).toEqual(primes);
    for (const [q, value, yes] of qRows) {
      const expected = power(g, (p - 1) / Number(q), p);
      expect(Number(value)).toBe(expected);
      expect(yes).toBe(expected !== 1 ? 'yes' : 'no');
    }
    const verdict = page.locator('#generator-verdict');
    await expect(verdict).toHaveClass('verdict-info');
    await expect(verdict).toHaveAttribute('data-verdict', 'info');
    expect((await verdict.textContent())!.includes('generates the whole group')).toBe(
      members.length === p - 1,
    );
    if (members.length <= 2) {
      await expect(verdict).not.toContainText('not a flaw');
      await expect(verdict).toContainText('alarm below');
    } else if (members.length < p - 1) await expect(verdict).toContainText('not a flaw');
    const groups = page.locator('#subgroups [data-order]');
    const divisors = Array.from({ length: p - 1 }, (_, i) => i + 1).filter(
      (d) => (p - 1) % d === 0,
    );
    await expect(groups).toHaveCount(divisors.length);
    for (const [i, group] of (await groups.all()).entries()) {
      const parsed = (await group.textContent())!.match(
        /^Order (\d+), generated by (\d+): \{([\d, ]+)\}$/,
      )!;
      expect(parsed).not.toBeNull();
      const d = Number(parsed[1]),
        base = Number(parsed[2]),
        printed = parsed[3].split(', ').map(Number);
      expect(d).toBe(divisors[i]);
      expect(printed).toHaveLength(d);
      expect((p - 1) % d).toBe(0);
      expect([...printed].sort((a, b) => a - b)).toEqual(
        powersFromZero(base, p).sort((a, b) => a - b),
      );
      await expect(group).toHaveAttribute('data-size', String(d));
      await expect(group).toHaveAttribute('data-order', String(d));
    }
    await expect(page.locator('#dh-space')).toHaveText(String(members.length));
    const secret = Number(await page.locator('#dh-secret').textContent());
    const a = Number(await page.locator('#a5-a').inputValue()),
      b = Number(await page.locator('#a5-b').inputValue());
    expect(secret).toBe(power(g, a * b, p));
    expect(members).toContain(secret);
    await expect(page.locator('#dh-guesses')).toHaveText(String(members.indexOf(secret) + 1));
    const kind = members.length <= 2 ? 'alarm' : 'info';
    await expect(page.locator('#dh-verdict')).toHaveClass('verdict-' + kind);
    await expect(page.locator('#dh-verdict')).toHaveAttribute('data-verdict', kind);
  }
});

async function checkCrt(page: Page) {
  const pairs = await page
    .locator('.crt-inputs tbody tr')
    .evaluateAll((rows) =>
      rows.map((r) => Array.from(r.querySelectorAll('td'), (x) => Number(x.textContent))),
    );
  const x = Number(await page.locator('#crt-x').textContent()),
    lcm = pairs.reduce((v, [, n]) => (v / gcd(v, n)) * n, 1);
  for (const [a, n] of pairs) expect(mod(x, n)).toBe(mod(a, n));
  expect(x).toBeGreaterThanOrEqual(0);
  expect(x).toBeLessThan(lcm);
  await expect(page.locator('#crt-modulus')).toHaveText(String(lcm));
  await expect(page.locator('#crt-verdict')).toHaveAttribute('data-verdict', 'ok');
  await expect(page.locator('#crt-verdict')).toHaveClass('verdict-ok');
  const inverses = await page.locator('#result-6 [data-check=crt-inverse]').allTextContents();
  for (const text of inverses) {
    const parsed = text.match(/(\d+)⁻¹ mod (\d+) = (-?\d+); (\d+) · (-?\d+) mod (\d+) = (-?\d+)/)!;
    expect(parsed).not.toBeNull();
    const [base, n, inv, base2, inv2, n2, result] = parsed.slice(1).map(Number);
    expect([base2, inv2, n2]).toEqual([base, inv, n]);
    expect(inv).toBeGreaterThanOrEqual(0);
    expect(inv).toBeLessThan(n);
    expect(mod(base * inv, n)).toBe(1);
    expect(result).toBe(1);
  }
  const unique = new Set(pairs.map(([a, n]) => `${mod(a, n)}/${n}`)).size;
  await checksPass(page.locator('#result-6'), inverses.length + unique);
  return inverses.length;
}
test('CRT substitutes printed solution and uses lcm for shared factors', async ({ page }) => {
  await boot(page);
  await act(page, 6);
  for (const preset of ['Sunzi’s problem', 'Compatible shared factor']) {
    await page.getByRole('button', { name: preset, exact: true }).click();
    await ready(page, 6);
    expect(await checkCrt(page)).toBeGreaterThan(0);
  }
});
test('CRT deduplicates identical congruences with an informational note and solution', async ({
  page,
}) => {
  await boot(page);
  await act(page, 6);
  await page.locator('#crt-count').selectOption('2');
  await compute(page, 6, { a1: '1', n1: '4', a2: '1', n2: '4' });
  await ready(page, 6);
  await checkCrt(page);
  await expect(page.locator('#crt-x')).toHaveText('1');
  const note = page.locator('#result-6 [data-verdict=info]');
  await expect(note).toHaveAttribute('data-verdict', 'info');
  await expect(note).toHaveClass('verdict-info');
  await expect(note).toContainText('1 repeated congruence(s) deduplicated');
});
test('CRT refuses modulus n = 1', async ({ page }) => {
  await boot(page);
  await act(page, 6);
  await compute(page, 6, { n1: '1' });
  await expect(page.locator('#notice-6')).toContainText('nothing wraps');
  await expect(page.locator('#result-6')).toBeEmpty();
});

test('Euler negative claim all five checks pass while the cycle has only two elements', async ({
  page,
}) => {
  await boot(page);
  await page.locator('#tab-4').click();
  await page.getByRole('button', { name: 'Euler passes, tiny cycle', exact: true }).click();
  await ready(page, 4);
  // §4.1d assertion 2 covers EVERY rendered check, including independent order routes.
  await checksPass(page.locator('#result-4'), 5);
  await expect(page.locator('#order')).toHaveText(String(walk(22, 23).order));
  await expect(page.locator('#cycle-warning')).toHaveAttribute('data-verdict', 'alarm');
  await expect(page.locator('#cycle-warning')).toHaveClass('verdict-alarm');
  await expect(page.locator('#cycle-warning')).toBeVisible();
  await expect(page.locator('#cycle-warning')).toContainText(
    'EULER HOLDS — AND THE CYCLE HAS LENGTH 2',
  );
  await expect(page.locator('#cycle-warning')).toContainText(
    'Euler’s identity holding for a base says nothing about how long its cycle is',
  );
  await expect(page.locator('#cycle-warning')).toContainText(
    `{${powersFromZero(22, 23)
      .sort((a, b) => a - b)
      .join(', ')}}`,
  );
});
test('Euler composite case uses phi rather than n minus one', async ({ page }) => {
  await boot(page);
  await act(page, 4);
  await page.getByRole('button', { name: 'Residue strip', exact: true }).click();
  await ready(page, 4);
});
test('Break the precondition shows the nonunit walk and independently computed Euler failure', async ({
  page,
}) => {
  await boot(page);
  await page.locator('#tab-4').click();
  await page.getByRole('button', { name: 'Break the precondition', exact: true }).click();
  await ready(page, 4);
  expect(walk(2, 10).order).toBeNull();
  await expect(page.locator('#power-walk')).toContainText('2 → 4 → 8 → 6 → 2');
  await expect(page.locator('#result-4')).toContainText(
    `2^${phi(10)} mod 10 = ${power(2, phi(10), 10)}`,
  );
});
test('Clock directed edges match the walk; nonreturning cycles have no edge into 1', async ({
  page,
}) => {
  await boot(page);
  await act(page, 4);
  for (const [a, n] of [
    [3, 20],
    [22, 23],
    [2, 10],
    [4, 8],
    [1, 7],
  ]) {
    await compute(page, 4, { a: String(a), n: String(n) });
    await ready(page, 4);
    const w = walk(a, n),
      vertices = w.order === null ? [...w.values, w.repeated] : [1, ...w.values];
    const svg = page.locator('#result-4 svg.clock'),
      edges = svg.locator('[data-edge]');
    await expect(edges).toHaveCount(vertices.length - 1);
    await expect(svg).toHaveAttribute('data-closed', String(w.order !== null));
    for (const [i, edge] of (await edges.all()).entries()) {
      await expect(edge).toHaveAttribute('data-from', String(vertices[i]));
      await expect(edge).toHaveAttribute('data-to', String(vertices[i + 1]));
      await expect(edge).toHaveAttribute('marker-end', /url\(#arrow-act4\)/);
      await expect(edge).toHaveAttribute('d', / A /);
    }
    if (w.order === null) {
      await expect(svg.locator('[data-to="1"]')).toHaveCount(0);
      await expect(svg.locator('[data-edge=repeat]')).toHaveCount(1);
      await expect(svg.locator('[data-edge=repeat]')).toHaveAttribute('stroke-dasharray', '5 4');
      await expect(svg.locator('[data-cycle-label]')).toHaveText('cycle');
    } else await expect(svg.locator('[data-edge=repeat]')).toHaveCount(0);
    for (const node of await svg.locator('circle[data-visited=true]').all())
      await expect(node).toHaveAttribute('stroke-width', '4');
    if (a === 22) {
      const clearance = await svg.locator('[data-from="22"][data-to="1"]').evaluate((path) => {
        const edge = path as SVGPathElement;
        const zero = path.closest('svg')!.querySelector('circle[data-residue="0"]')!;
        const x = Number(zero.getAttribute('cx')),
          y = Number(zero.getAttribute('cy'));
        return Math.min(
          ...Array.from({ length: 101 }, (_, i) => {
            const p = edge.getPointAtLength((edge.getTotalLength() * i) / 100);
            return Math.hypot(p.x - x, p.y - y);
          }),
        );
      });
      expect(clearance).toBeGreaterThan(13);
    }
  }
});

for (const [name, a, n] of [
  ['gcd2', '4', '10'],
  ['gcd3', '6', '15'],
  ['zero', '0', '17'],
])
  test(`No inverse ${name} is a neutral fact`, async ({ page }) => {
    await boot(page);
    await act(page, 2);
    await compute(page, 2, { a, n });
    await ready(page, 2);
    await expect(page.locator('#inverse-verdict')).toHaveAttribute('data-verdict', 'info');
    await expect(page.locator('#inverse-verdict')).toHaveClass('verdict-info');
    await expect(page.locator('#inverse-verdict')).toContainText(
      `gcd(${a}, ${n}) = ${gcd(Number(a), Number(n))}`,
    );
    await expect(page.locator('#inverse-value')).toHaveCount(0);
    await expect(page.locator('#result-2')).not.toContainText('Use this inverse');
  });
for (const [name, n, msg] of [
  ['n below2', '1', 'nothing wraps'],
  ['phi out of budget', '1000000000001', 'budget'],
  ['invalid input text', 'abc', 'whole integer'],
  ['input over 2,000 digits', '9'.repeat(2001), '2,000-digit text budget'],
])
  test(`Refuses ${name}`, async ({ page }) => {
    await boot(page);
    await act(page, 3);
    await compute(page, 3, { n });
    await expect(page.locator('#notice-3')).toContainText(msg);
    await expect(page.locator('#result-3')).toBeEmpty();
  });
test('Phi above million labels its single route', async ({ page }) => {
  await boot(page);
  await act(page, 3);
  await compute(page, 3, { n: '1000001' });
  await ready(page, 3);
  const info = page.locator('#result-3 [data-verdict=info]');
  await expect(info).toHaveAttribute('data-verdict', 'info');
  await expect(info).toHaveClass('verdict-info');
  await expect(info).toContainText(`φ(1000001) = ${phi(1000001)}; single route (factorisation)`);
  await expect(page.locator('#phi-count')).toHaveCount(0);
});
test('Composite prime-group input refused and the Z15 counterexample stays reachable', async ({
  page,
}) => {
  await boot(page);
  await act(page, 5);
  await compute(page, 5, { p: '15' });
  await expect(page.locator('#notice-5')).toContainText('requires a prime');
  await expect(page.locator('#notice-5')).toContainText('act 4');
  await expect(page.locator('#notice-5')).toContainText('ℤ₁₅* counterexample');
  await expect(page.locator('#result-5')).toBeEmpty();
  const example = page.locator('#composite-counterexample');
  await example.locator('summary').click();
  await expect(example.locator('p')).toBeVisible();
  const orders = units(15).map((a) => ({ a, order: powersFromZero(a, 15).length }));
  for (const { a, order } of orders) await expect(example).toContainText(`${a} → order ${order}`);
  await expect(example).toContainText(
    `Largest order ${Math.max(...orders.map((x) => x.order))} < φ(15) = ${phi(15)}. No generator.`,
  );
});
test('Refuses act5 prime p above 10^4', async ({ page }) => {
  await boot(page);
  await act(page, 5);
  await compute(page, 5, { p: '10007' });
  await expect(page.locator('#notice-5')).toContainText('exact budget of 10000');
  await expect(page.locator('#result-5')).toBeEmpty();
});
for (const [name, values] of [
  ['incompatible CRT', { a1: '1', n1: '4', a2: '2', n2: '6' }],
  ['repeated modulus different residues', { a1: '1', n1: '4', a2: '2', n2: '4' }],
] as const)
  test(name, async ({ page }) => {
    await boot(page);
    await act(page, 6);
    await page.locator('#crt-count').selectOption('2');
    await compute(page, 6, values);
    await ready(page, 6);
    const g = gcd(Number(values.n1), Number(values.n2)),
      delta = Number(values.a2) - Number(values.a1);
    expect(delta % g).not.toBe(0);
    await expect(page.locator('#crt-verdict')).toHaveClass('verdict-info');
    await expect(page.locator('#crt-verdict')).toHaveAttribute('data-verdict', 'info');
    await expect(page.locator('#crt-verdict')).toContainText(
      `No solution: gcd ${g} does not divide difference ${delta}`,
    );
    await expect(page.locator('#crt-x')).toHaveCount(0);
  });
test('Changing n mid-computation retires it; same values preserve computed results', async ({
  page,
}) => {
  await boot(page);
  await act(page, 3);
  const before = await page.locator('#result-3').innerHTML();
  await page.locator('#a3-n').dispatchEvent('input');
  await expect(page.locator('#result-3')).toHaveJSProperty('innerHTML', before);
  // Measure the uncancelled workload, then observe longer than its real completion time.
  const started = Date.now();
  await compute(page, 3, { n: '999983' });
  await ready(page, 3);
  const observationMs = Math.max(5000, 2 * (Date.now() - started));
  await compute(page, 3, { n: '999983' });
  await expect(page.locator('#notice-3')).toContainText('Computing');
  await page.locator('#a3-n').fill('97');
  const deadline = Date.now() + observationMs;
  do {
    await expect(page.locator('#result-3')).toBeEmpty();
    await expect(page.locator('#notice-3')).toContainText('retired');
    await expect(page.locator('#a3-n')).toHaveValue('97');
    await page.waitForTimeout(100); // Repeated observation is the cancellation assertion, not setup timing.
  } while (Date.now() < deadline);
  await expect(page.locator('#result-3')).toBeEmpty();
  await expect(page.locator('#notice-3')).toContainText('retired');
  await act(page, 5);
  const group = await page.locator('#result-5').innerHTML();
  await page.locator('#a5-p').dispatchEvent('input');
  await expect(page.locator('#result-5')).toHaveJSProperty('innerHTML', group);
  await page.locator('#a5-p').fill('29');
  await expect(page.locator('#result-5')).toBeEmpty();
  await expect(page.locator('#notice-5')).toContainText('retired');
});
test('Point Arithmetic scope link targets the existing EC lab', async ({ page }) => {
  await boot(page);
  await page.locator('main > details summary').click();
  await expect(page.getByRole('link', { name: 'Point Arithmetic', exact: true })).toHaveAttribute(
    'href',
    'https://systemslibrarian.github.io/crypto-lab-ec-point-arithmetic/',
  );
});
test('Hidden probe and keyboard stepper', async ({ page }) => {
  await boot(page);
  await page.locator('#tab-1').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-2')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#result-2')).toBeEmpty();
  await page.locator('#compute-2').click();
  await ready(page, 2);
  expect(
    await page
      .locator('[hidden]')
      .evaluateAll((els) => els.filter((e) => e.getClientRects().length > 0).length),
  ).toBe(0);
  await expect(page.locator('.euclid-steps [data-step]:visible')).toHaveCount(1);
  await page.locator('.step-euclid').click();
  await expect(page.locator('.euclid-steps [data-step]:visible')).toHaveCount(2);
});
