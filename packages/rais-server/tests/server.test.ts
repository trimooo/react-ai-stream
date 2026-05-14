import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createRaisServer } from '../src/server.js'
import type { ServerConfig } from '../src/types.js'
import type { Server } from 'node:http'

const PORT = 3090

async function* fakeOpenAI(): AsyncGenerator<{ type: string; text?: string }> {
  yield { type: 'text', text: 'Hello' }
  yield { type: 'done' }
}

// Patch providers for unit tests — no real API keys needed
vi.mock('../src/providers/openai.js', () => ({
  streamOpenAI: vi.fn().mockImplementation(fakeOpenAI),
}))

vi.mock('../src/providers/anthropic.js', () => ({
  streamAnthropic: vi.fn().mockImplementation(fakeOpenAI),
}))

import { vi } from 'vitest'

const baseConfig: ServerConfig = {
  port: PORT,
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: 'sk-test',
  maxTokens: 512,
  cors: true,
}

describe('createRaisServer', () => {
  let server: Server

  beforeAll(async () => {
    server = createRaisServer(baseConfig)
    await new Promise<void>((resolve) => server.listen(PORT, resolve))
  })

  afterAll(() => {
    server.close()
  })

  it('returns 404 for non-chat paths', async () => {
    const res = await fetch(`http://localhost:${PORT}/`)
    expect(res.status).toBe(404)
  })

  it('returns 405 logic — GET to /api/chat returns 404 (only POST accepted)', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/chat`)
    expect(res.status).toBe(404)
  })

  it('OPTIONS preflight returns 204 with CORS headers', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/chat`, { method: 'OPTIONS' })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('returns 400 for invalid JSON body', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty messages array', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })
    expect(res.status).toBe(400)
  })

  it('POST /api/chat returns 200 with SSE content-type', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    expect(res.headers.get('cache-control')).toContain('no-cache')
    expect(res.headers.get('x-accel-buffering')).toBe('no')
  })

  it('POST /api/chat streams RAIS-compliant events', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    })
    const text = await res.text()
    expect(text).toContain('"type":"text"')
    expect(text).toContain('"type":"done"')
  })

  it('CORS headers present on POST response', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })
})

describe('createRaisServer — CORS disabled', () => {
  let server: Server
  const noCorsPort = PORT + 1

  beforeAll(async () => {
    server = createRaisServer({ ...baseConfig, port: noCorsPort, cors: false })
    await new Promise<void>((resolve) => server.listen(noCorsPort, resolve))
  })

  afterAll(() => { server.close() })

  it('OPTIONS returns 204 even when CORS is disabled (no CORS headers set)', async () => {
    const res = await fetch(`http://localhost:${noCorsPort}/api/chat`, { method: 'OPTIONS' })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('no CORS headers on POST response', async () => {
    const res = await fetch(`http://localhost:${noCorsPort}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
