import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'boss',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/boss.json',
      },
      testMatch: /boss\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'student',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/student.json',
      },
      testMatch: /student.*\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      testMatch: /admin\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'teacher',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/teacher.json',
      },
      testMatch: /teacher\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'logged-out',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: /(login|signup)\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
