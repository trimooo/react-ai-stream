import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { spinner } from '@clack/prompts'
import pc from 'picocolors'
import type { ProjectConfig } from './prompts.js'

// tsup injects __dirname when bundling to CJS
declare const __dirname: string

const TEMPLATES_DIR = join(__dirname, '..', 'templates')

async function copyDir(src: string, dest: string, replacements: Record<string, string>) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    // Leading underscore renames: _package.json → package.json, _gitignore → .gitignore
    const destName = entry.name.startsWith('_') ? entry.name.slice(1) : entry.name
    const destPath = join(dest, destName)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, replacements)
    } else {
      let content = await fs.readFile(srcPath, 'utf-8')
      for (const [key, val] of Object.entries(replacements)) {
        content = content.replaceAll(key, val)
      }
      await fs.writeFile(destPath, content, 'utf-8')
    }
  }
}

function detectPackageManager(): string {
  const agent = process.env['npm_config_user_agent'] ?? ''
  if (agent.startsWith('pnpm')) return 'pnpm'
  if (agent.startsWith('yarn')) return 'yarn'
  return 'npm'
}

function runInstall(cwd: string, pm: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(pm, ['install'], { cwd, stdio: 'inherit', shell: true })
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${pm} install exited with code ${code}`)),
    )
  })
}

export async function scaffold(config: ProjectConfig) {
  const s = spinner()
  const destDir = join(process.cwd(), config.projectName)

  const replacements: Record<string, string> = {
    __PROJECT_NAME__: config.projectName,
  }

  s.start(`Scaffolding ${pc.cyan(config.projectName)}`)

  // Copy base provider template
  const templateDir = join(TEMPLATES_DIR, `nextjs-${config.provider}`)
  await copyDir(templateDir, destDir, replacements)

  // Apply UI overlay if not the default (chat)
  if (config.ui !== 'chat') {
    const overlayDir = join(TEMPLATES_DIR, `overlay-${config.ui}`)
    const overlayExists = await fs
      .access(overlayDir)
      .then(() => true)
      .catch(() => false)
    if (overlayExists) await copyDir(overlayDir, destDir, replacements)
  }

  s.stop(`${pc.green('✓')} Created ${pc.cyan(config.projectName)}`)

  if (config.install) {
    const pm = detectPackageManager()
    s.start(`Installing dependencies with ${pc.cyan(pm)}`)
    try {
      await runInstall(destDir, pm)
      s.stop(`${pc.green('✓')} Dependencies installed`)
    } catch (err) {
      s.stop(
        `${pc.yellow('!')} Install failed — run ${pc.cyan(`${pm} install`)} inside the project manually`,
      )
    }
  }
}
