import { intro, outro, cancel } from '@clack/prompts'
import pc from 'picocolors'
import { runPrompts } from './prompts.js'
import { scaffold } from './scaffold.js'

async function main() {
  console.log()
  intro(pc.bgCyan(pc.black(' create-ai-stream-app ')))

  const config = await runPrompts()
  if (!config) {
    cancel('Setup cancelled.')
    process.exit(0)
  }

  await scaffold(config)

  console.log()
  outro(
    `${pc.green('✓')} Your app is ready!\n\n` +
      `  ${pc.dim('Next steps:')}\n` +
      `  ${pc.cyan('cd')} ${config.projectName}\n` +
      `  ${pc.cyan('cp')} .env.example .env.local${pc.dim('   # add your API key')}\n` +
      (config.install ? '' : `  ${pc.cyan('pnpm install')}\n`) +
      `  ${pc.cyan('pnpm dev')}${pc.dim('                    # http://localhost:3000')}\n\n` +
      `  ${pc.dim('Docs:')} ${pc.underline('https://react-ai-stream-docs.vercel.app')}`,
  )
}

main().catch((err: unknown) => {
  console.error(pc.red('Error:'), err instanceof Error ? err.message : String(err))
  process.exit(1)
})
