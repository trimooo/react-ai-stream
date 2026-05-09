import React from 'react'

// ─── primitives ─────────────────────────────────────────────────────────────

function Box({
  label,
  sub,
  bg = '#f1f5f9',
  mono = false,
}: {
  label: string
  sub?: string
  bg?: string
  mono?: boolean
}): React.ReactElement {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '9px 14px', textAlign: 'center', flex: '1 1 auto', minWidth: 120 }}>
      <div style={{ fontWeight: 600, fontSize: 12.5, color: '#0f172a', fontFamily: mono ? 'monospace' : 'system-ui, sans-serif' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Layer({
  label,
  bg,
  children,
}: {
  label: string
  bg: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div style={{ background: bg, padding: '14px 20px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Divider({ label }: { label: string }): React.ReactElement {
  return (
    <div style={{ borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5px 20px', fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', gap: 8 }}>
      <span style={{ letterSpacing: '0.04em' }}>{label}</span>
    </div>
  )
}

function Row({ children, gap = 8 }: { children: React.ReactNode; gap?: number }): React.ReactElement {
  return <div style={{ display: 'flex', gap, flexWrap: 'wrap', marginBottom: 8 }}>{children}</div>
}

// ─── full architecture diagram ───────────────────────────────────────────────

export function FullArchDiagram(): React.ReactElement {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', fontFamily: 'system-ui, sans-serif', margin: '24px 0' }}>

      {/* UI layer */}
      <Layer label="Your React app" bg="#f8fafc">
        <Row>
          <Box label="Custom UI" sub="Tailwind · shadcn/ui · any" bg="#ede9fe" />
          <Box label="<Chat />" sub="MessageList · ChatInput · MarkdownRenderer" bg="#ede9fe" />
        </Row>
        <div style={{ display: 'flex', justifyContent: 'center', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', margin: '2px 0 8px' }}>
          messages · loading · stop · sendMessage
        </div>

        {/* Hook */}
        <Row>
          <Box label="useAIChat()" sub="useSyncExternalStore · AbortController · lazy client init" bg="#dbeafe" mono />
        </Row>

        {/* Store + Client side-by-side */}
        <Row>
          <Box label="Zustand store" sub="messages[] · loading · error" bg="#f1f5f9" />
          <Box label="SSE parser + normalizer" sub="ReadableStream → StreamChunk" bg="#f1f5f9" mono />
        </Row>
      </Layer>

      <Divider label="↕  HTTP POST  ·  text/event-stream  ·  AbortSignal  ↕" />

      {/* Server layer */}
      <Layer label="Your server — any language, any framework" bg="#ffffff">
        <Row>
          <Box label="/api/chat" sub="Next.js · Express · FastAPI · Go · Rails · Cloudflare Workers" bg="#dcfce7" mono />
        </Row>
      </Layer>

      <Divider label="↕  provider API calls  ↕" />

      {/* LLM layer */}
      <Layer label="LLM Providers" bg="#fffbeb">
        <Row gap={6}>
          <Box label="Anthropic" sub="Claude 3.5 · 3 · Haiku" bg="#fce7f3" />
          <Box label="OpenAI" sub="GPT-4o · o1 · mini" bg="#fef9c3" />
          <Box label="Groq" sub="Llama · Mixtral · Gemma" bg="#dbeafe" />
          <Box label="Custom / Local" sub="Ollama · vLLM · any endpoint" bg="#dcfce7" />
        </Row>
      </Layer>
    </div>
  )
}

// ─── provider abstraction diagram (kept for why-backend-agnostic page) ───────

export function ProviderAbstractionDiagram(): React.ReactElement {
  return (
    <div style={{ margin: '24px 0', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <Layer label="Browser" bg="#f8fafc">
        <Row>
          <Box label="useAIChat()" sub="React hook" bg="#ede9fe" mono />
          <Box label="MessageStore" sub="messages · loading · error" bg="#f1f5f9" />
        </Row>
        <Row>
          <Box label="AIClient" sub="fetch + SSE reader" bg="#dbeafe" mono />
          <Box label="CustomProvider" sub="/api/chat endpoint" bg="#dcfce7" mono />
          <Box label="OpenAIProvider" sub="direct (dev only)" bg="#fef9c3" />
          <Box label="AnthropicProvider" sub="direct (dev only)" bg="#fce7f3" />
        </Row>
      </Layer>
      <Divider label="↕  HTTP POST · SSE stream · AbortSignal  ↕" />
      <Layer label="Your server (any stack)" bg="#fff">
        <Row>
          <Box label="/api/chat" sub="Next.js · Express · FastAPI · Go · Rails" bg="#dcfce7" mono />
          <Box label="Any LLM" sub="Anthropic · OpenAI · Groq · Mistral · local" bg="#fef9c3" />
        </Row>
      </Layer>
    </div>
  )
}

// ─── streaming pipeline diagram ──────────────────────────────────────────────

export function StreamingPipelineDiagram(): React.ReactElement {
  function Step({
    n,
    label,
    sub,
    color,
  }: {
    n: number
    label: string
    sub: string
    color: string
  }): React.ReactElement {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 2 }}>
          {n}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{sub}</div>
        </div>
      </div>
    )
  }

  function VLine(): React.ReactElement {
    return <div style={{ width: 1, height: 16, background: '#e2e8f0', marginLeft: 11 }} />
  }

  return (
    <div style={{ margin: '24px 0', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <Step n={1} label='sendMessage("Hello")' sub="User message added · loading → true · POST opens" color="#6366f1" />
      <VLine />
      <Step n={2} label='data: {"type":"text","text":"Hi"}' sub="onToken fires · content grows in real time" color="#0ea5e9" />
      <VLine />
      <Step n={3} label='data: {"type":"text","text":"!"}' sub="onToken fires · React re-renders once per chunk" color="#0ea5e9" />
      <VLine />
      <Step n={4} label='data: {"type":"done"}' sub="onComplete(finalMessage) fires · loading → false" color="#22c55e" />
      <VLine />
      <Step n={5} label="stop() [optional]" sub="AbortController.abort() · partial content preserved in messages" color="#f97316" />
    </div>
  )
}
