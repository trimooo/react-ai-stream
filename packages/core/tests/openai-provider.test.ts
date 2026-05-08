import { describe, it, expect, vi, afterEach } from 'vitest'
import { OpenAIProvider } from '../src/providers/openai.js'
import type { StreamChunk } from '../src/types.js'

function makeSSEStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line))
      }
      controller.close()
    },
  })
}

function stubFetch(sseLines: string[], status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    body: makeSSEStream(sseLines),
    text: async () => 'Request failed',
  })
}

const userMessage = { id: '1', role: 'user' as const, content: 'Hi', createdAt: new Date() }

describe('OpenAIProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('streams text chunks from SSE response', async () => {
    vi.stubGlobal('fetch', stubFetch([
      'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"},"finish_reason":null}]}\n\n',
      'data: [DONE]\n\n',
    ]))

    const provider = new OpenAIProvider({ provider: 'openai', apiKey: 'sk-test' })
    const chunks: StreamChunk[] = []
    for await (const chunk of provider.stream([userMessage], new AbortController().signal)) {
      chunks.push(chunk)
    }

    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks).toHaveLength(2)
    expect(textChunks[0]!.text).toBe('Hello')
    expect(textChunks[1]!.text).toBe(' world')
  })

  it('stops after [DONE] without yielding further chunks', async () => {
    vi.stubGlobal('fetch', stubFetch([
      'data: {"choices":[{"delta":{"content":"first"},"finish_reason":null}]}\n\n',
      'data: [DONE]\n\n',
      'data: {"choices":[{"delta":{"content":"never"},"finish_reason":null}]}\n\n',
    ]))

    const provider = new OpenAIProvider({ provider: 'openai', apiKey: 'sk-test' })
    const chunks: StreamChunk[] = []
    for await (const chunk of provider.stream([userMessage], new AbortController().signal)) {
      chunks.push(chunk)
    }

    expect(chunks.filter((c) => c.type === 'text')).toHaveLength(1)
    expect(chunks[0]!.text).toBe('first')
  })

  it('uses gpt-4o as default model', async () => {
    const fetchMock = stubFetch(['data: [DONE]\n\n'])
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenAIProvider({ provider: 'openai', apiKey: 'sk-test' })
    for await (const _ of provider.stream([], new AbortController().signal)) { /* drain */ }

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.model).toBe('gpt-4o')
  })

  it('prepends system message when provided', async () => {
    const fetchMock = stubFetch(['data: [DONE]\n\n'])
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenAIProvider({ provider: 'openai', apiKey: 'sk-test', system: 'Be helpful.' })
    for await (const _ of provider.stream([userMessage], new AbortController().signal)) { /* drain */ }

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.messages[0]).toEqual({ role: 'system', content: 'Be helpful.' })
  })

  it('yields error chunk on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API key',
    }))

    const provider = new OpenAIProvider({ provider: 'openai', apiKey: 'bad-key' })
    const chunks: StreamChunk[] = []
    for await (const chunk of provider.stream([], new AbortController().signal)) {
      chunks.push(chunk)
    }

    expect(chunks[0]!.type).toBe('error')
  })

  it('rethrows AbortError when request is cancelled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))

    const provider = new OpenAIProvider({ provider: 'openai', apiKey: 'sk-test' })
    await expect(async () => {
      for await (const _ of provider.stream([], new AbortController().signal)) { /* drain */ }
    }).rejects.toThrow('Aborted')
  })
})
