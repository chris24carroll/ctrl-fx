import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const src = resolve(__dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      'ctrl-fx/router': resolve(src, 'router.ts'),
      'ctrl-fx/effects': resolve(src, 'effects.ts'),
      'ctrl-fx/dom': resolve(src, 'dom/index.ts'),
      'ctrl-fx/db': resolve(src, 'db/public.ts'),
      'ctrl-fx/testing': resolve(src, 'testing.ts'),
      'ctrl-fx': resolve(src, 'index.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'doc/examples/**/*.test.ts'],
  },
})
