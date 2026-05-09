import React from 'react'
import { useRouter } from 'next/router'
import { DocsThemeConfig } from 'nextra-theme-docs'

const SITE_URL = 'https://react-ai-stream-docs.vercel.app'
const GITHUB_URL = 'https://github.com/trimooo/react-ai-stream'
const DEMO_URL = 'https://react-ai-stream-example.vercel.app'

const config: DocsThemeConfig = {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
        react-ai-stream
      </span>
      <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: 20, fontWeight: 500 }}>
        v0.1.3
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
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Backend-agnostic AI streaming for React. One hook. Any provider. Drop-in UI or bring your own." />
        <meta name="keywords" content="react, ai, streaming, chat, hook, anthropic, openai, groq, llm, sse" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="react-ai-stream" />
        <meta property="og:title" content="react-ai-stream — Backend-agnostic AI streaming for React" />
        <meta property="og:description" content="One hook. Any provider. Drop-in UI or bring your own." />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="react-ai-stream" />
        <meta name="twitter:description" content="Backend-agnostic AI streaming for React. One hook. Any provider." />
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
