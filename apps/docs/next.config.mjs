import nextra from 'nextra'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
})

export default withNextra({
  webpack(config) {
    // Force all packages to use the same React instance (prevents "useContext is null" errors
    // caused by pnpm hoisting React 19 into packages/react/node_modules alongside React 18 here)
    config.resolve.alias['react'] = path.resolve(path.dirname(require.resolve('react')), '.')
    config.resolve.alias['react-dom'] = path.resolve(path.dirname(require.resolve('react-dom')), '.')
    return config
  },
})
