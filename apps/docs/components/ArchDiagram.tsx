import React from 'react'

const box = (
  label: string,
  sub: string,
  hue: string,
): React.ReactElement => (
  <div
    style={{
      background: hue,
      borderRadius: 8,
      padding: '10px 14px',
      minWidth: 140,
      textAlign: 'center',
    }}
  >
    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', fontFamily: 'monospace' }}>
      {label}
    </div>
    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>
  </div>
)

const arrow = (label?: string): React.ReactElement => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0 4px' }}>
    {label && <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{label}</span>}
    <span style={{ color: '#cbd5e1', fontSize: 18, lineHeight: 1 }}>→</span>
  </div>
)

const arrowDown = (label?: string): React.ReactElement => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 0' }}>
    {label && <span style={{ fontSize: 10, color: '#94a3b8' }}>{label}</span>}
    <span style={{ color: '#cbd5e1', fontSize: 18, lineHeight: 1 }}>↕</span>
  </div>
)

const section = (
  title: string,
  children: React.ReactNode,
  bg: string,
): React.ReactElement => (
  <div style={{ background: bg, padding: '16px 20px' }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#94a3b8',
        marginBottom: 12,
      }}
    >
      {title}
    </div>
    {children}
  </div>
)

export function ProviderAbstractionDiagram(): React.ReactElement {
  return (
    <div style={{ margin: '24px 0', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      {section(
        'Browser',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {box('useAIChat()', 'React hook', '#ede9fe')}
            {arrow()}
            {box('MessageStore', 'messages · loading · error', '#f1f5f9')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 0 }}>
            {box('AIClient', 'fetch + SSE reader', '#dbeafe')}
            {arrow('→ one of')}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {box('CustomProvider', '/api/chat endpoint', '#dcfce7')}
              {box('OpenAIProvider', 'direct (dev)', '#fef9c3')}
              {box('AnthropicProvider', 'direct (dev)', '#fce7f3')}
            </div>
          </div>
        </div>,
        '#f8fafc',
      )}
      <div style={{ borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '6px 20px' }}>
        {arrowDown()}
        <span style={{ fontSize: 11, color: '#94a3b8' }}>HTTP POST · SSE stream · AbortSignal</span>
        {arrowDown()}
      </div>
      {section(
        'Your server (any stack)',
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {box('/api/chat', 'Next.js · Express · FastAPI · Go · Rails', '#dcfce7')}
          {arrow()}
          {box('Any LLM', 'Anthropic · OpenAI · Groq · Mistral · local', '#fef9c3')}
        </div>,
        '#fff',
      )}
    </div>
  )
}

export function StreamingPipelineDiagram(): React.ReactElement {
  const step = (
    n: number,
    label: string,
    sub: string,
    color: string,
  ): React.ReactElement => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {n}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )

  const vline = (): React.ReactElement => (
    <div style={{ width: 1, height: 16, background: '#e2e8f0', marginLeft: 11 }} />
  )

  return (
    <div
      style={{
        margin: '24px 0',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        background: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {step(1, 'sendMessage("Hello")', 'User message added · loading → true · POST opens', '#6366f1')}
      {vline()}
      {step(2, 'data: {"type":"text","text":"Hi"}', 'onToken("Hi") fires · content grows in real time', '#0ea5e9')}
      {vline()}
      {step(3, 'data: {"type":"text","text":"!"}', 'onToken("!") fires · React re-renders once per chunk', '#0ea5e9')}
      {vline()}
      {step(4, 'data: {"type":"done"}', 'onComplete(finalMessage) fires · loading → false', '#22c55e')}
      {vline()}
      {step(5, 'stop() [optional]', 'AbortController.abort() · partial content preserved', '#f97316')}
    </div>
  )
}
