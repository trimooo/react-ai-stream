import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useAIChat } from '../src/composables/useAIChat.js'
import type { AIClient, StreamChunk, Message } from '@react-ai-stream/core'

afterEach(() => { vi.restoreAllMocks() })

function makeClient(chunks: StreamChunk[]): AIClient {
  return {
    provider: {
      async *stream(_msgs: Message[], _signal: AbortSignal) {
        for (const c of chunks) yield c
      },
    },
  }
}

function mountComposable(options: Parameters<typeof useAIChat>[0]) {
  let result!: ReturnType<typeof useAIChat>
  const Component = defineComponent({
    setup() { result = useAIChat(options) },
    template: '<div/>',
  })
  const wrapper = mount(Component)
  return { result: () => result, wrapper }
}

describe('useAIChat (Vue)', () => {
  it('initial state: empty messages, not loading, no error', () => {
    const { result } = mountComposable({ client: makeClient([]) })
    expect(result().messages.value).toEqual([])
    expect(result().loading.value).toBe(false)
    expect(result().error.value).toBeNull()
  })

  it('sendMessage adds user then assistant message', async () => {
    const client = makeClient([{ type: 'text', text: 'Hi' }, { type: 'done' }])
    const { result } = mountComposable({ client })
    await result().sendMessage('Hello')
    await nextTick()
    expect(result().messages.value).toHaveLength(2)
    expect(result().messages.value[0]!.role).toBe('user')
    expect(result().messages.value[0]!.content).toBe('Hello')
    expect(result().messages.value[1]!.role).toBe('assistant')
    expect(result().messages.value[1]!.content).toBe('Hi')
  })

  it('accumulates multiple text chunks', async () => {
    const client = makeClient([
      { type: 'text', text: 'Hello' },
      { type: 'text', text: ', world' },
      { type: 'done' },
    ])
    const { result } = mountComposable({ client })
    await result().sendMessage('Hi')
    expect(result().messages.value[1]!.content).toBe('Hello, world')
  })

  it('fires onToken for each text chunk', async () => {
    const onToken = vi.fn()
    const client = makeClient([{ type: 'text', text: 'A' }, { type: 'text', text: 'B' }, { type: 'done' }])
    const { result } = mountComposable({ client, onToken })
    await result().sendMessage('Hi')
    expect(onToken).toHaveBeenCalledTimes(2)
    expect(onToken).toHaveBeenNthCalledWith(1, 'A')
    expect(onToken).toHaveBeenNthCalledWith(2, 'B')
  })

  it('fires onComplete with final message', async () => {
    const onComplete = vi.fn()
    const client = makeClient([{ type: 'text', text: 'Done' }, { type: 'done' }])
    const { result } = mountComposable({ client, onComplete })
    await result().sendMessage('Hi')
    expect(onComplete).toHaveBeenCalledOnce()
    expect(onComplete.mock.calls[0]![0].content).toBe('Done')
  })

  it('sets error and fires onError on error chunk', async () => {
    const onError = vi.fn()
    const client = makeClient([{ type: 'error', error: 'overloaded' }])
    const { result } = mountComposable({ client, onError })
    await result().sendMessage('Hi')
    expect(result().error.value).toBe('overloaded')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'overloaded' }))
    expect(result().loading.value).toBe(false)
  })

  it('loading is false after stream completes', async () => {
    const client = makeClient([{ type: 'done' }])
    const { result } = mountComposable({ client })
    await result().sendMessage('Hi')
    expect(result().loading.value).toBe(false)
  })

  it('stop() clears loading immediately', async () => {
    let release!: () => void
    const blockingClient: AIClient = {
      provider: {
        async *stream() {
          await new Promise<void>((r) => { release = r })
          yield { type: 'done' }
        },
      },
    }
    const { result } = mountComposable({ client: blockingClient })
    result().sendMessage('Hi') // don't await
    await nextTick()
    expect(result().loading.value).toBe(true)
    result().stop()
    expect(result().loading.value).toBe(false)
    release()
  })

  it('clearMessages empties the list', async () => {
    const client = makeClient([{ type: 'done' }])
    const { result } = mountComposable({ client })
    await result().sendMessage('Hi')
    expect(result().messages.value.length).toBeGreaterThan(0)
    result().clearMessages()
    expect(result().messages.value).toHaveLength(0)
  })

  it('ignores sendMessage while loading', async () => {
    const streamFn = vi.fn().mockImplementation(async function* () {
      yield { type: 'done' } as StreamChunk
    })
    const client: AIClient = { provider: { stream: streamFn } }
    const { result } = mountComposable({ client })
    const p1 = result().sendMessage('first')
    void result().sendMessage('second') // should be no-op
    await p1
    expect(streamFn).toHaveBeenCalledTimes(1)
  })

  it('aborts stream on component unmount', async () => {
    let capturedSignal!: AbortSignal
    const client: AIClient = {
      provider: {
        async *stream(_msgs: Message[], signal: AbortSignal) {
          capturedSignal = signal
          await new Promise(() => {}) // never resolves
        },
      },
    }
    const { result, wrapper } = mountComposable({ client })
    result().sendMessage('Hi')
    await nextTick()
    wrapper.unmount()
    expect(capturedSignal.aborted).toBe(true)
  })
})
