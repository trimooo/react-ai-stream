import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAIChat } from '../src/hooks/useAIChat.js'
import type { AIClient, StreamChunk, Message } from '@react-ai-stream/core'

afterEach(() => { vi.restoreAllMocks() })

function makeMockClient(chunks: StreamChunk[]): AIClient {
  return {
    provider: {
      async *stream(_messages: Message[], _signal: AbortSignal) {
        for (const chunk of chunks) {
          yield chunk
        }
      },
    },
  }
}

describe('useAIChat', () => {
  it('has correct initial state', () => {
    const { result } = renderHook(() => useAIChat({ client: makeMockClient([]) }))

    expect(result.current.messages).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('adds user and streamed assistant messages', async () => {
    const client = makeMockClient([
      { type: 'text', text: 'Hi ' },
      { type: 'text', text: 'there!' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: 'Hello' })
    expect(result.current.messages[1]).toMatchObject({ role: 'assistant', content: 'Hi there!' })
  })

  it('loading is false after streaming completes', async () => {
    const client = makeMockClient([{ type: 'text', text: 'ok' }, { type: 'done' }])
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      await result.current.sendMessage('test')
    })

    expect(result.current.loading).toBe(false)
  })

  it('sets error state when provider yields an error chunk', async () => {
    const client = makeMockClient([{ type: 'error', error: 'API quota exceeded' }])
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      await result.current.sendMessage('test')
    })

    expect(result.current.error).toBe('API quota exceeded')
    expect(result.current.loading).toBe(false)
  })

  it('clearMessages empties the message list', async () => {
    const client = makeMockClient([{ type: 'done' }])
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      await result.current.sendMessage('hello')
    })

    expect(result.current.messages.length).toBeGreaterThan(0)

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toEqual([])
  })

  it('stop() sets loading to false and aborts the stream', async () => {
    const client: AIClient = {
      provider: {
        async *stream(_messages: Message[], signal: AbortSignal) {
          await new Promise<void>((_resolve, reject) => {
            signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          })
        },
      },
    }
    const { result } = renderHook(() => useAIChat({ client }))

    act(() => {
      void result.current.sendMessage('test')
    })

    await waitFor(() => expect(result.current.loading).toBe(true))

    act(() => {
      result.current.stop()
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('ignores duplicate sendMessage calls while loading', async () => {
    let callCount = 0
    const client: AIClient = {
      provider: {
        async *stream(_messages: Message[], _signal: AbortSignal) {
          callCount++
          yield { type: 'done' }
        },
      },
    }
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      const first = result.current.sendMessage('first')
      void result.current.sendMessage('second')
      await first
    })

    expect(callCount).toBe(1)
  })

  it('fires onToken callback for each text chunk', async () => {
    const onToken = vi.fn()
    const client = makeMockClient([
      { type: 'text', text: 'A' },
      { type: 'text', text: 'B' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useAIChat({ client, onToken }))
    await act(async () => { await result.current.sendMessage('Hi') })
    expect(onToken).toHaveBeenCalledTimes(2)
    expect(onToken).toHaveBeenNthCalledWith(1, 'A')
    expect(onToken).toHaveBeenNthCalledWith(2, 'B')
  })

  it('fires onComplete with assembled assistant message', async () => {
    const onComplete = vi.fn()
    const client = makeMockClient([
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'world' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useAIChat({ client, onComplete }))
    await act(async () => { await result.current.sendMessage('Hi') })
    expect(onComplete).toHaveBeenCalledOnce()
    const msg: Message = onComplete.mock.calls[0]![0]
    expect(msg.role).toBe('assistant')
    expect(msg.content).toBe('Hello world')
  })

  it('fires onError callback on error chunk', async () => {
    const onError = vi.fn()
    const client = makeMockClient([{ type: 'error', error: 'timeout' }])
    const { result } = renderHook(() => useAIChat({ client, onError }))
    await act(async () => { await result.current.sendMessage('Hi') })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'timeout' }))
  })

  it('error chunk without error field falls back to "Stream error"', async () => {
    const client = makeMockClient([{ type: 'error' }])
    const { result } = renderHook(() => useAIChat({ client }))
    await act(async () => { await result.current.sendMessage('Hi') })
    expect(result.current.error).toBe('Stream error')
  })

  it('sends previous messages on the second turn', async () => {
    const streamFn = vi.fn().mockImplementation(async function* () {
      yield { type: 'text', text: 'reply' }
      yield { type: 'done' }
    })
    const client: AIClient = { provider: { stream: streamFn } }
    const { result } = renderHook(() => useAIChat({ client }))
    await act(async () => { await result.current.sendMessage('turn 1') })
    await act(async () => { await result.current.sendMessage('turn 2') })
    const secondCallMsgs = streamFn.mock.calls[1]![0] as Message[]
    expect(secondCallMsgs.some((m) => m.role === 'assistant')).toBe(true)
  })

  it('accepts endpoint string option and streams via fetch', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode('data: {"type":"text","text":"fetched"}\n\n'))
        ctrl.enqueue(encoder.encode('data: {"type":"done"}\n\n'))
        ctrl.close()
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, body: stream }))
    const { result } = renderHook(() =>
      useAIChat({ endpoint: 'http://localhost:9999/api/chat' })
    )
    await act(async () => { await result.current.sendMessage('Hi') })
    expect(result.current.messages[1]!.content).toBe('fetched')
  })
})
