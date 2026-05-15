import React from 'react'
import { useRouter } from 'next/router'
import { DocsThemeConfig } from 'nextra-theme-docs'

const SITE_URL = 'https://react-ai-stream-docs.vercel.app'
const GITHUB_URL = 'https://github.com/trimooo/react-ai-stream'
const DEMO_URL = 'https://react-ai-stream-example.vercel.app'

function RaisMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="0" y="0" width="100" height="100" rx="14" fill="#0E1116"/>
      <path d="M28 22 H58 a16 16 0 0 1 0 32 H44 L62 78 H50 L34 56 H40 V46 H56 a6 6 0 0 0 0 -12 H40 V78 H28 Z" fill="#F6F4EF"/>
      <rect x="0" y="56" width="100" height="4" fill="#3B5BFF"/>
      <circle cx="86" cy="58" r="6" fill="#3B5BFF" stroke="#0E1116" strokeWidth="3"/>
    </svg>
  )
}

const config: DocsThemeConfig = {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <RaisMark />
      <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
        react-ai-stream
      </span>
      <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: 20, fontWeight: 500 }}>
        v1.0.0
      </span>
    </div>
  ),
  project: { link: GITHUB_URL },
  chat: {
    link: DEMO_URL,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="Live demo">
        <path
          d="M17 10c0 3.87-3.13 7-7 7a6.97 6.97 0 01-3.87-1.17L3 17l1.17-3.13A6.97 6.97 0 013 10c0-3.87 3.13-7 7-7s7 3.13 7 7z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  docsRepositoryBase: `${GITHUB_URL}/tree/master/apps/docs`,
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath === '/') {
      return {
        title: 'react-ai-stream — Backend-agnostic AI streaming for React',
        description: 'One hook. Any provider. Drop-in UI or bring your own. Works with Anthropic, OpenAI, Groq, or any streaming endpoint.',
      }
    }
    return { titleTemplate: '%s – react-ai-stream' }
  },
  head() {
    const { asPath } = useRouter()
    const canonical = `${SITE_URL}${asPath}`
    const isHome = asPath === '/'
    const title = isHome
      ? 'react-ai-stream — Backend-agnostic AI streaming for React'
      : 'react-ai-stream'
    const description = 'One hook. Any provider. Build streaming AI chat with OpenAI, Anthropic, Groq, or your own backend.'
    return (
      <>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <meta name="keywords" content="react, ai, streaming, chat, hook, anthropic, openai, groq, llm, sse, server-sent events" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="react-ai-stream" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </>
    )
  },
  footer: {
    text: (
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>MIT License</span>
        <a href={GITHUB_URL} style={{ fontSize: 13, color: '#6b7280' }}>GitHub</a>
        <a href="https://www.npmjs.com/package/@react-ai-stream/react" style={{ fontSize: 13, color: '#6b7280' }}>npm</a>
        <a href={DEMO_URL} style={{ fontSize: 13, color: '#6b7280' }}>Live demo</a>
      </div>
    ),
  },
  navigation: true,
  darkMode: true,
  primaryHue: 262,
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return (
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>
            {title}
          </span>
        )
      }
      return <>{title}</>
    },
    defaultMenuCollapseLevel: 1,
  },
  toc: {
    backToTop: true,
  },
  feedback: {
    content: 'Question or issue? Open on GitHub →',
    labels: 'feedback',
  },
}

export default config
