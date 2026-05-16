export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { extractBearer, validateKey, keyIdFromRaw } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { checkCaps, incrementUsage } from '@/lib/usage'
import { streamWithFallback, type ProviderName, type GatewayMessage } from '@/lib/providers'
import { chunksToStream, sseHeaders } from '@/lib/rais-writer'
import { getGuard, validateBody, checkBodySize } from '@/lib/guard'
import {
  makeReqId, logRequest, logComplete, logError,
  logRateLimit, logCapBlocked, logAbuse,
} from '@/lib/logger'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  const req_id = makeReqId()
  const origin = req.headers.get('origin')
  const ua = req.headers.get('user-agent')

  // 1. Auth
  const raw = extractBearer(req.headers.get('Authorization'))
  if (!raw) {
    logError({ req_id, error: 'missing_auth', status: 401 })
    return Response.json({ error: 'Missing Authorization header. Use: Bearer ras_live_... or ras_test_...' }, { status: 401, headers: CORS_HEADERS })
  }

  const keyRecord = await validateKey(raw)
  if (!keyRecord) {
    logError({ req_id, key_id: keyIdFromRaw(raw), error: 'invalid_key', status: 401 })
    return Response.json({ error: 'Invalid API key' }, { status: 401, headers: CORS_HEADERS })
  }

  const { id: keyId, plan, key_type } = keyRecord
  const guard = getGuard(plan, key_type)

  // 2. Body size check (fast path before JSON parse)
  if (!checkBodySize(req.headers.get('content-length'), guard)) {
    logAbuse({ req_id, key_id: keyId, reason: 'body_too_large', detail: req.headers.get('content-length') ?? '' })
    return Response.json(
      { error: `Request body too large. Maximum: ${guard.max_body_bytes / 1024}KB` },
      { status: 413, headers: CORS_HEADERS },
    )
  }

  // 3. Rate limit (per-minute + per-day)
  const rl = await checkRateLimit(keyId, plan, key_type)
  if (!rl.allowed) {
    logRateLimit({ req_id, key_id: keyId, plan, reason: rl.reason ?? 'unknown' })
    return Response.json(
      { error: `Rate limit exceeded (${rl.reason?.replace('_', ' ')})` },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rl.resetAt),
          'Retry-After': String(rl.resetAt - Math.floor(Date.now() / 1000)),
        },
      },
    )
  }

  // 4. Token cap check
  const cap = await checkCaps(keyId, plan, key_type)
  if (!cap.allowed) {
    logCapBlocked({ req_id, key_id: keyId, plan, reason: cap.reason ?? '' })
    return Response.json({ error: cap.reason }, { status: 429, headers: CORS_HEADERS })
  }

  // 5. Parse + validate body
  let rawBody: unknown
  try {
    // Enforce body size at parse time too (content-length may be absent)
    const text = await req.text()
    if (text.length > guard.max_body_bytes) {
      logAbuse({ req_id, key_id: keyId, reason: 'body_too_large', detail: String(text.length) })
      return Response.json({ error: `Request body too large` }, { status: 413, headers: CORS_HEADERS })
    }
    rawBody = JSON.parse(text)
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS_HEADERS })
  }

  const validated = validateBody(rawBody, guard)
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status, headers: CORS_HEADERS })
  }

  const body = rawBody as Record<string, unknown>
  const provider = (body['provider'] as ProviderName | undefined) ?? undefined
  const model = (body['model'] as string | undefined) ?? undefined
  const fallback = Array.isArray(body['fallback']) ? (body['fallback'] as ProviderName[]) : undefined
  const resolvedProvider = provider ?? 'groq'

  // 6. Log request
  logRequest({ req_id, key_id: keyId, plan, key_type, provider: resolvedProvider, origin, ua })

  // 7. Stream with plan-level timeout
  const abort = new AbortController()
  const timeout = setTimeout(() => {
    abort.abort()
    logError({ req_id, key_id: keyId, plan, provider: resolvedProvider, error: 'stream_timeout' })
  }, guard.timeout_ms)

  req.signal.addEventListener('abort', () => {
    clearTimeout(timeout)
    abort.abort()
  })

  const startMs = Date.now()

  const streamReq = {
    messages: validated.messages as GatewayMessage[],
    max_tokens: validated.max_tokens,
    signal: abort.signal,
    ...(provider  ? { provider }  : {}),
    ...(model     ? { model }     : {}),
    ...(fallback  ? { fallback }  : {}),
  }

  const stream = chunksToStream(
    streamWithFallback(streamReq),
    (tokens) => {
      clearTimeout(timeout)
      const latency_ms = Date.now() - startMs
      logComplete({ req_id, key_id: keyId, plan, key_type, provider: resolvedProvider, origin, ua, latency_ms, tokens })
      incrementUsage(keyId, resolvedProvider, tokens)
    },
  )

  return new Response(stream, {
    headers: {
      ...sseHeaders(),
      ...CORS_HEADERS,
      'X-RateLimit-Remaining': String(rl.remaining),
      'X-RateLimit-Reset': String(rl.resetAt),
      'X-Request-Id': req_id,
    },
  })
}
