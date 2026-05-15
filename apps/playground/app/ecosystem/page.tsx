import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ecosystem — RAIS Protocol',
  description: 'All official and community RAIS-compatible packages, adapters, and certified implementations.',
}

interface Package {
  name: string
  description: string
  npm?: string
  pypi?: string
  github?: string
  certified: boolean
  badge: 'official' | 'community' | 'adapter'
  language: string
  color: string
}

interface Section {
  title: string
  subtitle: string
  packages: Package[]
}

const SECTIONS: Section[] = [
  {
    title: 'Official SDK',
    subtitle: 'First-party packages published by the react-ai-stream project.',
    packages: [
      {
        name: '@react-ai-stream/core',
        description: 'Zero-dependency RAIS streaming engine. SSE parser, AbortController support, TypeScript types.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/core',
        github: 'https://github.com/trimooo/react-ai-stream/tree/master/packages/core',
        certified: true,
        badge: 'official',
        language: 'TypeScript',
        color: '#3B5BFF',
      },
      {
        name: '@react-ai-stream/react',
        description: 'React hooks — useAIChat, useStreamingText. Works with any RAIS-compliant endpoint.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/react',
        github: 'https://github.com/trimooo/react-ai-stream/tree/master/packages/react',
        certified: true,
        badge: 'official',
        language: 'TypeScript / React',
        color: '#3B5BFF',
      },
      {
        name: '@react-ai-stream/ui',
        description: 'Pre-built UI components — ChatWindow, MessageBubble, StreamingText — with zero style opinions.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/ui',
        github: 'https://github.com/trimooo/react-ai-stream/tree/master/packages/ui',
        certified: true,
        badge: 'official',
        language: 'TypeScript / React',
        color: '#3B5BFF',
      },
      {
        name: '@react-ai-stream/express',
        description: 'Express.js middleware — raisMiddleware(). OpenAI, Anthropic, and Groq (via OpenAI-compatible API) support built-in.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/express',
        github: 'https://github.com/trimooo/react-ai-stream/tree/master/packages/express',
        certified: true,
        badge: 'official',
        language: 'TypeScript / Node.js',
        color: '#3B5BFF',
      },
      {
        name: '@react-ai-stream/vue',
        description: 'Vue 3 composable — useAIChat(). Returns shallowRefs for fine-grained reactivity.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/vue',
        github: 'https://github.com/trimooo/react-ai-stream/tree/master/packages/vue',
        certified: true,
        badge: 'official',
        language: 'TypeScript / Vue 3',
        color: '#3B5BFF',
      },
      {
        name: 'rais (Python)',
        description: 'Python package — stream_response() for FastAPI and any ASGI framework. Supports OpenAI and Anthropic.',
        pypi: 'https://pypi.org/project/rais',
        github: 'https://github.com/trimooo/react-ai-stream/tree/master/packages/python',
        certified: true,
        badge: 'official',
        language: 'Python',
        color: '#3B5BFF',
      },
    ],
  },
  {
    title: 'Server Adapters',
    subtitle: 'Drop-in RAIS middleware for popular Node.js frameworks.',
    packages: [
      {
        name: '@react-ai-stream/express',
        description: 'Express 4/5 middleware. raisMiddleware({ provider, apiKey, model }) — one line integration.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/express',
        certified: true,
        badge: 'adapter',
        language: 'Node.js',
        color: '#f59e0b',
      },
      {
        name: 'rais-hono',
        description: 'Hono adapter — raisHandler() for Cloudflare Workers and Deno Deploy. Edge-first.',
        github: 'https://github.com/trimooo/react-ai-stream',
        certified: false,
        badge: 'community',
        language: 'TypeScript / Hono',
        color: '#64748b',
      },
      {
        name: 'rais-fastify',
        description: 'Fastify plugin — @fastify/rais. Adds schema validation and lifecycle hooks.',
        github: 'https://github.com/trimooo/react-ai-stream',
        certified: false,
        badge: 'community',
        language: 'TypeScript / Fastify',
        color: '#64748b',
      },
      {
        name: 'rais (FastAPI)',
        description: 'Python async generator — stream_response(). Returns text/event-stream compatible with StreamingResponse.',
        pypi: 'https://pypi.org/project/rais',
        certified: true,
        badge: 'adapter',
        language: 'Python / FastAPI',
        color: '#f59e0b',
      },
      {
        name: 'rais-flask',
        description: 'Flask extension using generator + Response(stream_with_context). For sync Python stacks.',
        github: 'https://github.com/trimooo/react-ai-stream',
        certified: false,
        badge: 'community',
        language: 'Python / Flask',
        color: '#64748b',
      },
    ],
  },
  {
    title: 'Client SDKs',
    subtitle: 'Connect to any RAIS endpoint from your UI framework of choice.',
    packages: [
      {
        name: '@react-ai-stream/react',
        description: 'useAIChat — messages, sendMessage, loading, stop, error. Works in React 18 and 19.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/react',
        certified: true,
        badge: 'official',
        language: 'React',
        color: '#22c55e',
      },
      {
        name: '@react-ai-stream/vue',
        description: 'useAIChat composable for Vue 3. shallowRef for performance; tree-shakeable.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/vue',
        certified: true,
        badge: 'official',
        language: 'Vue 3',
        color: '#22c55e',
      },
      {
        name: 'rais-svelte',
        description: 'Svelte store — createAIChat(). Returns a writable store with streaming state.',
        github: 'https://github.com/trimooo/react-ai-stream',
        certified: false,
        badge: 'community',
        language: 'Svelte 5',
        color: '#64748b',
      },
      {
        name: 'rais-solid',
        description: 'SolidJS signal-based hook — createAIChat(). Fine-grained reactivity, zero virtual DOM.',
        github: 'https://github.com/trimooo/react-ai-stream',
        certified: false,
        badge: 'community',
        language: 'SolidJS',
        color: '#64748b',
      },
      {
        name: '@react-ai-stream/core (vanilla)',
        description: 'streamSSE() is framework-agnostic. Use it with any async iterator in plain JS or any framework.',
        npm: 'https://www.npmjs.com/package/@react-ai-stream/core',
        certified: true,
        badge: 'official',
        language: 'Vanilla JS',
        color: '#22c55e',
      },
    ],
  },
  {
    title: 'Tooling',
    subtitle: 'CLI tools and developer utilities built on the RAIS ecosystem.',
    packages: [
      {
        name: 'create-ai-stream-app',
        description: 'Project scaffolder — 6 platforms (Next.js, Vite React, Vite Vue, Express, FastAPI, HTML), 3 providers, auto-installs deps.',
        npm: 'https://www.npmjs.com/package/create-ai-stream-app',
        github: 'https://github.com/trimooo/react-ai-stream/tree/master/packages/create-ai-stream-app',
        certified: true,
        badge: 'official',
        language: 'Node.js CLI',
        color: '#e879f9',
      },
      {
        name: 'AI Stream Studio',
        description: 'This app — inspect, compare, benchmark, replay, and compliance-check any SSE streaming endpoint.',
        github: 'https://github.com/trimooo/react-ai-stream/tree/master/apps/playground',
        certified: true,
        badge: 'official',
        language: 'Next.js 15',
        color: '#e879f9',
      },
    ],
  },
]

const BADGE_STYLE: Record<Package['badge'], React.CSSProperties> = {
  official: { background: 'rgba(59,91,255,0.2)', color: '#93c5fd', border: '1px solid rgba(59,91,255,0.3)' },
  community: { background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' },
  adapter: { background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' },
}

function PackageCard({ pkg }: { pkg: Package }) {
  const links = [
    pkg.npm && { label: 'npm', href: pkg.npm },
    pkg.pypi && { label: 'PyPI', href: pkg.pypi },
    pkg.github && { label: 'GitHub', href: pkg.github },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border-color 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'ui-monospace, monospace' }}>
              {pkg.name}
            </span>
            {pkg.certified && (
              <span title="RAIS Certified" style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)', fontWeight: 700 }}>
                ✓ Certified
              </span>
            )}
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', ...BADGE_STYLE[pkg.badge] }}>
              {pkg.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{pkg.description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 11, color: '#475569', background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '2px 7px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {pkg.language}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {links.map(link => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#3B5BFF', textDecoration: 'none', fontWeight: 600, padding: '3px 9px', borderRadius: 5, border: '1px solid rgba(59,91,255,0.25)', background: 'rgba(59,91,255,0.08)' }}>
              {link.label} →
            </a>
          ))}
          {links.length === 0 && (
            <span style={{ fontSize: 12, color: '#334155' }}>Coming soon</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EcosystemPage() {
  const totalCertified = SECTIONS.flatMap(s => s.packages).filter(p => p.certified && p.badge === 'official').length
  const totalCommunity = SECTIONS.flatMap(s => s.packages).filter(p => p.badge === 'community').length

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 12px', marginBottom: 14, fontSize: 11, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          RAIS Ecosystem
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9', lineHeight: 1.1 }}>
          Every package that speaks RAIS.
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 15, color: '#64748b', maxWidth: 560, lineHeight: 1.7 }}>
          Official packages, community adapters, and certified implementations — all verified against the RAIS Protocol v1 spec.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Official packages', value: String(totalCertified), color: '#3B5BFF' },
            { label: 'Community adapters', value: String(totalCommunity), color: '#94a3b8' },
            { label: 'Languages', value: '5+', color: '#e879f9' },
            { label: 'Protocol version', value: 'v1.0', color: '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 20px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RAIS Certified badge explanation */}
      <div style={{ marginBottom: 40, padding: '16px 20px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 22, lineHeight: 1 }}>✓</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>RAIS Certified</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Packages with the "Certified" badge have been verified to implement all RAIS Protocol v1 requirements:{' '}
              correct event types (<code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3, fontSize: 12 }}>text</code>,{' '}
              <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3, fontSize: 12 }}>done</code>,{' '}
              <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3, fontSize: 12 }}>error</code>),{' '}
              proper SSE framing, AbortController support, and clean stream termination.{' '}
              <a href="/inspect" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>Test any endpoint →</a>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 52 }}>
        {SECTIONS.map(section => (
          <div key={section.title}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                {section.title}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{section.subtitle}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {section.packages.map(pkg => (
                <PackageCard key={pkg.name + pkg.badge} pkg={pkg} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Community CTA */}
      <div style={{ marginTop: 64, padding: '32px 36px', background: 'rgba(59,91,255,0.08)', border: '1px solid rgba(59,91,255,0.2)', borderRadius: 16, textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
          Built a RAIS adapter?
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
          If your package implements RAIS Protocol v1, open a PR to add it here.
          Use the{' '}
          <a href="/inspect" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>Stream Inspector</a>{' '}
          to validate compliance before submitting.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noopener noreferrer"
            style={{ padding: '10px 24px', background: '#3B5BFF', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Submit your package →
          </a>
          <a href="/inspect"
            style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            Validate compliance
          </a>
        </div>
      </div>

      {/* RAIS spec quick reference */}
      <div style={{ marginTop: 40, padding: '24px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
          RAIS Protocol v1 — Quick Reference
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { event: 'text', payload: '{ "type": "text", "text": "..." }', color: '#3B5BFF' },
            { event: 'done', payload: '{ "type": "done" }', color: '#22c55e' },
            { event: 'error', payload: '{ "type": "error", "error": "..." }', color: '#ef4444' },
          ].map(e => (
            <div key={e.event} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${e.color}22` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: e.color, textTransform: 'uppercase', marginBottom: 6 }}>{e.event}</div>
              <code style={{ fontSize: 11, color: '#64748b', fontFamily: 'ui-monospace, monospace' }}>{e.payload}</code>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: '#334155' }}>
          All events transported as SSE frames: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 }}>data: {'{...}'}\n\n</code>
        </div>
      </div>
    </main>
  )
}
