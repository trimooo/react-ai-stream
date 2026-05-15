import { text, select, confirm, isCancel } from '@clack/prompts'

export type Platform = 'nextjs' | 'vite-react' | 'vite-vue' | 'express' | 'fastapi' | 'html'
export type Provider = 'openai' | 'anthropic' | 'groq' | 'custom'
export type UI = 'chat' | 'tailwind' | 'hooks'
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'pip' | 'uv'

export interface ProjectConfig {
  projectName: string
  platform: Platform
  provider: Provider | null
  ui: UI | null
  packageManager: PackageManager
  install: boolean
}

const FRONTEND_PLATFORMS: Platform[] = ['nextjs', 'vite-react', 'vite-vue', 'html']
const NODE_PLATFORMS: Platform[] = ['nextjs', 'vite-react', 'vite-vue', 'express']
const PYTHON_PLATFORMS: Platform[] = ['fastapi']
const PROVIDER_PLATFORMS: Platform[] = ['nextjs', 'express', 'fastapi']
const UI_PLATFORMS: Platform[] = ['nextjs']

function detectPackageManager(): PackageManager {
  const agent = process.env['npm_config_user_agent'] ?? ''
  if (agent.startsWith('pnpm')) return 'pnpm'
  if (agent.startsWith('yarn')) return 'yarn'
  if (agent.startsWith('bun')) return 'bun'
  return 'npm'
}

export async function runPrompts(): Promise<ProjectConfig | null> {
  const projectName = await text({
    message: 'Project name',
    placeholder: 'my-ai-app',
    defaultValue: 'my-ai-app',
    validate: (v) => {
      if (!/^[a-z0-9_-]+$/i.test(v)) return 'Use letters, numbers, hyphens, or underscores only'
    },
  })
  if (isCancel(projectName)) return null

  const platform = await select<Platform>({
    message: 'Platform / language',
    options: [
      { value: 'nextjs',     label: 'Next.js',      hint: 'Full-stack · React 19 · App Router (recommended)' },
      { value: 'vite-react', label: 'Vite + React',  hint: 'Frontend SPA · connects to any RAIS backend' },
      { value: 'vite-vue',   label: 'Vite + Vue 3',  hint: 'Frontend SPA · @react-ai-stream/vue composable' },
      { value: 'express',    label: 'Express.js',    hint: 'Node.js backend · raisMiddleware · TypeScript' },
      { value: 'fastapi',    label: 'FastAPI',        hint: 'Python backend · rais package · async streaming' },
      { value: 'html',       label: 'Plain HTML',    hint: 'Zero build step · single file · any RAIS endpoint' },
    ],
  })
  if (isCancel(platform)) return null

  let provider: Provider | null = null
  if (PROVIDER_PLATFORMS.includes(platform as Platform)) {
    const providerOptions: Array<{ value: Provider; label: string; hint: string }> =
      platform === 'fastapi'
        ? [
            { value: 'openai',    label: 'OpenAI',    hint: 'GPT-4o via /v1/chat/completions' },
            { value: 'anthropic', label: 'Anthropic', hint: 'Claude via /v1/messages' },
            { value: 'groq',      label: 'Groq',      hint: 'Llama · OpenAI-compatible · free tier' },
          ]
        : [
            { value: 'openai',    label: 'OpenAI',            hint: 'GPT-4o via /v1/chat/completions' },
            { value: 'anthropic', label: 'Anthropic',         hint: 'Claude via /v1/messages' },
            { value: 'groq',      label: 'Groq',              hint: 'Llama · OpenAI-compatible · free tier' },
            { value: 'custom',    label: 'Custom endpoint',   hint: 'Bring your own RAIS-compliant server' },
          ]

    provider = (await select<Provider>({ message: 'LLM provider', options: providerOptions })) as Provider
    if (isCancel(provider)) return null
  }

  let ui: UI | null = null
  if (UI_PLATFORMS.includes(platform as Platform)) {
    ui = (await select<UI>({
      message: 'UI style',
      options: [
        { value: 'chat',     label: 'Drop-in <Chat>',   hint: '@react-ai-stream/ui — streaming chat in 3 lines' },
        { value: 'tailwind', label: 'Custom Tailwind',  hint: 'Tailwind CSS chat UI you fully own' },
        { value: 'hooks',    label: 'Hooks only',       hint: 'Just useAIChat — wire your own UI' },
      ],
    })) as UI
    if (isCancel(ui)) return null
  }

  const isPython = PYTHON_PLATFORMS.includes(platform as Platform)
  const isHTML = platform === 'html'

  let packageManager: PackageManager
  if (isHTML) {
    packageManager = 'npm' // irrelevant, won't be used
  } else if (isPython) {
    const pm = await select<PackageManager>({
      message: 'Python package manager',
      options: [
        { value: 'pip',     label: 'pip',     hint: 'pip install -r requirements.txt' },
        { value: 'uv',      label: 'uv',      hint: 'uv sync  (faster, modern)' },
      ],
    })
    if (isCancel(pm)) return null
    packageManager = pm as PackageManager
  } else {
    const detected = detectPackageManager()
    const pm = await select<PackageManager>({
      message: 'Package manager',
      options: [
        { value: 'pnpm', label: 'pnpm', hint: detected === 'pnpm' ? '(detected)' : '' },
        { value: 'npm',  label: 'npm',  hint: detected === 'npm'  ? '(detected)' : '' },
        { value: 'yarn', label: 'yarn', hint: detected === 'yarn' ? '(detected)' : '' },
        { value: 'bun',  label: 'bun',  hint: detected === 'bun'  ? '(detected)' : '' },
      ],
    })
    if (isCancel(pm)) return null
    packageManager = pm as PackageManager
  }

  const install = isHTML
    ? false
    : ((await confirm({ message: 'Install dependencies now?', initialValue: true })) as boolean)
  if (isCancel(install)) return null

  return {
    projectName: projectName as string,
    platform: platform as Platform,
    provider,
    ui,
    packageManager,
    install: install as boolean,
  }
}
