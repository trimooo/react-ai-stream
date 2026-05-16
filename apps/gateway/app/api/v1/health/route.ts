export const runtime = 'nodejs'

import { PROVIDERS, type ProviderName } from '@/lib/providers'

async function checkProvider(name: ProviderName): Promise<{ ok: boolean; latency_ms: number }> {
  const config = PROVIDERS[name]
  const apiKey = process.env[config.envKey]
  if (!apiKey) return { ok: false, latency_ms: 0 }

  const start = Date.now()
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 3000)

    let url = config.baseUrl
    let headers: Record<string, string> = {}
    let body: unknown

    if (name === 'anthropic') {
      headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
      body = { model: config.defaultModel, max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }
    } else {
      headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      body = { model: config.defaultModel, max_tokens: 1, messages: [{ role: 'user', content: 'hi' }], stream: false }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    return { ok: res.ok, latency_ms: Date.now() - start }
  } catch {
    return { ok: false, latency_ms: Date.now() - start }
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET() {
  const results = await Promise.all(
    (['groq', 'openai', 'anthropic'] as const).map(async (name) => {
      const r = await checkProvider(name)
      return [name, r] as const
    }),
  )

  const providers = Object.fromEntries(results)
  const allOk = results.every(([, r]) => r.ok)

  return Response.json(
    { status: allOk ? 'ok' : 'degraded', providers, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503, headers: CORS },
  )
}
