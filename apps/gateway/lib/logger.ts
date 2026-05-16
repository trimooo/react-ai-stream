// Structured JSON logger. Vercel captures stdout/stderr per-request.
// Each line is a valid JSON object — easy to parse in log drains (Sentry, Logtail, etc).

export interface RequestCtx {
  req_id: string
  key_id: string
  plan: string
  key_type: string
  provider: string
  origin: string | null
  ua: string | null
}

export function makeReqId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function logRequest(ctx: RequestCtx): void {
  console.log(JSON.stringify({ event: 'request_start', ...ctx, ts: Date.now() }))
}

export function logComplete(ctx: RequestCtx & { latency_ms: number; tokens: number }): void {
  console.log(JSON.stringify({ event: 'request_complete', ...ctx, ts: Date.now() }))
}

export function logRateLimit(ctx: Pick<RequestCtx, 'req_id' | 'key_id' | 'plan'> & { reason: string }): void {
  console.warn(JSON.stringify({ event: 'rate_limited', ...ctx, ts: Date.now() }))
}

export function logCapBlocked(ctx: Pick<RequestCtx, 'req_id' | 'key_id' | 'plan'> & { reason: string }): void {
  console.warn(JSON.stringify({ event: 'cap_blocked', ...ctx, ts: Date.now() }))
}

export function logError(ctx: {
  req_id: string
  key_id?: string
  plan?: string
  provider?: string
  error: string
  status?: number
}): void {
  console.error(JSON.stringify({ event: 'error', ...ctx, ts: Date.now() }))
}

export function logProviderError(ctx: {
  req_id: string
  provider: string
  error: string
  fallback_to?: string
}): void {
  console.warn(JSON.stringify({ event: 'provider_error', ...ctx, ts: Date.now() }))
}

export function logAbuse(ctx: {
  req_id: string
  key_id?: string
  reason: string
  detail?: string
  ip?: string
}): void {
  console.error(JSON.stringify({ event: 'abuse_blocked', ...ctx, ts: Date.now() }))
}
