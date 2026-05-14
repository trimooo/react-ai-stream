import pc from 'picocolors'
import { createRaisServer } from './server.js'
import type { Provider, ServerConfig } from './types.js'

// ─── Default models per provider ─────────────────────────────────────────────
const DEFAULT_MODELS: Record<Provider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  groq: 'llama-3.3-70b-versatile',
}

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(name)
  return i !== -1 && args[i + 1] ? args[i + 1] : undefined
}
const hasFlag = (name: string) => args.includes(name)

if (hasFlag('--help') || hasFlag('-h')) {
  console.log()
  console.log(pc.bold('rais-server — RAIS Protocol v1 reference server'))
  console.log()
  console.log('  Usage: rais-server [options]')
  console.log()
  console.log('  Options:')
  console.log('    --provider <name>   openai | anthropic | groq  (auto-detected from env)')
  console.log('    --model <name>      Model name (default per provider)')
  console.log('    --port <n>          Port to listen on (default: 3001)')
  console.log('    --system <text>     System prompt')
  console.log('    --max-tokens <n>    Max tokens (default: 1024)')
  console.log('    --no-cors           Disable CORS headers')
  console.log()
  console.log('  Environment variables:')
  console.log('    OPENAI_API_KEY      Required for --provider openai')
  console.log('    ANTHROPIC_API_KEY   Required for --provider anthropic')
  console.log('    GROQ_API_KEY        Required for --provider groq')
  console.log()
  console.log('  Examples:')
  console.log('    rais-server                               # auto-detect provider')
  console.log('    rais-server --provider openai')
  console.log('    rais-server --provider anthropic --model claude-sonnet-4-6')
  console.log('    rais-server --provider groq --port 3002')
  console.log()
  console.log('  Test with:')
  console.log('    npx rais-compliance http://localhost:3001/api/chat')
  console.log('    curl -N -X POST http://localhost:3001/api/chat \\')
  console.log("         -H 'Content-Type: application/json' \\")
  console.log(`         -d '{"messages":[{"role":"user","content":"hello"}]}'`)
  console.log()
  process.exit(0)
}

// ─── Provider detection ───────────────────────────────────────────────────────
function detectProvider(): { provider: Provider; apiKey: string; baseURL?: string } | null {
  const explicit = flag('--provider') as Provider | undefined

  if (!explicit) {
    // Auto-detect from env
    if (process.env.ANTHROPIC_API_KEY)
      return { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY }
    if (process.env.OPENAI_API_KEY)
      return { provider: 'openai', apiKey: process.env.OPENAI_API_KEY }
    if (process.env.GROQ_API_KEY)
      return { provider: 'groq', apiKey: process.env.GROQ_API_KEY, baseURL: GROQ_BASE_URL }
    return null
  }

  if (explicit === 'openai') {
    const key = process.env.OPENAI_API_KEY
    if (!key) { console.error(pc.red('  OPENAI_API_KEY is not set')); process.exit(1) }
    return { provider: 'openai', apiKey: key }
  }
  if (explicit === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) { console.error(pc.red('  ANTHROPIC_API_KEY is not set')); process.exit(1) }
    return { provider: 'anthropic', apiKey: key }
  }
  if (explicit === 'groq') {
    const key = process.env.GROQ_API_KEY
    if (!key) { console.error(pc.red('  GROQ_API_KEY is not set')); process.exit(1) }
    return { provider: 'groq', apiKey: key, baseURL: GROQ_BASE_URL }
  }

  console.error(pc.red(`  Unknown provider "${explicit}". Valid: openai | anthropic | groq`))
  process.exit(1)
}

// ─── Start ────────────────────────────────────────────────────────────────────
const detected = detectProvider()

if (!detected) {
  console.log()
  console.log(pc.red('  No API key found.'))
  console.log()
  console.log('  Set one of:')
  console.log('    export OPENAI_API_KEY=sk-...')
  console.log('    export ANTHROPIC_API_KEY=sk-ant-...')
  console.log('    export GROQ_API_KEY=gsk_...')
  console.log()
  console.log('  Or use --provider to specify explicitly.')
  console.log()
  process.exit(1)
}

const port = parseInt(flag('--port') ?? '3001', 10)
const model = flag('--model') ?? DEFAULT_MODELS[detected.provider]
const system = flag('--system')
const maxTokens = parseInt(flag('--max-tokens') ?? '1024', 10)
const cors = !hasFlag('--no-cors')

const config: ServerConfig = {
  port,
  provider: detected.provider,
  model,
  apiKey: detected.apiKey,
  baseURL: detected.baseURL,
  system,
  maxTokens,
  cors,
}

const server = createRaisServer(config)

server.listen(port, () => {
  console.log()
  console.log(pc.bold('  RAIS Server'))
  console.log()
  console.log(`  ${pc.dim('Provider')}    ${pc.cyan(config.provider)}`)
  console.log(`  ${pc.dim('Model')}       ${pc.cyan(config.model)}`)
  console.log(`  ${pc.dim('Endpoint')}    ${pc.green(`http://localhost:${port}/api/chat`)}`)
  if (config.system) {
    const preview = config.system.length > 60 ? config.system.slice(0, 60) + '…' : config.system
    console.log(`  ${pc.dim('System')}      ${pc.dim(preview)}`)
  }
  console.log()
  console.log(`  ${pc.dim('Test with:')}`)
  console.log(pc.dim(`    npx rais-compliance http://localhost:${port}/api/chat`))
  console.log(pc.dim(`    curl -N -X POST http://localhost:${port}/api/chat \\`))
  console.log(pc.dim(`         -H 'Content-Type: application/json' \\`))
  console.log(pc.dim(`         -d '{"messages":[{"role":"user","content":"hello"}]}'`))
  console.log()
  console.log(pc.dim('  Press Ctrl+C to stop.'))
  console.log()
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(pc.red(`  Port ${port} is already in use. Try --port ${port + 1}`))
  } else {
    console.error(pc.red(`  Server error: ${err.message}`))
  }
  process.exit(1)
})

process.on('SIGINT', () => {
  server.close()
  console.log()
  process.exit(0)
})
