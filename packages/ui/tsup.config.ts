import { defineConfig } from 'tsup'
import { copyFileSync } from 'node:fs'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  noExternal: ['react-markdown', 'rehype-highlight', 'remark-gfm'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' }
  },
  async onSuccess() {
    copyFileSync('src/styles/base.css', 'dist/base.css')
    const { readFileSync, writeFileSync } = await import('node:fs')
    for (const f of ['dist/index.mjs', 'dist/index.cjs']) {
      writeFileSync(f, '"use client";\n' + readFileSync(f, 'utf8'))
    }
  },
})
