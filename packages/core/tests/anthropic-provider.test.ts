import { describe, it, expect, vi, afterEach } from 'vitest'
import { AnthropicProvider } from '../src/providers/anthropic.js'
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

describe('AnthropicProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('streams text from content_block_delta events', async () => {
    vi.stubGlobal('fetch', stubFetch([
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}\n\n',
      'data: {"type":"message_stop"}\n\n',
    ]))

    const provider = new AnthropicProvider({ provider: 'anthropic', apiKey: 'sk-ant-test' })
    const chunks: StreamChunk[] = []
    for await (const chunk of provider.stream([userMessage], new AbortController().signal)) {
      chunks.push(chunk)
    }

    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks).toHaveLength(2)
    expect(textChunks[0]!.text).toBe('Hello')
    expect(textChunks[1]!.text).toBe(' world')
  })

  it('stops at message_stop without yielding further chunks', async () => {
    vi.stubGlobal('fetch', stubFetch([
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"first"}}\n\n',
      'data: {"type":"message_stop"}\n\n',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"never"}}\n\n',
    ]))

    const provider = new AnthropicProvider({ provider: 'anthropic', apiKey: 'sk-ant-test' })
    const chunks: StreamChunk[] = []
    for await (const chunk of provider.stream([userMessage], new AbortController().signal)) {
      chunks.push(chunk)
    }

    expect(chunks.filter((c) => c.type === 'text')).toHaveLength(1)
    expect(chunks[0]!.text).toBe('first')
  })

  it('uses claude-sonnet-4-6 as default model', async () => {
    const fetchMock = stubFetch(['data: {"type":"message_stop"}\n\n'])
    vi.stubGlobal('fetch', fetchMock)

    const provider = new AnthropicProvider({ provider: 'anthropic', apiKey: 'sk-ant-test' })
    for await (const _ of provider.stream([], new AbortController().signal)) { /* drain */ }

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.model).toBe('claude-sonnet-4-6')
  })

  it('passes system as top-level field when provided', async () => {
    const fetchMock = stubFetch(['data: {"type":"message_stop"}\n\n'])
    vi.stubGlobal('fetch', fetchMock)

    const provider = new AnthropicProvider({ provider: 'anthropic', apiKey: 'sk-ant-test', system: 'Be concise.' })
    for await (const _ of provider.stream([userMessage], new AbortController().signal)) { /* drain */ }

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.system).toBe('Be concise.')
  })

  it('skips non-delta event types (message_start, ping, etc.)', async () => {
    vi.stubGlobal('fetch', stubFetch([
      'data: {"type":"message_start","message":{}}\n\n',
      'data: {"type":"content_block_start","index":0}\n\n',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"ok"}}\n\n',
      'data: {"type":"message_stop"}\n\n',
    ]))

    const provider = new AnthropicProvider({ provider: 'anthropic', apiKey: 'sk-ant-test' })
    const chunks: StreamChunk[] = []
    for await (const chunk of provider.stream([], new AbortController().signal)) {
      chunks.push(chunk)
    }

    expect(chunks.filter((c) => c.type === 'text')).toHaveLength(1)
    expect(chunks[0]!.text).toBe('ok')
  })

  it('yields error chunk on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 529,
      statusText: 'Overloaded',
      text: async () => 'API overloaded',
    }))

    const provider = new AnthropicProvider({ provider: 'anthropic', apiKey: 'sk-ant-test' })
    const chunks: StreamChunk[] = []
    for await (const chunk of provider.stream([], new AbortController().signal)) {
      chunks.push(chunk)
    }

    expect(chunks[0]!.type).toBe('error')
  })

  it('rethrows AbortError when request is cancelled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))

    const provider = new AnthropicProvider({ provider: 'anthropic', apiKey: 'sk-ant-test' })
    await expect(async () => {
      for await (const _ of provider.stream([], new AbortController().signal)) { /* drain */ }
    }).rejects.toThrow('Aborted')
  })
})
