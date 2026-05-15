import type { Metadata } from 'next'
import BenchmarkClient from './BenchmarkClient'

interface Props {
  searchParams: Promise<{ report?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { report } = await searchParams

  if (!report) {
    return {
      title: 'Benchmark — AI Stream Studio',
      description: 'Compare AI provider latency, throughput, and cost. Groq, OpenAI, Anthropic, Ollama, and any RAIS endpoint.',
      openGraph: {
        title: 'Benchmark — AI Stream Studio',
        images: [{ url: '/api/og', width: 1200, height: 630 }],
      },
    }
  }

  try {
    const data = JSON.parse(decodeURIComponent(atob(report))) as {
      prompt: string
      providers: Array<{ name: string; p50ToksPerSec: number; p50Ttfb: number; model: string }>
      numRuns: number
      timestamp: number
    }
    const names = data.providers.map(p => p.name).join(' vs ')
    const best = data.providers.reduce(
      (a, b) => a.p50ToksPerSec >= b.p50ToksPerSec ? a : b,
      data.providers[0]!
    )
    const promptSnip = data.prompt.slice(0, 80)
    const ogImage = `/api/og?report=${encodeURIComponent(report)}`

    return {
      title: `${names} Benchmark — AI Stream Studio`,
      description: `"${promptSnip}${data.prompt.length > 80 ? '…' : ''}" — ${data.numRuns} run${data.numRuns > 1 ? 's' : ''}. ${best.name} leads at ${best.p50ToksPerSec.toFixed(1)} tok/s.`,
      openGraph: {
        title: `${names} Benchmark`,
        description: `"${promptSnip}" — RAIS Protocol latency & throughput report`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: `${names} benchmark results` }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${names} Benchmark — AI Stream Studio`,
        description: `"${promptSnip}${data.prompt.length > 80 ? '…' : ''}" — ${best.name} wins at ${best.p50ToksPerSec.toFixed(1)} tok/s`,
        images: [ogImage],
      },
    }
  } catch {
    return { title: 'Benchmark — AI Stream Studio' }
  }
}

export default function BenchmarkPage() {
  return <BenchmarkClient />
}
