import { test, expect } from '@playwright/test';

test.describe('top navigation', () => {
  test('navigates from home to features and back', async ({ page }) => {
    await page.goto('/');

    const featuresLink = page.getByRole('link', { name: 'Features' });
    await featuresLink.click();

  await expect(page).toHaveURL(/\/pages\/features(?:\.html)?$/);
    await expect(page.getByRole('heading', { level: 2, name: /key features/i })).toBeVisible();
    await expect(featuresLink).toHaveAttribute('aria-current', 'page');

    const homeLink = page.getByRole('link', { name: 'Home' });
    await homeLink.click();

    await expect(page).toHaveURL(/\/(index\.html)?$/);
    await expect(page.getByRole('heading', { level: 1, name: /template web app/i })).toBeVisible();
    await expect(homeLink).toHaveAttribute('aria-current', 'page');
  });
});
