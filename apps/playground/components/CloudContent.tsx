'use client'

import { useState } from 'react'
import { WaitlistForm } from './WaitlistForm'

type Plan = 'free' | 'pro' | 'team' | 'enterprise'

const TIERS: Array<{
  plan: Plan
  name: string
  price: string
  period: string
  color: string
  badge?: string
  features: string[]
  ctaLabel: string
  external?: string
}> = [
  {
    plan: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#4ade80',
    features: [
      'Free API key — instant, no card',
      '5,000 tokens/month',
      '10 requests/minute',
      'All DevTools (inspector, benchmark)',
      'RAIS compliance tools',
      'Community support',
    ],
    ctaLabel: 'Get free key →',
  },
  {
    plan: 'pro',
    name: 'Pro',
    price: '€10',
    period: '/month',
    color: '#3B5BFF',
    badge: 'Most popular',
    features: [
      'Live API key (ras_live_...)',
      '100,000 tokens/month',
      '60 requests/minute',
      'Groq · Gemini · OpenAI · Anthropic (coming)',
      'Analytics dashboard',
      'Request logs + replay',
      'Fallback chains',
      'Email support',
    ],
    ctaLabel: 'Join Pro waitlist →',
  },
  {
    plan: 'team',
    name: 'Team',
    price: '€49',
    period: '/month',
    color: '#e879f9',
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
    ctaLabel: 'Join Team waitlist →',
  },
  {
    plan: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    color: '#f59e0b',
    features: [
      'Live API key (ras_live_...)',
      'Unlimited tokens',
      '1,000 requests/minute',
      'Self-hosted gateway option',
      'Custom provider integrations',
      'SLA + dedicated support',
      'Private compliance certificate',
    ],
    ctaLabel: 'Contact us →',
    external: 'mailto:allorama16@gmail.com?subject=RAIS Cloud Enterprise',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Get an API key',
    desc: 'Free key: instant. Pro/Team: pay to activate instantly or wait up to 24h for manual approval.',
    code: null,
  },
  {
    step: '02',
    title: 'One line change',
    desc: 'Point your existing useAIChat hook at the cloud endpoint.',
    code: `useAIChat({
  endpoint: "https://react-ai-stream-gateway.vercel.app/api/v1/chat",
  extraHeaders: { Authorization: \`Bearer \${key}\` },
})`,
  },
  {
    step: '03',
    title: 'Ship with confidence',
    desc: 'Provider keys stay server-side. Retries, fallbacks, and usage logs handled automatically.',
    code: null,
  },
]

const FAQS = [
  {
    q: 'Is the RAIS Protocol staying open?',
    a: 'Yes. The protocol, SDK packages, compliance tools, and playground are all open-source forever. RAIS Cloud is optional hosted infrastructure — we monetize the platform, not the protocol.',
  },
  {
    q: 'What\'s the difference between the free key and a paid key?',
    a: 'Free keys are prefixed ras_test_ with 5k tokens/month and 10 req/min. Paid keys are ras_live_ with higher limits, multi-provider access, analytics, and fallback chains.',
  },
  {
    q: 'How do Pro/Team keys get delivered?',
    a: 'Two options: (1) Pay now — submit the form below, click "Pay to activate", complete checkout on Stripe, and your ras_live_ key arrives by email within minutes. (2) Manual review — submit the form and wait up to 24h for approval. Pro is €10/month, Team is €49/month.',
  },
  {
    q: 'What providers are supported?',
    a: 'Groq (Llama 3.3 70B, Llama 4 Scout, Compound Beta) and Gemini (1.5 Flash, 1.5 Pro) are live — both are free-tier providers with no cost per token for the gateway. OpenAI and Anthropic are coming once demand justifies the cost.',
  },
]

export function CloudContent({ checkoutStatus, checkoutPlan }: { checkoutStatus?: string | undefined; checkoutPlan?: string | undefined }) {
  const [activePlan, setActivePlan] = useState<Plan>('free')

  function selectPlan(plan: Plan) {
    setActivePlan(plan)
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

      {/* Stripe checkout result banners */}
      {checkoutStatus === 'success' && (
        <div style={{ marginBottom: 32, padding: '18px 24px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>✓</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 3 }}>
              Payment received — your {checkoutPlan ? checkoutPlan.charAt(0).toUpperCase() + checkoutPlan.slice(1) : ''} key is on its way
            </div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Check your email inbox (and spam folder) — your <code style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>ras_live_</code> key should arrive within a few minutes.
              Once you have it, paste it into the{' '}
              <a href="https://react-ai-stream-gateway.vercel.app/dashboard" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>dashboard →</a>
            </div>
          </div>
        </div>
      )}
      {checkoutStatus === 'cancel' && (
        <div style={{ marginBottom: 32, padding: '16px 24px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 20, flexShrink: 0 }}>↩</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>Payment cancelled</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              No charge was made. Your waitlist spot is saved — apply below and pay whenever you&apos;re ready.
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '60px 0 52px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,91,255,0.12)', border: '1px solid rgba(59,91,255,0.25)', borderRadius: 20, padding: '4px 14px', marginBottom: 22, fontSize: 11, color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Private beta · Free key available now
        </div>
        <h1 style={{ margin: '0 0 18px', fontSize: 'clamp(2rem,5vw,3.6rem)', fontWeight: 900, letterSpacing: '-0.05em', color: '#f1f5f9', lineHeight: 1.05 }}>
          The hosted AI gateway<br />
          <span style={{ color: '#3B5BFF' }}>built on RAIS Protocol</span>
        </h1>
        <p style={{ margin: '0 auto 36px', maxWidth: 520, fontSize: 17, color: '#64748b', lineHeight: 1.65 }}>
          Multi-provider routing · Retries · Usage analytics · Zero key exposure.
          Start free — upgrade when you scale.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => selectPlan('free')} style={{ padding: '13px 28px', background: '#4ade80', color: '#0a0f1e', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.3px' }}>
            Get free key →
          </button>
          <button onClick={() => selectPlan('pro')} style={{ padding: '13px 28px', background: 'rgba(59,91,255,0.15)', color: '#93c5fd', borderRadius: 10, border: '1px solid rgba(59,91,255,0.3)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Join Pro waitlist
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
          {[
            { value: '4', label: 'Providers', color: '#3B5BFF' },
            { value: '<50ms', label: 'Overhead', color: '#22c55e' },
            { value: 'RAIS v1', label: 'Protocol', color: '#4ade80' },
            { value: 'Free', label: 'To start', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 22px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginBottom: 80 }}>
        <h2 style={{ margin: '0 0 32px', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9', textAlign: 'center' }}>
          Zero SDK changes required
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {HOW_IT_WORKS.map(step => (
            <div key={step.step} style={{ padding: '24px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e3a5f', letterSpacing: '-0.05em', marginBottom: 10, fontVariantNumeric: 'tabular-nums' }}>{step.step}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{step.title}</div>
              <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.65 }}>{step.desc}</p>
              {step.code && (
                <pre style={{ margin: '14px 0 0', padding: '12px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: '#93c5fd', fontFamily: 'ui-monospace, monospace', overflow: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {step.code}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ marginBottom: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
            Simple, transparent pricing
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>Click a plan to apply for it below.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {TIERS.map(tier => (
            <div key={tier.name} style={{
              padding: '28px 24px',
              background: activePlan === tier.plan ? `${tier.color}10` : 'rgba(255,255,255,0.025)',
              border: `1px solid ${activePlan === tier.plan ? tier.color + '55' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.15s',
            }}>
              {tier.badge && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#3B5BFF', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {tier.badge}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{tier.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em' }}>{tier.price}</span>
                  {tier.period && <span style={{ fontSize: 13, color: '#475569' }}>{tier.period}</span>}
                </div>
              </div>
              <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#94a3b8' }}>
                    <span style={{ color: tier.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {tier.external ? (
                <a href={tier.external} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px 0', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                  {tier.ctaLabel}
                </a>
              ) : (
                <button onClick={() => selectPlan(tier.plan)} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '10px 0', background: activePlan === tier.plan ? tier.color : tier.plan === 'pro' ? '#3B5BFF' : 'rgba(255,255,255,0.06)', color: activePlan === tier.plan && tier.plan === 'free' ? '#0a0f1e' : activePlan === tier.plan || tier.plan === 'pro' ? '#fff' : '#94a3b8', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: tier.plan === 'pro' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                  {activePlan === tier.plan ? '✓ Selected' : tier.ctaLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* APPLY FORM */}
      <section id="waitlist" style={{ marginBottom: 80, padding: '56px 40px', background: 'rgba(59,91,255,0.07)', border: '1px solid rgba(59,91,255,0.18)', borderRadius: 20, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '3px 14px', marginBottom: 16, fontSize: 11, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {activePlan === 'free'
            ? 'Free key · No credit card · Instant'
            : activePlan === 'enterprise'
              ? 'Enterprise · Custom pricing · Contact us'
              : `${activePlan.charAt(0).toUpperCase() + activePlan.slice(1)} · Pay to activate instantly · or wait 24h`}
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
          {activePlan === 'free' ? 'Get your free API key' : `Apply for ${activePlan.charAt(0).toUpperCase() + activePlan.slice(1)}`}
        </h2>
        <p style={{ margin: '0 auto 32px', maxWidth: 480, fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
          {activePlan === 'free'
            ? 'Your free key (ras_test_...) is emailed immediately. 5,000 tokens/month, no card needed.'
            : activePlan === 'enterprise'
              ? 'Tell us about your use case and we will get back to you within 24 hours with a custom plan.'
              : `Fill in your details, then pay ${activePlan === 'pro' ? '€10' : '€49'}/month to activate your live key instantly — or wait up to 24h for manual approval.`}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <WaitlistForm defaultPlan={activePlan} />
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: 80 }}>
        <h2 style={{ margin: '0 0 28px', fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>FAQ</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQS.map(faq => (
            <div key={faq.q} style={{ padding: '18px 22px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 7 }}>{faq.q}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
