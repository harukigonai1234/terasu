import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['src/ui.test.ts', 'happy-dom'],
      ['src/renderer.test.ts', 'happy-dom'],
      ['playground/playground.test.ts', 'happy-dom'],
    ],
    setupFiles: ['./test-setup.ts'],
  },
})
