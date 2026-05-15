import { intro, outro, cancel } from '@clack/prompts'
import pc from 'picocolors'
import { runPrompts } from './prompts.js'
import { scaffold } from './scaffold.js'
import type { ProjectConfig } from './prompts.js'

function buildOutro(config: ProjectConfig): string {
  const { projectName: name, platform, packageManager: pm, install } = config

  const cd = `  ${pc.cyan('cd')} ${name}`
  const docsUrl = 'https://react-ai-stream-docs.vercel.app'

  if (platform === 'html') {
    return (
      `${pc.green('✓')} Your app is ready!\n\n` +
      `${cd}\n` +
      `  ${pc.dim('Then open')} ${pc.cyan('index.html')} ${pc.dim('in your browser — no build step needed.')}\n\n` +
      `  ${pc.dim('Docs:')} ${pc.underline(docsUrl)}`
    )
  }

  if (platform === 'fastapi') {
    const envStep = `  ${pc.cyan('cp')} .env.example .env${pc.dim('   # add your API key')}`
    const installStep = install
      ? ''
      : pm === 'uv'
        ? `  ${pc.cyan('uv pip install -r requirements.txt')}\n`
        : `  ${pc.cyan('pip install -r requirements.txt')}\n`
    return (
      `${pc.green('✓')} Your app is ready!\n\n` +
      `${cd}\n` +
      `${envStep}\n` +
      installStep +
      `  ${pc.cyan('uvicorn main:app --reload')}${pc.dim('   # http://localhost:8000')}\n\n` +
      `  ${pc.dim('Docs:')} ${pc.underline(docsUrl)}`
    )
  }

  if (platform === 'express') {
    const envStep = `  ${pc.cyan('cp')} .env.example .env${pc.dim('   # add your API key')}`
    const installStep = install ? '' : `  ${pc.cyan(`${pm} install`)}\n`
    return (
      `${pc.green('✓')} Your app is ready!\n\n` +
      `${cd}\n` +
      `${envStep}\n` +
      installStep +
      `  ${pc.cyan(`${pm} run dev`)}${pc.dim('   # http://localhost:3001')}\n\n` +
      `  ${pc.dim('Tip:')} Connect any RAIS frontend to ${pc.cyan('http://localhost:3001/api/chat')}\n` +
      `  ${pc.dim('Docs:')} ${pc.underline(docsUrl)}`
    )
  }

  if (platform === 'vite-react' || platform === 'vite-vue') {
    const installStep = install ? '' : `  ${pc.cyan(`${pm} install`)}\n`
    const tech = platform === 'vite-vue' ? 'Vue 3' : 'React'
    return (
      `${pc.green('✓')} Your ${tech} frontend is ready!\n\n` +
      `${cd}\n` +
      `  ${pc.cyan('cp')} .env.example .env.local${pc.dim('   # set VITE_API_URL')}\n` +
      installStep +
      `  ${pc.cyan(`${pm} run dev`)}${pc.dim('   # http://localhost:5173')}\n\n` +
      `  ${pc.dim('Tip:')} Also scaffold an Express or FastAPI backend, then point VITE_API_URL at it.\n` +
      `  ${pc.dim('Docs:')} ${pc.underline(docsUrl)}`
    )
  }

  // Next.js (default)
  const installStep = install ? '' : `  ${pc.cyan(`${pm} install`)}\n`
  return (
    `${pc.green('✓')} Your app is ready!\n\n` +
    `${cd}\n` +
    `  ${pc.cyan('cp')} .env.example .env.local${pc.dim('   # add your API key')}\n` +
    installStep +
    `  ${pc.cyan(`${pm} run dev`)}${pc.dim('   # http://localhost:3000')}\n\n` +
    `  ${pc.dim('Docs:')} ${pc.underline(docsUrl)}`
  )
}

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
  outro(buildOutro(config))
}

main().catch((err: unknown) => {
  console.error(pc.red('Error:'), err instanceof Error ? err.message : String(err))
  process.exit(1)
})
