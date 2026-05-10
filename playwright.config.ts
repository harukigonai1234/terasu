import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
  },
  webServer: {
    command: 'npx vite --config playground/vite.config.ts playground --port 5174',
    port: 5174,
    reuseExistingServer: true,
  },
})
