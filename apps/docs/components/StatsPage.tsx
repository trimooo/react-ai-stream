import React, { useEffect, useState } from 'react'

const GITHUB = 'trimooo/react-ai-stream'
const PKGS = [
  '@react-ai-stream/core',
  '@react-ai-stream/react',
  '@react-ai-stream/ui',
] as const

// ── types ──────────────────────────────────────────────────────────────────────

interface RepoStats {
  stars: number
  forks: number
  openIssues: number
  watchers: number
  pushedAt: string
  createdAt: string
}

interface PkgDownloads {
  pkg: string
  weekly: number
  monthly: number
  daily: number[]
}

interface PkgInfo {
  pkg: string
  version: string
  publishedAt: string
  unpackedSize: number
  gzip: number
}

interface GhIssue {
  number: number
  title: string
  html_url: string
  labels: { name: string; color: string }[]
  created_at: string
  pull_request?: object
}

// ── helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function bytes(n: number): string {
  if (!n) return '—'
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} kB`
  return `${n} B`
}

function ago(iso: string): string {
  if (!iso) return '—'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1 day ago'
  if (d < 30) return `${d} days ago`
  const m = Math.floor(d / 30)
  if (m === 1) return '1 month ago'
  if (m < 12) return `${m} months ago`
  return `${Math.floor(m / 12)}y ago`
}

async function safeJson(url: string): Promise<any> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return r.json()
  } catch {
    return null
  }
}

// ── sub-components ─────────────────────────────────────────────────────────────

function Card({
  icon,
  value,
  label,
  sub,
  href,
}: {
  icon: string
  value: string
  label: string
  sub?: string
  href?: string
}) {
  const inner = (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', height: '100%' }}>
      <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>
  return inner
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div style={{ width: 96, height: 28 }} />
  const w = 96
  const h = 28
  const max = Math.max(...data) || 1
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h * 0.9 - 2}`)
    .join(' ')
  const areaBottom = data.map((_, i) => `${(i / (data.length - 1)) * w},${h}`).reverse().join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block', flexShrink: 0 }}>
      <polygon points={`${pts} ${areaBottom}`} fill="#7c3aed" opacity={0.08} />
      <polyline points={pts} fill="none" stroke="#7c3aed" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '32px 0 12px' }}>
      {children}
    </h2>
  )
}

function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
  )
}

// ── main ───────────────────────────────────────────────────────────────────────

export function StatsPage() {
  const [repo, setRepo] = useState<RepoStats | null>(null)
  const [downloads, setDownloads] = useState<PkgDownloads[]>([])
  const [pkgInfos, setPkgInfos] = useState<PkgInfo[]>([])
  const [issues, setIssues] = useState<GhIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // GitHub: repo + open issues in parallel
        const [ghRepo, ghIssues] = await Promise.all([
          safeJson(`https://api.github.com/repos/${GITHUB}`),
          safeJson(`https://api.github.com/repos/${GITHUB}/issues?state=open&per_page=20`),
        ])

        if (ghRepo) {
          setRepo({
            stars: ghRepo.stargazers_count,
            forks: ghRepo.forks_count,
            openIssues: ghRepo.open_issues_count,
            watchers: ghRepo.subscribers_count,
            pushedAt: ghRepo.pushed_at,
            createdAt: ghRepo.created_at,
          })
        }

        if (Array.isArray(ghIssues)) {
          const realIssues = ghIssues.filter((i: GhIssue) => !i.pull_request)
          setIssues(realIssues.slice(0, 6))
        }

        // npm: downloads range + bundlephobia for all packages in parallel
        const [dlData, bpData, regData] = await Promise.all([
          Promise.all(
            PKGS.map(p => safeJson(`https://api.npmjs.org/downloads/range/last-month/${p}`))
          ),
          Promise.all(
            PKGS.map(p => safeJson(`https://bundlephobia.com/api/size?package=${p}`))
          ),
          Promise.all(
            PKGS.map(p => safeJson(`https://registry.npmjs.org/${p}`))
          ),
        ])

        const dlResult: PkgDownloads[] = PKGS.map((pkg, i) => {
          const raw = dlData[i]
          const daily: number[] = (raw?.downloads ?? []).map((d: { downloads: number }) => d.downloads)
          const monthly = daily.reduce((s, n) => s + n, 0)
          const weekly = daily.slice(-7).reduce((s, n) => s + n, 0)
          return { pkg, weekly, monthly, daily }
        })
        setDownloads(dlResult)

        const infoResult: PkgInfo[] = PKGS.map((pkg, i) => {
          const reg = regData[i]
          const bp = bpData[i]
          const version = reg?.['dist-tags']?.latest ?? '—'
          const publishedAt = reg?.time?.[version] ?? ''
          const unpackedSize = reg?.versions?.[version]?.dist?.unpackedSize ?? 0
          return {
            pkg,
            version,
            publishedAt,
            unpackedSize,
            gzip: bp?.gzip ?? 0,
          }
        })
        setPkgInfos(infoResult)
      } catch (e) {
        setFetchError('Could not load some stats. GitHub API allows 60 requests/hour for unauthenticated users.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const totalMonthly = downloads.reduce((s, d) => s + d.monthly, 0)
  const totalWeekly = downloads.reduce((s, d) => s + d.weekly, 0)

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {fetchError && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {fetchError}
        </div>
      )}

      {/* ── GitHub ── */}
      <SectionTitle>GitHub</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={88} />)
        ) : (
          <>
            <Card icon="★" value={fmt(repo?.stars ?? 0)} label="Stars" href={`https://github.com/${GITHUB}/stargazers`} />
            <Card icon="⑂" value={fmt(repo?.forks ?? 0)} label="Forks" href={`https://github.com/${GITHUB}/forks`} />
            <Card icon="◎" value={String(repo?.openIssues ?? 0)} label="Open issues" sub="includes PRs" href={`https://github.com/${GITHUB}/issues`} />
            <Card icon="⏱" value={ago(repo?.pushedAt ?? '')} label="Last commit" />
          </>
        )}
      </div>

      {/* ── npm downloads ── */}
      <SectionTitle>
        npm Downloads
        {totalMonthly > 0 && (
          <span style={{ marginLeft: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#64748b', fontSize: 13 }}>
            {fmt(totalMonthly)} installs last 30 days · {fmt(totalWeekly)} last 7 days
          </span>
        )}
      </SectionTitle>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < 2 ? '1px solid #f1f5f9' : undefined, display: 'flex', gap: 16, alignItems: 'center' }}>
                <Skeleton w={220} />
                <Skeleton w={96} h={28} />
                <div style={{ marginLeft: 'auto' }}><Skeleton w={60} /></div>
              </div>
            ))
          : downloads.map((d, i) => (
              <div
                key={d.pkg}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderBottom: i < downloads.length - 1 ? '1px solid #f1f5f9' : undefined,
                  flexWrap: 'wrap',
                }}
              >
                <code style={{ fontSize: 12, color: '#7c3aed', flex: '0 0 auto', minWidth: 200 }}>{d.pkg}</code>
                <Sparkline data={d.daily} />
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{fmt(d.monthly)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>30 days</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 52 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{fmt(d.weekly)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>7 days</div>
                </div>
              </div>
            ))}
      </div>

      {/* ── package info ── */}
      <SectionTitle>Packages</SectionTitle>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 0.8fr 0.8fr', background: '#f8fafc', padding: '8px 16px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', borderBottom: '1px solid #e2e8f0', gap: 8 }}>
          <span>Package</span>
          <span>Version</span>
          <span>Published</span>
          <span>Unpacked</span>
          <span>Gzip</span>
        </div>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: i < 2 ? '1px solid #f1f5f9' : undefined }}>
                <Skeleton />
              </div>
            ))
          : pkgInfos.map((p, i) => (
              <div
                key={p.pkg}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.8fr 1fr 0.8fr 0.8fr',
                  padding: '10px 16px',
                  fontSize: 13,
                  borderBottom: i < pkgInfos.length - 1 ? '1px solid #f1f5f9' : undefined,
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <a
                  href={`https://www.npmjs.com/package/${p.pkg}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <code style={{ fontSize: 11.5, color: '#7c3aed' }}>{p.pkg}</code>
                </a>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>v{p.version}</span>
                <span style={{ color: '#64748b' }}>{ago(p.publishedAt)}</span>
                <span style={{ color: '#64748b' }}>{bytes(p.unpackedSize)}</span>
                <span style={{ color: '#64748b' }}>{bytes(p.gzip)}</span>
              </div>
            ))}
      </div>

      {/* ── open issues ── */}
      <SectionTitle>
        Open Issues
        <a
          href={`https://github.com/${GITHUB}/issues`}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: 10, fontWeight: 500, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: '#7c3aed', textDecoration: 'none' }}
        >
          View all on GitHub →
        </a>
      </SectionTitle>

      {loading ? (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: i < 2 ? '1px solid #f1f5f9' : undefined }}>
              <Skeleton w="70%" />
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div style={{ padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#166534', fontSize: 13, fontWeight: 500 }}>
          ✓ No open issues
        </div>
      ) : (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          {issues.map((issue, i) => (
            <div
              key={issue.number}
              style={{
                padding: '10px 16px',
                borderBottom: i < issues.length - 1 ? '1px solid #f1f5f9' : undefined,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, marginTop: 2, fontFamily: 'monospace' }}>#{issue.number}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: '#0f172a', textDecoration: 'none', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {issue.title}
                </a>
                {issue.labels.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                    {issue.labels.map(l => (
                      <span
                        key={l.name}
                        style={{
                          fontSize: 10,
                          padding: '1px 7px',
                          borderRadius: 20,
                          background: `#${l.color}18`,
                          color: `#${l.color}`,
                          border: `1px solid #${l.color}40`,
                          fontWeight: 600,
                        }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{ago(issue.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── open PRs ── */}
      <SectionTitle>
        Pull Requests
        <a
          href={`https://github.com/${GITHUB}/pulls`}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: 10, fontWeight: 500, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: '#7c3aed', textDecoration: 'none' }}
        >
          View all →
        </a>
      </SectionTitle>

      {/* ── footer note ── */}
      <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 24 }}>
        Live data from GitHub API and npm registry · refreshes on each page load ·{' '}
        <a href={`https://github.com/${GITHUB}`} target="_blank" rel="noreferrer" style={{ color: '#94a3b8' }}>
          github.com/{GITHUB}
        </a>
      </p>
    </>
  )
}
