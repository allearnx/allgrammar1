import { test as setup, expect } from '@playwright/test';

async function login(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  storagePath: string
) {
  await page.goto('/login');
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await page.context().storageState({ path: storagePath });
}

setup('authenticate boss', async ({ page }) => {
  const email = process.env.TEST_BOSS_EMAIL;
  const password = process.env.TEST_BOSS_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_BOSS_EMAIL, TEST_BOSS_PASSWORD must be set in .env.test');
  }
  await login(page, email, password, 'e2e/.auth/boss.json');
});

setup('authenticate student', async ({ page }) => {
  const email = process.env.TEST_STUDENT_EMAIL;
  const password = process.env.TEST_STUDENT_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD must be set in .env.test');
  }
  await login(page, email, password, 'e2e/.auth/student.json');
});

setup('authenticate admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    setup.skip();
    return;
  }
  await login(page, email, password, 'e2e/.auth/admin.json');
});

setup('authenticate teacher', async ({ page }) => {
  const email = process.env.TEST_TEACHER_EMAIL;
  const password = process.env.TEST_TEACHER_PASSWORD;
  if (!email || !password) {
    setup.skip();
    return;
  }
  await login(page, email, password, 'e2e/.auth/teacher.json');
});
