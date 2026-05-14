import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  noExternal: [/picocolors/],
  external: ['openai', '@anthropic-ai/sdk'],
  banner: { js: '#!/usr/bin/env node' },
  target: 'node18',
})
