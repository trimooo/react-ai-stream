export const runtime = 'nodejs'

// ── knowledge base ────────────────────────────────────────────────────────────

const KB = {
  greeting: [
    `Hey! I'm the AI Stream Studio assistant — happy to help. I know everything about react-ai-stream, the RAIS protocol, how to install and use the SDK, and what you can build with it. What's on your mind?`,
    `Hi there! Ask me anything about react-ai-stream, the RAIS protocol, setting up your first streaming endpoint, or what kinds of apps you can build. I'm here to help.`,
    `Hello! Great to meet you. I can walk you through the react-ai-stream SDK, explain the RAIS protocol, help with installation, or brainstorm what you could build. Where would you like to start?`,
  ],

  project: `react-ai-stream is an open-source TypeScript SDK that makes building real-time AI streaming interfaces much simpler than doing it from scratch.

Here's what makes it special: it's built around the RAIS Protocol — a tiny, provider-agnostic streaming standard. That means you write your frontend once, and you can swap between Groq, OpenAI, Anthropic, or any local model without changing a single line of React code.

The SDK ships as three focused packages:
• @react-ai-stream/core — the streaming engine (SSE parser, RAIS types, AbortController integration)
• @react-ai-stream/react — React hooks (useStreamingChat, useStreamInspect)
• @react-ai-stream/ui — ready-made components (ChatWindow, MessageBubble, StreamingText)

It's free, open-source, and the whole thing is on GitHub at github.com/trimooo/react-ai-stream.`,

  install: `Getting started takes about two minutes. Here's the full setup:

Step 1 — Install the packages:
npm install @react-ai-stream/react @react-ai-stream/core
# or
pnpm add @react-ai-stream/react @react-ai-stream/core
# or
yarn add @react-ai-stream/react @react-ai-stream/core

Step 2 — Use the hook in your React component:
import { useStreamingChat } from '@react-ai-stream/react'

export function MyChat() {
  const { messages, sendMessage, isStreaming } = useStreamingChat({
    endpoint: '/api/chat',
  })

  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <button onClick={() => sendMessage('Hello!')} disabled={isStreaming}>
        Send
      </button>
    </div>
  )
}

Step 3 — Create a RAIS endpoint. In Next.js App Router (app/api/chat/route.ts):
import { streamText } from 'ai' // or any streaming library
import { toRAIS } from '@react-ai-stream/core'

export async function POST(req: Request) {
  const { messages } = await req.json()
  // ... call your AI provider, then stream back in RAIS format
}

The Templates page in AI Stream Studio has copy-paste starters for Next.js, Express, FastAPI, and more — so you don't have to write the server from scratch.`,

  rais: `The RAIS Protocol (React AI Streaming) is a minimal streaming contract with just three event types — and that simplicity is the whole point.

The three events:

1. Text event — a chunk of content arriving:
{ "type": "text", "text": "Hello " }

2. Done event — the stream is complete (always last, exactly once):
{ "type": "done" }

3. Error event — something went wrong:
{ "type": "error", "error": "Rate limit exceeded" }

These events are sent over SSE (Server-Sent Events) — the browser's native streaming format. Each line looks like:
data: {"type":"text","text":"Hello "}

That's literally the entire protocol. No versioning complexity, no vendor lock-in, no proprietary format.

Why does this matter? Every other provider (OpenAI, Groq, Anthropic) has its own SSE format. RAIS normalizes them so your frontend just handles three predictable event types regardless of which AI is behind the curtain.

The response you're reading right now is being delivered as a RAIS-compliant stream — you can verify it in the Inspect tab.`,

  packages: `The SDK splits into three packages so you only install what you need:

@react-ai-stream/core — Works in any JS/TS environment (Node.js, edge, browser):
• parseSSE(stream) — async iterable that turns a ReadableStream into RAIS events
• Full TypeScript types: StreamChunk, DoneChunk, ErrorChunk, RAISEvent
• AbortController integration built in
• Zero dependencies

@react-ai-stream/react — React hooks built on top of core:
• useStreamingChat(config) — manages the full chat lifecycle: message history, streaming state, error recovery, abort
• useStreamInspect(config) — raw chunk inspection with per-chunk timing (used by the Inspect tool you're in right now)
• Works with React 18+ and React 19

@react-ai-stream/ui — Pre-built UI components:
• ChatWindow — full chat layout (messages + input bar)
• MessageBubble — renders a single message with optional streaming cursor
• StreamingText — inline streaming text for non-chat contexts (think live search results)
• BYO styles — no CSS bundled, works with Tailwind, CSS modules, or plain CSS

Install just what you need: if you only want the hooks without the components, skip @react-ai-stream/ui.`,

  owner: `react-ai-stream was created by Trimo, a developer with GitHub handle @trimooo.

The project started as a personal tool to solve the frustration of wiring up AI streaming from scratch every time — different providers, different formats, same boilerplate. The RAIS protocol emerged from that as a clean abstraction layer.

AI Stream Studio (the playground you're using right now) is the developer tooling layer built on top of the SDK. Trimo built both to give developers a way to inspect, benchmark, and compare streaming endpoints without building custom tooling every time.

Both are fully open-source. Contributions, bug reports, and feedback are welcome at:
github.com/trimooo/react-ai-stream`,

  useCases: `react-ai-stream is designed for anything that needs live AI output — here are the most common use cases:

Conversational apps:
• AI chatbots and assistants (like what you're using right now)
• Customer support automation with streaming replies
• FAQ and Q&A systems with live answers

Developer tools:
• Code editors with real-time AI completions (think GitHub Copilot, but your own)
• Terminal assistants that explain errors as they're diagnosed
• Code review tools with streaming suggestions

Content and writing:
• Document editors with inline AI suggestions
• Blog post and copywriting generators
• Email drafting assistants

Data and search:
• AI-powered search with streaming results
• Real-time data dashboards with AI commentary
• Spreadsheet assistants that explain formulas as they write them

Education and tutoring:
• Step-by-step math and coding tutors that show their reasoning
• Language learning with live conversation
• Interactive documentation

The key advantage: because RAIS is provider-agnostic, you can build once and switch AI providers with zero frontend changes. Move from Groq to Anthropic to a local model without touching your React components.`,

  studio: `AI Stream Studio is the developer playground for the react-ai-stream ecosystem — think of it as Postman, but purpose-built for AI streaming.

Tools available today:

Chat — what you're using right now. Connect any provider (Groq, OpenAI, Anthropic, NVIDIA NIM) with your own API key, or use the built-in Local Demo (no key needed).

Inspect — paste any SSE endpoint URL, fire a request, and see every event arrive in real time with exact timestamps. Detects whether the stream is RAIS, OpenAI, or Anthropic format automatically.

Compare — run two endpoints side by side simultaneously. See which is faster, compare TTFB, throughput, and protocol format at a glance.

Benchmark — measure latency and throughput over multiple runs. Get p50/p95 stats, cadence charts, stability grades, and a shareable benchmark report with a reproducibility hash.

Gallery — browse and share benchmark reports. All data is URL-encoded — no backend, fully reproducible.

Templates — copy-paste RAIS server starters for Next.js, Express, FastAPI, and more. Get a working streaming endpoint in under 5 minutes.

Everything is free and open-source.`,

  groq: `Groq is currently the fastest cloud AI inference provider available. With react-ai-stream + Groq you typically see 150–250 tokens/second on Llama 3.3 70B — roughly 3–5× faster than OpenAI.

Getting started:
1. Get a free API key at console.groq.com (takes 30 seconds)
2. In the Chat tab above, select Groq from the provider list
3. Paste your key and start chatting — that's it

Best models on Groq (in order of my recommendation):
• llama-3.3-70b-versatile — best quality, great for complex questions
• llama-3.1-8b-instant — extremely fast, great for prototyping and demos
• mixtral-8x7b-32768 — 32K context window, best for long documents
• gemma2-9b-it — good balance of speed and quality

One thing to know: Groq uses OpenAI-compatible SSE format, not RAIS natively. The @react-ai-stream/core adapter handles that translation automatically — your frontend code is identical regardless.`,

  providers: `AI Stream Studio supports six providers right now:

Groq — fastest throughput (~200 tok/s), generous free tier, OpenAI-compatible format. Best for demos and latency-sensitive apps. Key format: gsk_...

OpenAI — GPT-4o mini and GPT-4o. The default for most teams. Reliable, well-documented. Key format: sk-...

Anthropic — Claude Haiku 4.5 and Claude Sonnet 4.6. Best reasoning quality, great for complex tasks. Key format: sk-ant-...

NVIDIA NIM — Nemotron 70B, Mixtral, Mistral, Phi-3, Gemma 2. Access via NVIDIA API Catalog. Key format: nvapi-...

Local Demo — the project assistant you're talking to right now. No API key needed, runs entirely within AI Stream Studio. RAIS-compliant, streams word by word.

Ollama — run any open-source model locally on your own hardware. No API key, no cost, full privacy.

All external providers go through the /api/proxy route to avoid browser CORS issues. Your API keys are stored only in your browser's localStorage — they're never sent to any server other than the provider's own API.`,

  anthropic: `Anthropic makes Claude — one of the best reasoning models available. In AI Stream Studio you can use:

• Claude Haiku 4.5 — fast and affordable, great for everyday tasks
• Claude Sonnet 4.6 — the best Anthropic model available, excellent for complex reasoning

To use Anthropic in the Chat tab:
1. Get an API key at console.anthropic.com
2. Select Anthropic from the provider list
3. Paste your key (format: sk-ant-...)

Anthropic uses a different SSE format from OpenAI — their events look like:
{ "type": "content_block_delta", "delta": { "type": "text_delta", "text": "..." } }

The react-ai-stream Inspector and Compare tools detect this format automatically and label it as "Anthropic" rather than RAIS. That's not a bug — it means the stream is working correctly, just in Anthropic's native format instead of RAIS.`,

  openai: `OpenAI supports GPT-4o mini, GPT-4o, GPT-4 Turbo, and GPT-3.5 Turbo in AI Stream Studio.

To use OpenAI:
1. Get an API key at platform.openai.com
2. Select OpenAI from the provider list in Chat
3. Paste your key (format: sk-...)

Model recommendations:
• GPT-4o mini — cheapest, still very capable. Start here.
• GPT-4o — best OpenAI model, use for complex tasks
• GPT-4 Turbo — 128K context, good for long documents
• GPT-3.5 — fastest/cheapest, but notably weaker than 4o mini

OpenAI uses their own SSE format (choices[0].delta.content). The Inspector tool detects this and labels streams as "OpenAI format" — everything is working correctly, it's just not RAIS natively.`,

  nvidia: `NVIDIA NIM provides access to large models through the NVIDIA API Catalog.

To use NVIDIA NIM:
1. Get a free API key at build.nvidia.com
2. Select NVIDIA NIM from the provider list in Chat
3. Paste your key (format: nvapi-...)

Available models:
• Nemotron 70B — NVIDIA's flagship, best quality
• Mixtral 8x7B — fast mixture-of-experts model
• Mistral 7B — lightweight and quick
• Phi-3 Mini — very small but surprisingly capable
• Gemma 2 9B — Google's open model via NVIDIA

Tip: if Nemotron 70B fails, try Mistral 7B or Phi-3 Mini first — they're more consistently available across regions. Make sure your nvapi- key has credits and that the model is available in your region.`,

  ollama: `Ollama lets you run open-source AI models locally — no API key, no cost, and your data never leaves your machine.

Setup:
1. Download Ollama from ollama.ai
2. Run: ollama pull llama3.2 (or any model)
3. Ollama starts a local server at localhost:11434
4. In AI Stream Studio Inspect, use the Ollama preset or enter: http://localhost:11434/api/chat

Popular models to try:
• llama3.2 — great general purpose model (2GB)
• llama3.1:8b — fast, capable (4.7GB)
• mistral — solid alternative to Llama (4.1GB)
• codellama — specialized for code (3.8GB)
• phi3 — Microsoft's tiny but capable model (2.3GB)

Note: Ollama uses its own streaming format. The Inspect tool will detect it — it may not show as RAIS-compliant since Ollama doesn't emit RAIS events natively, but the stream itself will work fine.`,

  compliance: `RAIS compliance means your streaming endpoint follows the RAIS Protocol v1 spec. Here's what the compliance checker validates:

R1 — All events have a "type" field: every data line must parse as JSON with a top-level "type" key.

R2 — Text events have a "text" field: when type is "text", there must be a "text" string.

R3 — Done event present exactly once: the stream must end with {"type":"done"} — exactly one, as the last event.

R4 — Error events have an "error" field: when type is "error", there must be an "error" string.

R5 — No unknown event types: the only valid types are "text", "done", and "error".

R6 — Clean abort: if the client disconnects mid-stream, the server should close cleanly without erroring.

If your endpoint uses Groq, OpenAI, or Anthropic directly (without a RAIS adapter), the compliance checker will show those streams as "OpenAI format" or "Anthropic format" — that's not a failure, it just means the format isn't RAIS. To become RAIS-compliant, you'd add a thin adapter on your server that translates the provider's format to RAIS events.`,

  compare: `The Compare tool lets you run two streaming endpoints simultaneously and compare them head-to-head.

What it measures:
• TTFB (Time to First Byte) — how long until the first token arrives
• Throughput — tokens per second across the full response
• Total elapsed time — from request to done event
• Protocol format — RAIS, OpenAI, Anthropic, or unknown
• Token count — total tokens in the response

How to use it:
1. Go to the Compare tab
2. Fill in Endpoint A (URL, headers, body)
3. Fill in Endpoint B
4. Hit Compare — both requests fire simultaneously
5. See results side by side

You can use preset buttons (Groq, OpenAI, etc.) to fill in each side quickly, then just swap in your API key.

The "↗ Share comparison" button generates a URL with all settings encoded — you can send it to a colleague and they'll see the exact same configuration.`,

  benchmark: `The Benchmark tool measures streaming performance over multiple runs to give you statistically meaningful results.

Metrics it reports:
• TTFB p50/p95 — median and 95th percentile time to first byte
• Throughput p50/p95 — median and 95th percentile tokens per second
• Stability grade — A (very consistent), B (some variance), C (high variance), F (unreliable)
• Cadence insight — whether the provider front-loads tokens, ramps up, or streams steadily
• Run hash — a reproducibility fingerprint so others can run the exact same benchmark

How to use it:
1. Go to the Benchmark tab
2. Select a prompt preset (or write your own)
3. Check which providers to test and enter their API keys
4. Set number of runs (3–5 is usually enough)
5. Hit Run — watch the cadence charts fill in live

Results can be shared to the Gallery as a URL-encoded report (no backend, fully reproducible).`,

  inspect: `The Inspect tool is like a browser DevTools network tab, but purpose-built for SSE streaming.

What it shows:
• Every event as it arrives, with exact timestamps (ms since first byte)
• Raw event data (what the server actually sent)
• Format detection — automatically identifies RAIS, OpenAI, or Anthropic format
• A timeline view where bar width represents time between chunks
• Aggregate stats: TTFB, total elapsed, tokens received, tok/s

How to use it:
1. Go to the Inspect tab
2. Enter your endpoint URL (or use a preset)
3. Add headers (e.g. Authorization: Bearer your-key)
4. Add a request body (JSON with a messages array)
5. Hit Inspect Stream — watch events arrive in real time

After inspecting, click "Check RAIS compliance" to run the compliance checker on the same endpoint.

This is great for debugging why a stream feels slow, understanding what events a provider actually sends, or verifying that your own RAIS endpoint is spec-compliant.`,

  templates: `The Templates page has copy-paste server starters for every major framework. Here's what's available:

Next.js App Router (TypeScript) — the most popular setup. Creates app/api/chat/route.ts with a working RAIS streaming endpoint that connects to Groq.

Next.js Pages Router — if you're on the older Next.js pages/ structure.

Express.js — Node.js Express server with RAIS streaming. Good for standalone backends.

FastAPI (Python) — Python async streaming with FastAPI and the openai library. Returns RAIS events.

Each template includes:
• Full working code, not just snippets
• Environment variable setup (.env.example)
• The exact npm/pip install commands
• Comments explaining the RAIS-specific parts

Go to the Templates tab and click any framework to copy the code.`,

  default: `I'm the react-ai-stream project assistant — I know this SDK inside and out. Here's what I can help you with:

Getting started:
• How to install the packages (npm/pnpm/yarn)
• Setting up your first RAIS streaming endpoint
• Which framework template to use (Next.js, Express, FastAPI)

The SDK:
• @react-ai-stream/core, /react, and /ui — what each does
• The useStreamingChat and useStreamInspect hooks
• The RAIS Protocol v1 spec and why it matters

AI Stream Studio tools:
• Chat — how to connect your own API keys (Groq, OpenAI, Anthropic, NVIDIA)
• Inspect — debugging and format detection for any SSE endpoint
• Compare — side-by-side provider comparison
• Benchmark — measuring latency and throughput

Use cases:
• What you can build with react-ai-stream
• Provider recommendations (Groq for speed, Claude for reasoning, etc.)

Just ask — I'll answer as clearly as I can.`,
}

// ── intent router ──────────────────────────────────────────────────────────────

function route(messages: Array<{ role: string; content: string }>): string {
  const last = messages.filter(m => m.role === 'user').at(-1)?.content ?? ''
  const m = last.toLowerCase().trim()

  // greetings
  if (/^(hi|hello|hey|sup|yo|good\s+(morning|afternoon|evening)|howdy|what'?s up|greetings)\b/.test(m)) {
    const greets = KB.greeting
    return greets[Math.floor(Date.now() / 1000) % greets.length]!
  }

  // owner / creator
  if (/who\s*(made|built|created|wrote|is\s*behind|developed|owns)|author|creator|trimooo|trimo\b|owner/.test(m)) return KB.owner

  // installation
  if (/install|npm|yarn|pnpm|setup|set\s*up|quick\s*start|get\s*start|how\s*to\s*use|getting started|import|package\.json|add\s+the/.test(m)) return KB.install

  // RAIS protocol
  if (/\brais\b|protocol|spec(ification)?|event\s*type|done\s*event|text\s*event|error\s*event|complian|streaming\s*format|streaming\s*standard|sse\s*format/.test(m)) return KB.rais

  // compliance checker
  if (/complian|check|r1|r2|r3|r4|r5|r6|pass|fail|valid/.test(m)) return KB.compliance

  // packages / SDK surface
  if (/package|@react[\s-]ai|\/core|\/react|\/ui|\bhook\b|usestreamingchat|usestreaminspe|component|api\s*surface|sdk/.test(m)) return KB.packages

  // studio tools by name
  if (/\binspect\b/.test(m) && !/compliance/.test(m)) return KB.inspect
  if (/\bcompare\b/.test(m)) return KB.compare
  if (/\bbenchmark\b/.test(m)) return KB.benchmark
  if (/\btemplate|starter|boilerplate|scaffold/.test(m)) return KB.templates
  if (/studio|playground|gallery|ecosystem/.test(m)) return KB.studio

  // providers
  if (/groq/.test(m)) return KB.groq
  if (/anthropic|claude\b/.test(m)) return KB.anthropic
  if (/openai|gpt/.test(m)) return KB.openai
  if (/nvidia|nim|nemotron|nvapi/.test(m)) return KB.nvidia
  if (/ollama|local\s*model|run\s*local/.test(m)) return KB.ollama
  if (/provider|api\s*key|model|llm/.test(m)) return KB.providers

  // use cases
  if (/use[\s-]?case|what\s*can\s*(i|you|we)|what\s*could|build|make|create|example|application|project\s*idea|product/.test(m)) return KB.useCases

  // project overview
  if (/what\s*(is|are|about)|explain|describe|tell.*about|overview|project|sdk|react[\s-]ai[\s-]stream/.test(m)) return KB.project

  // catch-all: try topic matching on any word
  if (/groq|openai|anthropic|nvidia|ollama/.test(m)) return KB.providers
  if (/stream|sse|chunk|token/.test(m)) return KB.rais
  if (/hook|component|react/.test(m)) return KB.packages

  return KB.default
}

// ── streaming helper ───────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

// ── route handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let messages: Array<{ role: string; content: string }> = []
  try {
    const body = await req.json() as { messages?: Array<{ role: string; content: string }> }
    messages = body.messages ?? []
  } catch { /* empty body is fine */ }

  const responseText = route(messages)

  // Split into words preserving newlines as their own tokens
  const tokens: string[] = []
  for (const line of responseText.split('\n')) {
    const words = line.split(' ')
    for (let i = 0; i < words.length; i++) {
      if (words[i] !== '') tokens.push(words[i]! + (i < words.length - 1 ? ' ' : ''))
    }
    tokens.push('\n')
  }
  // Remove trailing newline token
  while (tokens.at(-1) === '\n') tokens.pop()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < tokens.length; i++) {
        const text = tokens[i]!
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`)
        )
        // Faster on newlines (no pause), slightly randomised word delay
        if (text !== '\n') {
          // ~50 words/sec base, with slight jitter for naturalness
          await sleep(14 + Math.random() * 10)
        }
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      )
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
