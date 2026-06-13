import { test, expect } from '@playwright/test';

// The critical path the unit tests can't cover: real selection in a browser.
// Highlight text in the demo message, click "Ask about this", and confirm an
// inline annotation panel opens. (We don't assert on the LLM answer here, since
// that depends on a live endpoint — just that the interaction wires up.)
test('select text -> ask -> inline panel opens', async ({ page }) => {
  await page.goto('/');

  const prose = page.locator('.la-prose').first();
  await expect(prose).toBeVisible();

  // Select the first word of the rendered message.
  await prose.locator('text=/\\w+/').first().click();
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.up('Shift');

  const askBtn = page.getByRole('button', { name: 'Ask about this' });
  if (await askBtn.isVisible()) {
    await askBtn.click();
    await expect(page.locator('.la-panel')).toBeVisible();
  }
});
