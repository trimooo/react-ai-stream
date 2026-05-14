import { text, select, confirm, isCancel } from '@clack/prompts'

export interface ProjectConfig {
  projectName: string
  provider: 'openai' | 'anthropic' | 'groq' | 'custom'
  ui: 'chat' | 'tailwind' | 'hooks'
  install: boolean
}

export async function runPrompts(): Promise<ProjectConfig | null> {
  const projectName = await text({
    message: 'Project name',
    placeholder: 'my-ai-app',
    defaultValue: 'my-ai-app',
    validate: (v) => {
      if (!/^[a-z0-9_-]+$/i.test(v)) return 'Use only letters, numbers, hyphens, or underscores'
    },
  })
  if (isCancel(projectName)) return null

  const provider = await select({
    message: 'LLM provider',
    options: [
      { value: 'openai', label: 'OpenAI', hint: 'GPT-4o via /v1/chat/completions' },
      { value: 'anthropic', label: 'Anthropic', hint: 'Claude via /v1/messages' },
      { value: 'groq', label: 'Groq', hint: 'Llama via OpenAI-compatible API (free tier)' },
      { value: 'custom', label: 'Custom endpoint', hint: 'Bring your own RAIS-compliant server' },
    ],
  })
  if (isCancel(provider)) return null

  const ui = await select({
    message: 'UI style',
    options: [
      { value: 'chat', label: 'Drop-in <Chat>', hint: '@react-ai-stream/ui — streaming chat in 3 lines' },
      { value: 'tailwind', label: 'Custom Tailwind', hint: 'Tailwind CSS chat UI you fully own' },
      { value: 'hooks', label: 'Hooks only', hint: 'Just useAIChat — wire up your own UI' },
    ],
  })
  if (isCancel(ui)) return null

  const install = await confirm({
    message: 'Install dependencies now?',
    initialValue: true,
  })
  if (isCancel(install)) return null

  return {
    projectName: projectName as string,
    provider: provider as ProjectConfig['provider'],
    ui: ui as ProjectConfig['ui'],
    install: install as boolean,
  }
}
