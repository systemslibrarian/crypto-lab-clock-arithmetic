import { expect, type Locator, type Page } from '@playwright/test';

// Small-number test oracles deliberately use enumeration, with no production imports.
export const mod = (a: number, n: number): number => ((a % n) + n) % n;
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const units = (n: number): number[] =>
  Array.from({ length: n - 1 }, (_, i) => i + 1).filter((a) => gcd(a, n) === 1);
export const phi = (n: number): number => units(n).length;
export const primeFactors = (n: number): number[] =>
  Array.from({ length: n - 1 }, (_, i) => i + 2).filter(
    (q) => n % q === 0 && Array.from({ length: q - 2 }, (_, j) => j + 2).every((d) => q % d !== 0),
  );
export const isPrime = (n: number): boolean =>
  n >= 2 &&
  Array.from({ length: Math.max(0, Math.floor(Math.sqrt(n)) - 1) }, (_, i) => i + 2).every(
    (d) => n % d !== 0,
  );
export function power(a: number, e: number, n: number): number {
  let out = 1;
  for (let i = 0; i < e; i++) out = mod(out * a, n);
  return out;
}
export function walk(
  a: number,
  n: number,
): { values: number[]; order: number | null; repeated: number } {
  const values: number[] = [];
  for (let x = mod(a, n); !values.includes(x); x = mod(x * a, n)) {
    values.push(x);
    if (x === 1) return { values, order: values.length, repeated: 1 };
  }
  return { values, order: null, repeated: mod(values.at(-1)! * a, n) };
}
export function powersFromZero(a: number, n: number): number[] {
  const values: number[] = [];
  for (let x = 1; !values.includes(x); x = mod(x * a, n)) values.push(x);
  return values;
}
export async function checksPass(region: Locator, count: number): Promise<void> {
  const checks = region.locator('[data-check]');
  await expect(checks).toHaveCount(count);
  for (const check of await checks.all()) {
    await expect(check).toHaveAttribute('data-verdict', 'pass');
    await expect(check).toHaveClass('verdict-ok');
  }
}
export async function assertPowerClaims(page: Page): Promise<void> {
  const a = Number(await page.locator('#a4-a').inputValue());
  const n = Number(await page.locator('#a4-n').inputValue());
  const A = mod(a, n),
    expected = walk(A, n),
    count = phi(n);
  const region = page.locator('#result-4');
  await expect(region.locator('[data-check=routes]')).toContainText(
    `Walking order ${expected.order ?? 'undefined'}; divisor-search order ${expected.order ?? 'undefined'}.`,
  );
  const chain = [...expected.values, ...(expected.order === null ? [expected.repeated] : [])].join(
    ' → ',
  );
  await expect(page.locator('#power-walk')).toContainText(`Walk: ${chain}`);
  await checksPass(region, expected.order === null ? 1 : isPrime(n) ? 5 : 4);
  if (expected.order === null) {
    await expect(page.locator('#order')).toHaveCount(0);
    const info = region.locator('[data-verdict=info]');
    await expect(info).toHaveCount(1);
    await expect(info).toHaveAttribute('data-verdict', 'info');
    await expect(info).toHaveClass('verdict-info');
    await expect(info).toContainText(`gcd(${A}, ${n}) = ${gcd(A, n)}`);
    await expect(info).toContainText(`${A}^${count} mod ${n} = ${power(A, count, n)}, not 1`);
    await expect(info).toContainText('Euler’s precondition fails');
  } else {
    await expect(page.locator('#order')).toHaveText(String(expected.order));
    expect(count % expected.order).toBe(0);
    await expect(region.locator('[data-check=euler]')).toContainText(
      `Euler: ${A}^${count} mod ${n} = ${power(A, count, n)}`,
    );
    await expect(region.locator('[data-check=lagrange]')).toContainText(
      `Order ${expected.order} divides φ(${n}) = ${count}`,
    );
    expect(expected.values.at(-1)).toBe(1);
    await expect(region.locator('[data-check=return]')).toContainText('Walk returned to 1');
    if (isPrime(n))
      await expect(region.locator('[data-check=fermat]')).toContainText(
        `Fermat: ${A}^${n - 1} mod ${n} = ${power(A, n - 1, n)}`,
      );
  }
}
