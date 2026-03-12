import { test, expect } from '@playwright/test';

test.describe('보카 관리 플로우 (boss)', () => {
  test('대시보드 → 총관리자 대시보드 표시', async ({ page }) => {
    await page.goto('/boss');

    await expect(page.locator('h1').getByText('총관리자 대시보드')).toBeVisible({ timeout: 10000 });
  });

  test('올킬보카 관리 페이지 표시', async ({ page }) => {
    await page.goto('/boss/voca');

    // h2 타이틀로 특정
    await expect(page.locator('h2').getByText('올킬보카 관리')).toBeVisible({ timeout: 10000 });
  });

  test('올킬보카 관리에서 교재 추가 버튼 표시', async ({ page }) => {
    await page.goto('/boss/voca');

    await expect(page.locator('h2').getByText('올킬보카 관리')).toBeVisible({ timeout: 10000 });

    // 교재 추가 버튼
    const addButton = page.getByRole('button', { name: /추가/ });
    await expect(addButton).toBeVisible();
  });
});
