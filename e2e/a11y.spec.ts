import { test, expect } from '@playwright/test';
import { boot, scan, watchPageErrors, expectBaselineNotStale } from './gate';
for (const width of [1280, 320])
  test(`All six acts and edge states at ${width}`, async ({ page }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width, height: 900 });
    const errors = watchPageErrors(page);
    await boot(page, 'light');
    await page.locator('.cl-skip-link').focus();
    await scan(page, 'focused skip link');
    for (let n = 1; n <= 6; n++) {
      await page.locator('#tab-' + n).click();
      await expect(page.locator('#notice-' + n)).toContainText('Computed');
      await page.locator(`#act-${n} .predict summary`).click();
      await scan(page, `act ${n}`);
      for (const b of await page.locator(`#act-${n} [data-example]`).all()) {
        await b.click();
        await expect(page.locator('#notice-' + n)).toContainText('Computed');
        await scan(page, `act ${n} example`);
      }
    }
    await page.locator('#tab-4').click();
    await page.locator('#a4-n').fill('1');
    await page.locator('#compute-4').click();
    await expect(page.locator('#notice-4')).not.toContainText('Computing');
    await scan(page, 'refused modulus');
    await page.locator('main > details summary').click();
    await scan(page, 'scope links');
    expectBaselineNotStale();
    expect(errors).toEqual([]);
  });
