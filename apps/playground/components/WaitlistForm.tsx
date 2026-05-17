'use client'

import { useState } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Plan = 'free' | 'pro' | 'team' | 'enterprise'
type FormState = 'idle' | 'loading' | 'success' | 'error'

const USE_CASES = [
  'Select your use case',
  'AI chatbot / assistant',
  'Internal tooling',
  'Customer support',
  'Developer tooling',
  'SaaS product',
  'Other',
]

// ─── Plan definitions (each plan only shows ITS OWN features) ─────────────────

const PLAN_META: Record<Plan, {
  label: string
  color: string
  price: string
  keyPrefix: string
  limits: string
  features: string[]
  badge?: string
}> = {
  free: {
    label: 'Free',
    color: '#4ade80',
    price: '$0 / forever',
    keyPrefix: 'ras_test_',
    limits: '5,000 tokens/month · 10 req/min',
    features: [
      'Free API key — instant, no card',
      '5,000 tokens/month',
      '10 requests/minute',
      '1 provider at a time',
      'All DevTools (inspector, benchmark, compare)',
      'Community support',
    ],
  },
  pro: {
    label: 'Pro',
    color: '#3B5BFF',
    price: '€10/month',
    keyPrefix: 'ras_live_',
    limits: '100,000 tokens/month · 60 req/min',
    badge: 'Most popular',
    features: [
      'Live API key (ras_live_...)',
      '100,000 tokens/month',
      '60 requests/minute',
      'OpenAI · Anthropic · Groq · Gemini',
      'Analytics dashboard',
      'Request logs + replay',
      'Fallback chains',
      'Email support',
    ],
  },
  team: {
    label: 'Team',
    color: '#e879f9',
    price: '€49/month',
    keyPrefix: 'ras_live_',
    limits: '1,000,000 tokens/month · 300 req/min',
    features: [
      'Live API key (ras_live_...)',
      '1,000,000 tokens/month',
      '300 requests/minute',
      'Everything in Pro',
      'Team workspaces + shared keys',
      'Audit logs',
      'SSO (SAML)',
      'Priority support',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    color: '#f59e0b',
    price: 'Custom',
    keyPrefix: 'ras_live_',
    limits: 'Unlimited tokens · 1,000 req/min',
    features: [
      'Live API key (ras_live_...)',
      'Unlimited tokens',
      '1,000 requests/minute',
      'Self-hosted gateway option',
      'Custom provider integrations',
      'SLA + dedicated support',
      'Private compliance certificate',
    ],
  },
}

// ─── Code snippets per use case ───────────────────────────────────────────────

const GATEWAY = 'https://react-ai-stream-gateway.vercel.app'

function getCodeSnippet(useCase: string, apiKey: string): { install: string; code: string } {
  const key = apiKey || 'YOUR_API_KEY'
  switch (useCase) {
    case 'AI chatbot / assistant':
      return {
        install: 'npm install @react-ai-stream/react',
        code: `import { useAIChat } from '@react-ai-stream/react'

export function Chatbot() {
  const { messages, sendMessage, isStreaming } = useAIChat({
    endpoint: '${GATEWAY}/api/v1/chat',
    extraHeaders: { Authorization: 'Bearer ${key}' },
  })
  return (
    <>
      {messages.map(m => <p key={m.id}>{m.role}: {m.content}</p>)}
      <button onClick={() => sendMessage('Hello!')} disabled={isStreaming}>Send</button>
    </>
  )
}`,
      }
    case 'Customer support':
      return {
        install: 'npm install @react-ai-stream/react',
        code: `import { useAIChat } from '@react-ai-stream/react'

const SYSTEM = 'You are a helpful support agent. Be concise and friendly.'

export function SupportChat() {
  const { messages, sendMessage, isStreaming } = useAIChat({
    endpoint: '${GATEWAY}/api/v1/chat',
    extraHeaders: { Authorization: 'Bearer ${key}' },
    initialMessages: [{ role: 'system', content: SYSTEM }],
  })
  return (
    <>
      {messages.filter(m => m.role !== 'system').map(m => (
        <p key={m.id}>{m.role}: {m.content}</p>
      ))}
      <button onClick={() => sendMessage('I need help')} disabled={isStreaming}>Ask</button>
    </>
  )
}`,
      }
    case 'Internal tooling':
      return {
        install: 'npm install @react-ai-stream/react',
        code: `import { useAIChat } from '@react-ai-stream/react'

export function InternalAssistant() {
  const { messages, sendMessage, isStreaming } = useAIChat({
    endpoint: '${GATEWAY}/api/v1/chat',
    extraHeaders: {
      Authorization: \`Bearer \${process.env.NEXT_PUBLIC_RAIS_KEY}\`,
    },
  })
  return (
    <>
      {messages.map(m => <p key={m.id}>{m.role}: {m.content}</p>)}
      <button onClick={() => sendMessage('Summarise last week')} disabled={isStreaming}>Ask</button>
    </>
  )
}`,
      }
    case 'Developer tooling':
      return {
        install: '# No package needed — raw fetch works',
        code: `const res = await fetch('${GATEWAY}/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ${key}',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  }),
})
res.body?.pipeTo(yourClientStream)`,
      }
    case 'SaaS product':
      return {
        install: 'npm install @react-ai-stream/react',
        code: `// app/api/ai/route.ts — key stays server-side
export async function POST(req: Request) {
  const upstream = await fetch('${GATEWAY}/api/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${process.env.RAIS_API_KEY}\`,
    },
    body: await req.text(),
  })
  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

// Client points to your own route
import { useAIChat } from '@react-ai-stream/react'
const { messages, sendMessage } = useAIChat({ endpoint: '/api/ai' })`,
      }
    default:
      return {
        install: 'npm install @react-ai-stream/react',
        code: `import { useAIChat } from '@react-ai-stream/react'

const { messages, sendMessage, isStreaming } = useAIChat({
  endpoint: '${GATEWAY}/api/v1/chat',
  extraHeaders: { Authorization: 'Bearer ${key}' },
})`,
      }
  }
}

// ─── Success states ────────────────────────────────────────────────────────────

function FreeSuccess({ name, email, apiKey, useCase }: {
  name: string; email: string; apiKey: string; useCase: string
}) {
  const [copied, setCopied] = useState<'key' | 'install' | 'code' | null>(null)
  const snippet = getCodeSnippet(useCase, apiKey)
  const meta = PLAN_META.free

  function copy(text: string, which: 'key' | 'install' | 'code') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>Your free API key is ready!</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Also sent to <span style={{ color: '#94a3b8' }}>{email}</span></div>
        </div>
        <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noreferrer"
          style={{ fontSize: 12, color: '#3B5BFF', textDecoration: 'none', fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(59,91,255,0.25)', background: 'rgba(59,91,255,0.08)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Star on GitHub
        </a>
      </div>

      {/* Body */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: 24 }}>

        {/* Plan features */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Free plan includes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {meta.features.map(f => (
              <span key={f} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', color: '#4ade80' }}>✓ {f}</span>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div style={{ marginBottom: 16 }}>
          <div style={stepLabel}>Your API key</div>
          <div style={{ ...codeBlock, background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' }}>
            <code style={{ ...codeText, color: '#4ade80', fontSize: 12 }}>{apiKey}</code>
            <button onClick={() => copy(apiKey, 'key')} style={copyBtn}>{copied === 'key' ? 'Copied!' : 'Copy'}</button>
          </div>
        </div>

        {/* Install */}
        <div style={{ marginBottom: 14 }}>
          <div style={stepLabel}>1 · Install</div>
          <div style={codeBlock}>
            <code style={codeText}>{snippet.install}</code>
            <button onClick={() => copy(snippet.install, 'install')} style={copyBtn}>{copied === 'install' ? 'Copied!' : 'Copy'}</button>
          </div>
        </div>

        {/* Code */}
        <div style={{ marginBottom: 18 }}>
          <div style={stepLabel}>2 · Use it — {useCase === 'Select your use case' ? 'generic' : useCase.toLowerCase()}</div>
          <div style={{ ...codeBlock, flexDirection: 'column', alignItems: 'flex-start', padding: 16 }}>
            <pre style={{ margin: 0, fontSize: 12, color: '#93c5fd', lineHeight: 1.7, overflowX: 'auto', width: '100%' }}>
              <code>{snippet.code}</code>
            </pre>
            <button onClick={() => copy(snippet.code, 'code')} style={{ ...copyBtn, marginTop: 10, alignSelf: 'flex-end' }}>
              {copied === 'code' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Dashboard CTA */}
        <div style={{ padding: '14px 16px', background: 'rgba(59,91,255,0.07)', border: '1px solid rgba(59,91,255,0.2)', borderRadius: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3B5BFF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your dashboard</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 10 }}>
            Track tokens used, check remaining quota, run live tests, and get more quickstart code — all in one place.
          </div>
          <a
            href={`https://react-ai-stream-gateway.vercel.app/dashboard`}
            target="_blank" rel="noreferrer"
            style={{ display: 'inline-block', padding: '7px 16px', background: '#3B5BFF', color: '#fff', borderRadius: 7, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
          >
            Open dashboard →
          </a>
        </div>

        {/* What happens when you hit limits */}
        <details style={{ marginBottom: 14 }}>
          <summary style={{ fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', userSelect: 'none', padding: '8px 0', letterSpacing: '0.02em' }}>
            What happens when you reach limits?
          </summary>
          <div style={{ padding: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { code: '429 rate limit', color: '#f59e0b', desc: 'Too many requests per minute. Wait 60 seconds and retry.' },
              { code: '429 token cap', color: '#ef4444', desc: 'Monthly token cap reached. Upgrade your plan to continue.' },
              { code: '401 invalid key', color: '#f87171', desc: 'Key missing or wrong. Check you\'re sending: Authorization: Bearer ras_test_…' },
            ].map(e => (
              <div key={e.code} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: '#64748b' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 7px', borderRadius: 4, background: `${e.color}15`, color: e.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{e.code}</span>
                <span>{e.desc}</span>
              </div>
            ))}
          </div>
        </details>

        {/* Upgrade CTA */}
        <div style={{ padding: '12px 14px', background: 'rgba(59,91,255,0.04)', border: '1px solid rgba(59,91,255,0.12)', borderRadius: 8, fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
          <span style={{ color: '#3B5BFF', fontWeight: 700 }}>Need more?</span>
          {' '}5k tokens/month on free.{' '}
          <a href="/cloud" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>Upgrade to Pro (€10/mo) →</a>
          {' '}for 100k tokens, analytics, and priority routing.
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="https://react-ai-stream-docs.vercel.app" target="_blank" rel="noreferrer"
            style={{ fontSize: 13, color: '#3B5BFF', textDecoration: 'none', fontWeight: 600, padding: '7px 16px', borderRadius: 7, border: '1px solid rgba(59,91,255,0.25)', background: 'rgba(59,91,255,0.08)' }}>
            Read the docs →
          </a>
          <a href="/inspect" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 600, padding: '7px 16px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)' }}>
            Try inspector
          </a>
        </div>
      </div>
    </div>
  )
}

function PaidWaitlistSuccess({ name, email, plan }: { name: string; email: string; plan: Plan }) {
  const meta = PLAN_META[plan]
  const firstName = name.split(' ').at(0) ?? name
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const hasStripe = plan === 'pro' || plan === 'team'

  async function handlePay() {
    setPaying(true)
    setPayError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setPayError(data.error ?? 'Could not start checkout. Try again.')
    } catch {
      setPayError('Network error. Try again.')
    }
    setPaying(false)
  }

  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', background: `${meta.color}0a`, border: `1px solid ${meta.color}33`, borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${meta.color}20`, border: `1px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
            {firstName}, you're on the {meta.label} waitlist
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Confirmation sent to <span style={{ color: '#94a3b8' }}>{email}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: 24 }}>

        {/* Pay now CTA — pro/team only */}
        {hasStripe && (
          <div style={{ padding: '16px 18px', background: `${meta.color}0c`, border: `1px solid ${meta.color}44`, borderRadius: 10, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
              Pay now to activate instantly
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
              Skip the wait — pay {meta.price} and your{' '}
              <code style={{ fontFamily: 'monospace', color: '#93c5fd', fontSize: 11 }}>ras_live_</code>{' '}
              key arrives by email in minutes. No manual review.
            </div>
            {payError && (
              <div style={{ fontSize: 12, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, marginBottom: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
                {payError}
              </div>
            )}
            <button
              onClick={handlePay}
              disabled={paying}
              style={{
                width: '100%', padding: '11px 0',
                background: paying ? `${meta.color}60` : meta.color,
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 700,
                cursor: paying ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.2px', transition: 'background 0.15s',
              }}
            >
              {paying ? 'Redirecting to Stripe…' : `Pay ${meta.price} to activate →`}
            </button>
          </div>
        )}

        {/* What happens next */}
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>
            {hasStripe ? 'Or wait for manual review (24h)' : 'What happens next'}
          </div>
          {[
            { icon: '📬', text: 'We review your application (usually within 24 hours)' },
            { icon: '🔑', text: `Your ${meta.label} key (${meta.keyPrefix}...) is emailed to you on approval` },
            { icon: '🚀', text: 'Paste the key into your code — no other changes needed' },
          ].map(s => (
            <div key={s.icon} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, fontSize: 13, color: '#64748b' }}>
              <span style={{ flexShrink: 0 }}>{s.icon}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>

        {/* Plan features — only this plan */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            {meta.label} plan — {meta.price}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {meta.features.map(f => (
              <span key={f} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${meta.color}10`, border: `1px solid ${meta.color}30`, color: meta.color }}>✓ {f}</span>
            ))}
          </div>
        </div>

        {/* Use free tier while waiting */}
        <div style={{ padding: '12px 14px', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
          <span style={{ color: '#4ade80', fontWeight: 700 }}>While you wait:</span>
          {' '}grab a free key (5k tokens/month) to start building today.{' '}
          <a href="/cloud#waitlist" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>Get free key →</a>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="https://react-ai-stream-docs.vercel.app" target="_blank" rel="noreferrer"
            style={{ fontSize: 13, color: '#3B5BFF', textDecoration: 'none', fontWeight: 600, padding: '7px 16px', borderRadius: 7, border: '1px solid rgba(59,91,255,0.25)', background: 'rgba(59,91,255,0.08)' }}>
            Read the docs →
          </a>
          <a href="/inspect" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 600, padding: '7px 16px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)' }}>
            Try inspector (free)
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface WaitlistFormProps {
  defaultPlan?: Plan
}

export function WaitlistForm({ defaultPlan = 'free' }: WaitlistFormProps) {
  const [plan, setPlan] = useState<Plan>(defaultPlan)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [useCase, setUseCase] = useState(USE_CASES[0] ?? 'Select your use case')
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState<{ name: string; email: string; key: string | null; plan: Plan } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !name.trim()) return
    setFormState('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), use_case: useCase, plan }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(typeof data.error === 'string' ? data.error : 'Something went wrong. Try again.')
        setFormState('error')
        return
      }
      const data = await res.json()
      setSuccessData({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        key: typeof data.key === 'string' ? data.key : null,
        plan: (typeof data.plan === 'string' ? data.plan : plan) as Plan,
      })
      setFormState('success')
    } catch {
      setErrorMsg('Network error. Try again.')
      setFormState('error')
    }
  }

  if (formState === 'success' && successData) {
    if (successData.plan === 'free' && successData.key) {
      return <FreeSuccess name={successData.name} email={successData.email} apiKey={successData.key} useCase={useCase} />
    }
    return <PaidWaitlistSuccess name={successData.name} email={successData.email} plan={successData.plan} />
  }

  const meta = PLAN_META[plan]

  return (
    <div style={{ width: '100%', maxWidth: 520 }}>

      {/* Plan selector tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
        {(Object.keys(PLAN_META) as Plan[]).map(p => {
          const m = PLAN_META[p]
          const active = plan === p
          return (
            <button key={p} onClick={() => setPlan(p)} style={{
              flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: active ? `${m.color}15` : 'transparent',
              color: active ? m.color : '#475569',
              borderBottom: active ? `2px solid ${m.color}` : '2px solid transparent',
              transition: 'all 0.15s',
              position: 'relative',
            }}>
              {m.label}
              {m.badge && active && (
                <span style={{ display: 'block', fontSize: 9, fontWeight: 600, color: m.color, opacity: 0.7, letterSpacing: '0.04em' }}>★ popular</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Form card */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderTop: 'none',
        borderRadius: '0 0 14px 14px',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {/* Plan summary */}
        <div style={{ padding: '10px 14px', background: `${meta.color}0a`, border: `1px solid ${meta.color}22`, borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, marginBottom: 3 }}>{meta.label} — {meta.price}</div>
          <div style={{ fontSize: 11, color: '#475569' }}>{meta.limits}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {meta.features.slice(0, 4).map(f => (
              <span key={f} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${meta.color}10`, color: meta.color, border: `1px solid ${meta.color}25` }}>{f}</span>
            ))}
            {meta.features.length > 4 && (
              <span style={{ fontSize: 10, padding: '2px 7px', color: '#475569' }}>+{meta.features.length - 4} more</span>
            )}
          </div>
        </div>

        <div>
          <label style={labelSt}>Your name</label>
          <input type="text" required placeholder="Alex Johnson" value={name}
            onChange={e => { setName(e.target.value); if (formState === 'error') setFormState('idle') }}
            disabled={formState === 'loading'} style={inputStyle} />
        </div>

        <div>
          <label style={labelSt}>Work email</label>
          <input type="email" required placeholder="alex@company.com" value={email}
            onChange={e => { setEmail(e.target.value); if (formState === 'error') setFormState('idle') }}
            disabled={formState === 'loading'}
            style={{ ...inputStyle, border: formState === 'error' ? '1px solid rgba(239,68,68,0.5)' : inputStyle.border }} />
        </div>

        <div>
          <label style={labelSt}>Use case</label>
          <select value={useCase} onChange={e => setUseCase(e.target.value)}
            disabled={formState === 'loading'}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
            {USE_CASES.map(u => <option key={u} value={u} style={{ background: '#0f172a' }}>{u}</option>)}
          </select>
        </div>

        {formState === 'error' && (
          <div style={{ fontSize: 12, color: '#f87171', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
            {errorMsg}
          </div>
        )}

        <button type="button" onClick={handleSubmit}
          disabled={formState === 'loading' || !email.trim() || !name.trim()}
          style={{
            width: '100%', padding: '13px',
            background: formState === 'loading' ? `${meta.color}80` : meta.color,
            color: plan === 'free' ? '#0a0f1e' : '#fff',
            border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700,
            cursor: formState === 'loading' || !email.trim() || !name.trim() ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.2px', transition: 'background 0.15s', marginTop: 4,
          }}>
          {formState === 'loading'
            ? 'Submitting…'
            : plan === 'free'
              ? 'Get my free API key →'
              : `Join ${meta.label} waitlist →`}
        </button>

        <div style={{ fontSize: 11, color: '#334155', textAlign: 'center', lineHeight: 1.6 }}>
          {plan === 'free'
            ? 'No credit card. Key emailed instantly. Start building now.'
            : `No charge now. We'll email your ${meta.label} key when approved.`}
        </div>
      </div>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  marginBottom: 7,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const stepLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 7,
}

const codeBlock: React.CSSProperties = {
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8,
  padding: '10px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const codeText: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 13,
  color: '#93c5fd',
}

const copyBtn: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#64748b',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 5,
  padding: '4px 10px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}
