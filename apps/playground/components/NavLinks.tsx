'use client'

import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/chat',       label: 'Chat'      },
  { href: '/inspect',    label: 'Inspect'   },
  { href: '/compare',    label: 'Compare'   },
  { href: '/benchmark',  label: 'Benchmark' },
  { href: '/gallery',    label: 'Gallery'   },
  { href: '/templates',  label: 'Templates' },
  { href: '/ecosystem',  label: 'Ecosystem' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {NAV_LINKS.map(l => {
        const active = pathname === l.href
        return (
          <a key={l.href} href={l.href} style={{
            fontSize: 13,
            color: active ? '#f1f5f9' : '#64748b',
            textDecoration: 'none',
            fontWeight: active ? 600 : 500,
            padding: '5px 12px',
            borderRadius: 6,
            background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
            transition: 'color 0.15s, background 0.15s',
          }}>
            {l.label}
          </a>
        )
      })}
    </nav>
  )
}
