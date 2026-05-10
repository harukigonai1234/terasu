import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['src/ui.test.ts', 'happy-dom'],
      ['src/ui-react.test.tsx', 'happy-dom'],
      ['src/renderer.test.ts', 'happy-dom'],
      ['playground/playground.test.ts', 'happy-dom'],
    ],
    setupFiles: ['./test-setup.ts'],
  },
})
