import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './tests/browser', timeout: 30000, fullyParallel: false, workers: 1,
 use: { baseURL: 'http://127.0.0.1:3001', ...devices['Desktop Chrome'], launchOptions: { args: ['--no-sandbox'], executablePath: process.env.CHROMIUM_PATH } },
 webServer: { command: 'npm run start -- --hostname 127.0.0.1 --port 3001', url: 'http://127.0.0.1:3001', reuseExistingServer: false, timeout: 30000, env: { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' } },
});
