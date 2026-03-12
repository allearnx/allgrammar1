import { test, expect } from '@playwright/test';

test.describe('보카 퀴즈 플로우 (student)', () => {
  test('보카 홈에서 Day 카드 목록이 표시된다', async ({ page }) => {
    await page.goto('/student/voca');

    const dayCards = page.locator('a[href^="/student/voca/"]');
    await expect(dayCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('Day 카드 클릭 → 플래시카드 탭 표시', async ({ page }) => {
    await page.goto('/student/voca');

    const firstCard = page.locator('a[href^="/student/voca/"]').first();
    await firstCard.click();

    await expect(page).toHaveURL(/\/student\/voca\/.+/);

    const flashcardTab = page.getByRole('tab', { name: '플래시카드' });
    await expect(flashcardTab).toBeVisible({ timeout: 10000 });
  });

  test('퀴즈 탭 클릭 → 퀴즈 UI 표시', async ({ page }) => {
    await page.goto('/student/voca');

    const firstCard = page.locator('a[href^="/student/voca/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/student\/voca\/.+/);

    const quizTab = page.getByRole('tab', { name: '퀴즈' });
    await expect(quizTab).toBeVisible({ timeout: 10000 });
    await quizTab.click();

    const quizPanel = page.locator('[role="tabpanel"][data-state="active"]');
    await expect(quizPanel).toBeVisible();
  });
});
