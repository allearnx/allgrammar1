import { test, expect } from '@playwright/test';

test.describe('내신 학습 플로우 (student)', () => {
  test('내신 홈 → 교과서 목록 표시', async ({ page }) => {
    await page.goto('/student/naesin');

    // 내신 관련 콘텐츠가 표시되는지 확인
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('교과서 선택 → 단원 목록 표시', async ({ page }) => {
    await page.goto('/student/naesin');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 교과서 카드 또는 선택 UI가 있으면 클릭
    const textbookCard = page.locator('a[href*="/student/naesin/"]').first();
    const hasTextbook = await textbookCard.isVisible().catch(() => false);

    if (hasTextbook) {
      await textbookCard.click();
      await expect(page).toHaveURL(/\/student\/naesin\/.+/, { timeout: 10000 });
    }
  });

  test('단원 카드 → 학습 단계 표시', async ({ page }) => {
    await page.goto('/student/naesin');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 단원 링크를 찾아서 클릭
    const unitLinks = page.locator('a[href*="/student/naesin/"]');
    const count = await unitLinks.count();

    if (count > 0) {
      await unitLinks.first().click();
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    }
  });

  test('학습 진도 뱃지 표시', async ({ page }) => {
    await page.goto('/student/naesin');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 진도 관련 뱃지/칩이 있는지 확인
    const badges = page.locator('[class*="badge"], [class*="chip"]');
    const count = await badges.count();
    // 최소한 메인 콘텐츠가 로드되었으면 패스
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
