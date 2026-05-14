import type { NextApiRequest, NextApiResponse } from 'next'

const RESPONSES: Record<string, string> = {
  hello: `Hi! I'm the RAIS protocol demo — a live streaming endpoint running right inside this docs site. No API key needed. I speak RAIS: three JSON events over SSE (text, done, error). Ask me anything about the ecosystem — the React hook, Vue composable, Express middleware, Python package, or the protocol spec itself.`,

  react: `The useAIChat hook gives you everything in one call:\n\nconst { messages, sendMessage, loading, stop } = useAIChat({\n  endpoint: '/api/chat',\n})\n\nMessages accumulate as the stream arrives. loading is true while streaming. stop() aborts mid-stream and the partial message stays in history. The hook is fully isolated — run three instances with three endpoints simultaneously and each manages its own state.\n\nInstall: npm i @react-ai-stream/react`,

  vue: `The Vue composable has the same API surface as the React hook:\n\nconst { messages, sendMessage, loading, stop } = useAIChat({\n  endpoint: '/api/chat',\n})\n\nAll return values are Vue shallowRefs — fully reactive. The stream is automatically aborted on onUnmounted so no cleanup is needed.\n\nInstall: npm i @react-ai-stream/vue\n\nThe Vue and React implementations are independent packages. No React dependency in the Vue package.`,

  express: `Add RAIS streaming to Express in two lines:\n\nimport { raisMiddleware } from '@react-ai-stream/express'\napp.post('/api/chat', raisMiddleware({\n  provider: 'anthropic',\n  apiKey: process.env.ANTHROPIC_API_KEY,\n}))\n\nOr write a custom handler that yields events:\n\nraisMiddleware({\n  handler: async function*(messages, signal) {\n    yield { type: 'text', text: 'Hello from Express!' }\n    yield { type: 'done' }\n  }\n})\n\nThe middleware sets all SSE headers, formats data: lines, and wires req.close to the AbortSignal automatically.\n\nInstall: npm i @react-ai-stream/express`,

  python: `The Python package works with FastAPI, Starlette, or any async server:\n\nfrom rais import stream_response\n\n@app.post('/api/chat')\nasync def chat(req: ChatRequest):\n    return StreamingResponse(\n        stream_response(req.messages, provider='openai'),\n        media_type='text/event-stream'\n    )\n\nInstall: pip install "rais[all]"\n\nThis installs the openai and anthropic SDKs alongside the rais package. Supports OpenAI, Anthropic, and any OpenAI-compatible endpoint. Emits fully RAIS-compliant SSE — pass npx rais-compliance out of the box.`,

  protocol: `The RAIS wire format is three JSON events over Server-Sent Events:\n\ndata: {"type":"text","text":"Hello"}\n\ndata: {"type":"text","text":" world"}\n\ndata: {"type":"done"}\n\ndata: {"type":"error","error":"Rate limit hit"}\n\nRequired headers: Content-Type: text/event-stream and Cache-Control: no-cache. A stream ends with either done or error — never both.\n\nUnknown event types are silently ignored, so the protocol can be extended without breaking existing clients. This is how it stays backward-compatible forever.`,

  compliance: `Check any RAIS endpoint in seconds:\n\nnpx rais-compliance http://localhost:3000/api/chat\n\nRuns 10 checks: 7 MUST (normative) + 2 SHOULD (recommended) + 1 abort resilience test. Pass all 10 for the RAIS v1 Recommended badge.\n\nTest against mock scenarios first:\nnpx rais-compliance serve --scenario normal\nnpx rais-compliance serve --scenario malformed\nnpx rais-compliance serve --scenario no-done\n\nAdd to CI: npx rais-compliance http://staging.example.com/api/chat exits non-zero on failure.`,

  install: `30 seconds to a streaming chat:\n\n# Scaffold a full Next.js app\nnpx create-ai-stream-app\n\n# Or install manually\nnpm install @react-ai-stream/react @react-ai-stream/ui\n\nThen in your component:\n\nimport { useAIChat } from '@react-ai-stream/react'\nimport { Chat } from '@react-ai-stream/ui'\nimport '@react-ai-stream/ui/styles'\n\nexport default function Page() {\n  const chat = useAIChat({ endpoint: '/api/chat' })\n  return <Chat {...chat} />\n}\n\nPoint endpoint at any RAIS-compliant server and streaming starts.`,

  devtools: `Drop in the DevTools overlay during development:\n\nimport { useAIChat } from '@react-ai-stream/devtools'\nimport { RAISDevTools } from '@react-ai-stream/devtools'\n\n{process.env.NODE_ENV === 'development' && <RAISDevTools />}\n\nThe import swap is a drop-in — useAIChat from devtools wraps the real hook and emits telemetry to the overlay. A ◈ RAIS button appears at the bottom-right. Click to see live token events, per-session timing, tokens/second, and error traces. Zero production overhead.`,

  ui: `The @react-ai-stream/ui package ships pre-built components:\n\nimport { Chat, MessageList, ChatInput, MarkdownRenderer } from '@react-ai-stream/ui'\nimport '@react-ai-stream/ui/styles'\n\nChat is the full-page drop-in. MessageList and ChatInput are composable pieces if you want to build your own layout. MarkdownRenderer handles code fences with syntax highlighting, tables, and copy-to-clipboard on code blocks.\n\nAll CSS variables are exposed for theming: --ras-bg, --ras-bg-user, --ras-text, --ras-radius, etc.\n\nInstall: npm i @react-ai-stream/ui`,

  default: `RAIS (React AI Stream) is a minimal SSE protocol for AI streaming. Three event types — text, done, error — let any backend talk to any frontend without coupling them together.\n\nThe ecosystem ships today:\n• @react-ai-stream/react — useAIChat hook\n• @react-ai-stream/vue — same API for Vue 3\n• @react-ai-stream/express — server middleware\n• rais (Python) — FastAPI/Starlette helper\n• rais-compliance — npx compliance checker\n• rais-server — zero-config reference server\n• create-ai-stream-app — project scaffolding CLI\n\nAsk me about any of these, or try: "show me the React hook", "what about Vue", "how do I add this to Express", "how does compliance work".`,
}

function pickResponse(message: string): string {
  const m = message.toLowerCase()
  if (m.match(/\b(hi|hello|hey|yo|howdy)\b/)) return RESPONSES.hello
  if (m.match(/\b(vue|composable)\b/)) return RESPONSES.vue
  if (m.match(/\b(express|middleware)\b/)) return RESPONSES.express
  if (m.match(/\b(python|fastapi|starlette|django|pip)\b/)) return RESPONSES.python
  if (m.match(/\b(react|hook|useaichat)\b/)) return RESPONSES.react
  if (m.match(/\b(compliance|test|check|certif)/)) return RESPONSES.compliance
  if (m.match(/\b(protocol|spec|wire|format|sse|event)\b/)) return RESPONSES.protocol
  if (m.match(/\b(install|start|quickstart|npx|create|scaffold)\b/)) return RESPONSES.install
  if (m.match(/\b(devtools|debug|inspect|monitor)\b/)) return RESPONSES.devtools
  if (m.match(/\b(ui|chat|component|markdown|style)\b/)) return RESPONSES.ui
  return RESPONSES.default
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const messages: Array<{ role: string; content: string }> = req.body?.messages ?? []
  const last = messages.filter(m => m.role === 'user').pop()
  const text = pickResponse(last?.content ?? '')

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const chunks = text.split(/(\s+)/)
  let id = 0

  for (const chunk of chunks) {
    if (!chunk) continue
    res.write(`id: ${id++}\ndata: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`)
    await sleep(28 + Math.random() * 28)
  }

  res.write(`id: ${id}\ndata: ${JSON.stringify({ type: 'done' })}\n\n`)
  res.end()
}
