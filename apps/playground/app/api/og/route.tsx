import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

interface ProviderRow {
  name: string
  color: string
  model: string
  p50ToksPerSec: number
  p50Ttfb: number
  avgElapsed: number
  errors: number
}

interface ReportData {
  prompt: string
  providers: ProviderRow[]
  numRuns: number
  timestamp: number
}

function decode(s: string): ReportData | null {
  try { return JSON.parse(decodeURIComponent(atob(s))) as ReportData } catch { return null }
}

export async function GET(req: NextRequest) {
  const reportParam = req.nextUrl.searchParams.get('report')
  const data = reportParam ? decode(reportParam) : null

  if (!data || !data.providers?.length) {
    return new ImageResponse(
      <DefaultCard />,
      { width: 1200, height: 630 }
    )
  }

  const bestTtfb = data.providers.filter(p => p.p50Ttfb > 0).reduce(
    (a, b) => a.p50Ttfb < b.p50Ttfb ? a : b,
    data.providers.find(p => p.p50Ttfb > 0) ?? data.providers[0]!
  )
  const bestToks = data.providers.reduce(
    (a, b) => a.p50ToksPerSec >= b.p50ToksPerSec ? a : b,
    data.providers[0]!
  )

  const providerLine = data.providers.map(p => p.name).join(' vs ')
  const dateStr = new Date(data.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#020817',
        padding: '52px 60px',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, background: '#0E1116', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ color: '#F6F4EF', fontWeight: 900, fontSize: 20, letterSpacing: '-1px' }}>R</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>AI Stream Studio</span>
            <span style={{ color: '#334155', fontSize: 12, fontWeight: 600, letterSpacing: '1px' }}>RAIS PROTOCOL</span>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(59,91,255,0.15)', border: '1px solid rgba(59,91,255,0.3)',
          borderRadius: 20, padding: '5px 14px',
        }}>
          <span style={{ color: '#93c5fd', fontSize: 13, fontWeight: 700, letterSpacing: '1px' }}>BENCHMARK REPORT</span>
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#f1f5f9', fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 8 }}>
          {providerLine.length > 40 ? providerLine.slice(0, 40) + '…' : providerLine}
        </div>
        <div style={{ color: '#475569', fontSize: 15, fontWeight: 500 }}>
          {data.numRuns} run{data.numRuns > 1 ? 's' : ''} per provider · {dateStr}
        </div>
      </div>

      {/* Prompt */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 28,
      }}>
        <span style={{ color: '#64748b', fontSize: 15, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{data.prompt.length > 90 ? data.prompt.slice(0, 90) + '…' : data.prompt}"
        </span>
      </div>

      {/* Provider cards row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flex: 1 }}>
        {data.providers.slice(0, 4).map(p => {
          const isBestTtfb = p.name === bestTtfb.name && p.p50Ttfb > 0
          const isBestToks = p.name === bestToks.name && p.p50ToksPerSec > 0
          return (
            <div key={p.name} style={{
              display: 'flex', flexDirection: 'column', flex: 1,
              background: `${p.color}12`,
              border: `1px solid ${p.color}40`,
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: p.color, flexShrink: 0 }} />
                <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15 }}>{p.name}</span>
                {(isBestTtfb || isBestToks) && (
                  <span style={{ color: p.color, fontSize: 13, marginLeft: 'auto' }}>★</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: 12 }}>TTFB</span>
                  <span style={{ color: isBestTtfb ? p.color : '#94a3b8', fontWeight: isBestTtfb ? 700 : 400, fontSize: 14 }}>
                    {p.p50Ttfb > 0 ? `${p.p50Ttfb.toFixed(0)}ms` : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: 12 }}>Tok/s</span>
                  <span style={{ color: isBestToks ? p.color : '#94a3b8', fontWeight: isBestToks ? 700 : 400, fontSize: 14 }}>
                    {p.p50ToksPerSec > 0 ? `${p.p50ToksPerSec.toFixed(1)}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Winner row */}
      <div style={{ display: 'flex', gap: 12 }}>
        {bestTtfb.p50Ttfb > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: `${bestTtfb.color}15`, border: `1px solid ${bestTtfb.color}35`,
            borderRadius: 8, padding: '10px 16px', flex: 1,
          }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px' }}>FASTEST TTFB</span>
              <span style={{ color: bestTtfb.color, fontWeight: 800, fontSize: 16 }}>
                {bestTtfb.name} · {bestTtfb.p50Ttfb.toFixed(0)}ms
              </span>
            </div>
          </div>
        )}
        {bestToks.p50ToksPerSec > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: `${bestToks.color}15`, border: `1px solid ${bestToks.color}35`,
            borderRadius: 8, padding: '10px 16px', flex: 1,
          }}>
            <span style={{ fontSize: 16 }}>🚀</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px' }}>BEST THROUGHPUT</span>
              <span style={{ color: bestToks.color, fontWeight: 800, fontSize: 16 }}>
                {bestToks.name} · {bestToks.p50ToksPerSec.toFixed(1)} tok/s
              </span>
            </div>
          </div>
        )}
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}

function DefaultCard() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      background: '#020817', padding: '60px 72px',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 36 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, background: '#0E1116', borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ color: '#F6F4EF', fontWeight: 900, fontSize: 28 }}>R</span>
        </div>
        <span style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 28, letterSpacing: '-1px' }}>AI Stream Studio</span>
      </div>
      <div style={{ color: '#f1f5f9', fontSize: 52, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>
        Benchmark any<br />AI streaming provider.
      </div>
      <div style={{ color: '#475569', fontSize: 22 }}>
        Compare TTFB · Throughput · Cost · RAIS Compliance
      </div>
    </div>
  )
}
