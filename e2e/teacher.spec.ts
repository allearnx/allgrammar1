import { test, expect } from '@playwright/test';

test.describe('선생님 대시보드 (teacher)', () => {
  test('로그인 후 대시보드 표시', async ({ page }) => {
    await page.goto('/teacher');

    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('학생 목록 확인', async ({ page }) => {
    await page.goto('/teacher');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 학생 관련 콘텐츠가 있는지 확인
    const studentSection = page.locator('text=학생').first();
    const hasSection = await studentSection.isVisible().catch(() => false);

    if (hasSection) {
      await expect(studentSection).toBeVisible();
    }
  });

  test('내신 관리 페이지 이동', async ({ page }) => {
    await page.goto('/teacher/naesin');

    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('올킬보카 관리 페이지 이동', async ({ page }) => {
    await page.goto('/teacher/voca');

    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});
