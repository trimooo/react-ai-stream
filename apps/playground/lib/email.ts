import { randomBytes } from 'crypto'
import { getRedis } from './redis'

const FROM = process.env.EMAIL_FROM ?? 'RAIS Cloud <onboarding@resend.dev>'
const GATEWAY = 'https://react-ai-stream-gateway.vercel.app'
const DOCS = 'https://react-ai-stream-docs.vercel.app'
const PLAYGROUND = 'https://react-ai-stream-playground.vercel.app'

const MONTHLY_LIMITS: Record<string, number> = {
  free: 5_000, pro: 100_000, team: 1_000_000, enterprise: -1,
}

export function buildApiKey(plan: string): { keyString: string; id: string } {
  const type = plan === 'free' ? 'test' : 'live'
  const id = randomBytes(20).toString('hex')
  return { keyString: `ras_${type}_${id}`, id }
}

export async function storeApiKey(opts: {
  id: string
  keyString: string
  email: string
  plan: string
}): Promise<void> {
  const redis = getRedis()
  const now = new Date().toISOString()
  await redis.hset(`key:${opts.id}`, {
    id: opts.id,
    owner_email: opts.email,
    plan: opts.plan,
    key_string: opts.keyString,
    monthly_limit: MONTHLY_LIMITS[opts.plan] ?? 0,
    created_at: now,
  })
  await redis.set(`email_key:${opts.email}`, opts.id)
  await redis.rpush('keys:all', opts.id)
}

// ─── Email sending via Resend HTTP API (no npm package needed) ───────────────

interface SendResult {
  sent: boolean
  redirected_to?: string
  error?: string
}

async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  const apiKey = (process.env.RESEND_API_KEY ?? '').trim()
  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY not set — would send "${opts.subject}" to ${opts.to}`)
    return { sent: false, error: 'RESEND_API_KEY not configured' }
  }
  // In dev/test, Resend only allows sending to the account owner's verified address.
  // Set RESEND_TEST_TO to redirect all outgoing email to that address during development.
  const testOverride = (process.env.RESEND_TEST_TO ?? '').trim()
  const recipient = testOverride || opts.to
  if (testOverride) {
    console.log(`[email] RESEND_TEST_TO active — redirecting "${opts.subject}" to ${testOverride} (originally: ${opts.to})`)
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: recipient, subject: opts.subject, html: opts.html }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[email] Resend error ${res.status}:`, body)
    return { sent: false, error: `Resend ${res.status}` }
  }
  return testOverride
    ? { sent: true, redirected_to: testOverride }
    : { sent: true }
}

// ─── Use-case code snippets ───────────────────────────────────────────────────

function useCaseSnippet(useCase: string, apiKey: string): { heading: string; install: string; code: string } {
  const key = apiKey || 'YOUR_API_KEY'
  switch (useCase) {
    case 'AI chatbot / assistant':
      return {
        heading: 'AI Chatbot',
        install: 'npm install @react-ai-stream/react',
        code: `import { useAIChat } from '@react-ai-stream/react'

export function Chatbot() {
  const { messages, sendMessage, isStreaming } = useAIChat({
    endpoint: '${GATEWAY}/api/v1/chat',
    extraHeaders: { Authorization: 'Bearer ${key}' },
  })
  return (
    <div>
      {messages.map(m => <p key={m.id}>{m.role}: {m.content}</p>)}
      <button onClick={() => sendMessage('Hello!')} disabled={isStreaming}>Send</button>
    </div>
  )
}`,
      }
    case 'Customer support':
      return {
        heading: 'Support Assistant',
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
    <div>
      {messages.filter(m => m.role !== 'system').map(m => (
        <p key={m.id}>{m.role}: {m.content}</p>
      ))}
      <button onClick={() => sendMessage('I need help')} disabled={isStreaming}>Ask</button>
    </div>
  )
}`,
      }
    case 'Internal tooling':
      return {
        heading: 'Internal AI Tool',
        install: 'npm install @react-ai-stream/react',
        code: `import { useAIChat } from '@react-ai-stream/react'

// Store key in env var — never hardcode in client-side code
export function InternalAssistant() {
  const { messages, sendMessage, isStreaming } = useAIChat({
    endpoint: '${GATEWAY}/api/v1/chat',
    extraHeaders: {
      Authorization: \`Bearer \${process.env.NEXT_PUBLIC_RAIS_KEY}\`,
    },
  })
  return (
    <div>
      {messages.map(m => <p key={m.id}>{m.role}: {m.content}</p>)}
      <button onClick={() => sendMessage('Summarise last week')} disabled={isStreaming}>Ask</button>
    </div>
  )
}`,
      }
    case 'Developer tooling':
      return {
        heading: 'Backend / API Integration',
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
// RAIS v1 SSE — pipe straight to your client
res.body?.pipeTo(yourClientStream)`,
      }
    case 'SaaS product':
      return {
        heading: 'SaaS — Server-Side Proxy',
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
        heading: 'Quickstart',
        install: 'npm install @react-ai-stream/react',
        code: `import { useAIChat } from '@react-ai-stream/react'

export function App() {
  const { messages, sendMessage, isStreaming } = useAIChat({
    endpoint: '${GATEWAY}/api/v1/chat',
    extraHeaders: { Authorization: 'Bearer ${key}' },
  })
  return (
    <div>
      {messages.map(m => <p key={m.id}>{m.role}: {m.content}</p>)}
      <button onClick={() => sendMessage('Hi!')} disabled={isStreaming}>Send</button>
    </div>
  )
}`,
      }
  }
}

// ─── Plan info ────────────────────────────────────────────────────────────────

function planLabel(plan: string): string {
  return { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' }[plan] ?? plan
}

function planLimitsText(plan: string): string {
  return {
    free: '5,000 tokens/month · 10 req/min · test key',
    pro: '100,000 tokens/month · 60 req/min · live key',
    team: '1,000,000 tokens/month · 300 req/min · live key',
    enterprise: 'Unlimited tokens · 1,000 req/min · live key',
  }[plan] ?? ''
}

// ─── Welcome email — used for all plans when a key is ready ──────────────────

function buildFreeWelcomeHtml(opts: { name: string; email: string; apiKey: string; useCase: string; plan?: string }): string {
  const plan = opts.plan ?? 'free'
  const firstName = opts.name.split(' ').at(0) ?? opts.name
  const snippet = useCaseSnippet(opts.useCase, opts.apiKey)

  const planColors: Record<string, string> = { free: '#4ade80', pro: '#3B5BFF', team: '#e879f9', enterprise: '#f59e0b' }
  const planColor = planColors[plan] ?? '#4ade80'
  const keyLabel = plan === 'free' ? 'Free API Key' : `${planLabel(plan)} API Key`
  const tierLabel = `RAIS CLOUD · ${planLabel(plan).toUpperCase()} PLAN`

  const upgradeCta = plan === 'free'
    ? `<tr><td style="padding:24px 40px 0;"><div style="background:rgba(59,91,255,0.06);border:1px solid rgba(59,91,255,0.18);border-radius:8px;padding:14px 16px;font-size:13px;color:#64748b;line-height:1.6;"><strong style="color:#3B5BFF;">Need more?</strong> Upgrade to Pro for 100k tokens, analytics, and priority routing.<a href="${PLAYGROUND}/cloud" style="color:#3B5BFF;text-decoration:none;display:block;margin-top:6px;font-weight:600;font-size:12px;">View plans →</a></div></td></tr>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,rgba(59,91,255,0.3),rgba(34,197,94,0.1));padding:36px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:11px;font-weight:700;color:${planColor};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;">${tierLabel}</div>
          <h1 style="margin:0;font-size:26px;font-weight:900;color:#f1f5f9;letter-spacing:-0.04em;">Your API key is ready, ${firstName}</h1>
          <p style="margin:12px 0 0;font-size:14px;color:#64748b;">${planLimitsText(plan)} · Start building right now.</p>
        </td></tr>
        <tr><td style="padding:36px 40px 0;">
          <div style="background:rgba(0,0,0,0.4);border:1px solid ${planColor}55;border-radius:10px;padding:20px 24px;">
            <div style="font-size:10px;font-weight:700;color:${planColor};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">${keyLabel}</div>
            <div style="font-family:ui-monospace,monospace;font-size:13px;color:#86efac;word-break:break-all;margin-bottom:6px;">${opts.apiKey}</div>
            <div style="font-size:11px;color:#475569;">${planLimitsText(plan)}</div>
          </div>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <div style="font-size:11px;font-weight:700;color:#475569;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">${snippet.heading} · Personalized quickstart</div>
          <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:6px;">1 · Install</div>
          <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.07);border-radius:7px;padding:10px 14px;font-family:ui-monospace,monospace;font-size:12px;color:#4ade80;margin-bottom:14px;">${snippet.install}</div>
          <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:6px;">2 · Use it (key already filled in)</div>
          <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.06);border-radius:7px;padding:14px 16px;font-family:ui-monospace,monospace;font-size:11px;color:#93c5fd;white-space:pre-wrap;line-height:1.7;">${snippet.code}</div>
        </td></tr>
        ${upgradeCta}
        <tr><td style="padding:20px 40px 0;">
          <div style="background:rgba(59,91,255,0.07);border:1px solid rgba(59,91,255,0.2);border-radius:10px;padding:18px 20px;">
            <div style="font-size:10px;font-weight:700;color:#3B5BFF;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;">Your dashboard</div>
            <div style="font-size:13px;color:#64748b;line-height:1.65;margin-bottom:12px;">Check tokens used, remaining quota, provider breakdown, and run live tests — all from your dashboard.</div>
            <a href="${GATEWAY}/dashboard" style="display:inline-block;padding:9px 18px;background:#3B5BFF;color:#fff;border-radius:7px;text-decoration:none;font-size:12px;font-weight:700;">Open dashboard →</a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 40px 0;">
          <div style="font-size:11px;font-weight:700;color:#334155;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Error codes reference</div>
          <div style="font-size:12px;color:#64748b;line-height:2;font-family:ui-monospace,monospace;">
            <span style="color:#f59e0b;">429 rate_limit</span> — Too many requests this minute. Wait 60s and retry.<br>
            <span style="color:#ef4444;">429 token_cap</span> — Monthly limit reached. <a href="${PLAYGROUND}/cloud" style="color:#3B5BFF;text-decoration:none;">Upgrade your plan →</a><br>
            <span style="color:#f87171;">401 invalid_key</span> — Key wrong or missing. Header: <span style="color:#93c5fd;">Authorization: Bearer ras_...</span><br>
            <span style="color:#94a3b8;">413 body_too_large</span> — Request body exceeds plan limit. Reduce message count.
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;">
          <a href="${GATEWAY}/dashboard" style="display:inline-block;padding:10px 22px;background:#3B5BFF;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;margin-right:10px;">Dashboard</a>
          <a href="${DOCS}" style="display:inline-block;padding:10px 22px;background:rgba(255,255,255,0.07);color:#94a3b8;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;border:1px solid rgba(255,255,255,0.1);margin-right:10px;">Docs</a>
          <a href="${PLAYGROUND}/inspect" style="display:inline-block;padding:10px 22px;background:rgba(255,255,255,0.07);color:#94a3b8;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;border:1px solid rgba(255,255,255,0.1);">Inspector</a>
        </td></tr>
        <tr><td style="padding:16px 40px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <div style="font-size:11px;color:#334155;">RAIS Cloud · <a href="${PLAYGROUND}" style="color:#3B5BFF;text-decoration:none;">react-ai-stream-playground.vercel.app</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// ─── Waitlist confirmation email for PAID plans (no key yet) ─────────────────

function buildWaitlistHtml(opts: { name: string; plan: string; useCase: string }): string {
  const firstName = opts.name.split(' ').at(0) ?? opts.name
  const planFeatures: Record<string, string[]> = {
    pro: ['100,000 tokens/month', '60 req/min', 'OpenAI · Anthropic · Groq · Gemini', 'Analytics dashboard', 'Request logs + replay', 'Fallback chains', 'Email support'],
    team: ['1,000,000 tokens/month', '300 req/min', 'Everything in Pro', 'Team workspaces', 'Shared API keys', 'Audit logs', 'SSO (SAML)'],
    enterprise: ['Unlimited tokens', '1,000 req/min', 'Self-hosted gateway', 'Custom providers', 'SLA + dedicated support', 'Private compliance cert'],
  }
  const features = planFeatures[opts.plan] ?? planFeatures['pro'] ?? []
  const planColor: Record<string, string> = { pro: '#3B5BFF', team: '#e879f9', enterprise: '#f59e0b' }
  const color = planColor[opts.plan] ?? '#3B5BFF'

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,rgba(59,91,255,0.2),rgba(0,0,0,0.1));padding:36px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:11px;font-weight:700;color:${color};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;">RAIS CLOUD · ${planLabel(opts.plan).toUpperCase()} PLAN</div>
          <h1 style="margin:0;font-size:26px;font-weight:900;color:#f1f5f9;letter-spacing:-0.04em;">You're on the list, ${firstName}</h1>
          <p style="margin:12px 0 0;font-size:14px;color:#64748b;">We review ${planLabel(opts.plan)} applications manually. You'll hear from us within 24 hours.</p>
        </td></tr>
        <tr><td style="padding:36px 40px 0;">
          <div style="font-size:13px;font-weight:700;color:#94a3b8;margin-bottom:14px;">What you'll get when approved:</div>
          ${features.map(f => `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#94a3b8;"><span style="color:${color};">✓</span>${f}</div>`).join('')}
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;font-size:13px;color:#64748b;line-height:1.65;">
            Your key will arrive by email the moment we approve your account. Use our <strong style="color:#94a3b8;">free tier</strong> to get started while you wait —
            <a href="${PLAYGROUND}/cloud#waitlist" style="color:#3B5BFF;text-decoration:none;font-weight:600;"> apply for the free key here</a>.
          </div>
        </td></tr>
        <tr><td style="padding:28px 40px;text-align:center;">
          <a href="${DOCS}" style="display:inline-block;padding:10px 22px;background:#3B5BFF;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;margin-right:10px;">Read the docs →</a>
          <a href="${PLAYGROUND}/inspect" style="display:inline-block;padding:10px 22px;background:rgba(255,255,255,0.07);color:#94a3b8;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;border:1px solid rgba(255,255,255,0.1);">Try inspector (free)</a>
        </td></tr>
        <tr><td style="padding:16px 40px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <div style="font-size:11px;color:#334155;">RAIS Cloud · <a href="${PLAYGROUND}" style="color:#3B5BFF;text-decoration:none;">react-ai-stream-playground.vercel.app</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SendWelcomeEmailOpts {
  email: string
  name: string
  apiKey: string       // empty string for paid plans (no key yet)
  plan: string
  use_case: string
}

export interface SendEmailResult {
  sent: boolean
  redirected_to?: string
  error?: string
}

export async function sendWelcomeEmail(opts: SendWelcomeEmailOpts): Promise<SendEmailResult> {
  const firstName = opts.name.split(' ').at(0) ?? opts.name

  if (opts.apiKey) {
    // Key ready (free instant, or admin-granted paid plan) — show key + quickstart
    const subject = opts.plan === 'free'
      ? `${firstName}, your RAIS Cloud API key is ready`
      : `${firstName}, your RAIS Cloud ${planLabel(opts.plan)} key is ready`
    return sendEmail({
      to: opts.email,
      subject,
      html: buildFreeWelcomeHtml({ name: opts.name, email: opts.email, apiKey: opts.apiKey, useCase: opts.use_case, plan: opts.plan }),
    })
  } else {
    // No key yet — waitlist confirmation for paid plans
    return sendEmail({
      to: opts.email,
      subject: `${firstName}, you're on the RAIS Cloud ${planLabel(opts.plan)} waitlist`,
      html: buildWaitlistHtml({ name: opts.name, plan: opts.plan, useCase: opts.use_case }),
    })
  }
}
