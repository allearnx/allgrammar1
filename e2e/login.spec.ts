import { test, expect } from '@playwright/test';

test.describe('로그인 페이지', () => {
  test('로그인 폼이 표시된다', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('로그인');
  });

  test('잘못된 비밀번호 → 에러 토스트 표시', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#email', 'wrong@example.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Sonner 토스트 에러 메시지 확인
    const toast = page.locator('[data-sonner-toast][data-type="error"]');
    await expect(toast).toBeVisible({ timeout: 10000 });
  });

  test('올바른 로그인 → 대시보드 리다이렉트', async ({ page }) => {
    const email = process.env.TEST_BOSS_EMAIL!;
    const password = process.env.TEST_BOSS_PASSWORD!;

    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');

    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  });
});
