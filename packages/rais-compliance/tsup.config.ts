import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  noExternal: [/picocolors/],
  banner: { js: '#!/usr/bin/env node' },
  target: 'node18',
})
