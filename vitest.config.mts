import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/env.ts'],
    globalSetup: ['tests/setup/global.ts'],
    // כל הבדיקות משתמשות באותו מסד נתונים לבדיקות – מריצים אחת אחרי השנייה
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
