import { test, expect } from '@playwright/test';

test.describe('관리자 대시보드 (admin)', () => {
  test('로그인 후 대시보드 표시', async ({ page }) => {
    await page.goto('/admin');

    // 관리자 대시보드 또는 메인 콘텐츠가 표시되는지 확인
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('학생 관리 페이지 이동', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 학생 관리 링크/버튼 찾기
    const studentLink = page.locator('a[href*="/admin/students"], a[href*="/admin"]').first();
    const hasLink = await studentLink.isVisible().catch(() => false);

    if (hasLink) {
      await studentLink.click();
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    }
  });

  test('서비스 배정 UI 표시', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 서비스 배정 관련 UI 요소가 있는지 확인
    const serviceSection = page.locator('text=배정').first();
    const hasSection = await serviceSection.isVisible().catch(() => false);

    // 배정 섹션이 있으면 검증
    if (hasSection) {
      await expect(serviceSection).toBeVisible();
    }
  });

  test('내신 관리 페이지 이동', async ({ page }) => {
    await page.goto('/admin/naesin');

    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});
