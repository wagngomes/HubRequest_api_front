import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/server.ts',
        'src/app.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
})
