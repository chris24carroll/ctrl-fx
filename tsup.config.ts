import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    effects: 'src/effects.ts',
    testing: 'src/testing.ts',
    router: 'src/router.ts',
    webcomponent: 'src/webcomponent.ts',
    'dom/index': 'src/dom/index.ts',
    'db/index': 'src/db/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: true,
})
