import type { RequestHandler } from 'express'
import {
  createAIClient,
  isAbortError,
} from '@react-ai-stream/core'
import type {
  Message,
  StreamChunk,
  OpenAIProviderOptions,
  AnthropicProviderOptions,
} from '@react-ai-stream/core'
import { writeSseHeaders, pipeChunksToResponse } from './sse-writer.js'

export type { StreamChunk } from '@react-ai-stream/core'

type ProviderOptions = OpenAIProviderOptions | AnthropicProviderOptions

type HandlerOptions = {
  handler: (messages: Message[], signal: AbortSignal) => AsyncIterable<StreamChunk>
}

export type RaisMiddlewareOptions = ProviderOptions | HandlerOptions

interface ChatBody {
  messages?: Message[]
}

/**
 * Express middleware that reads `req.body.messages`, streams a RAIS-compliant
 * SSE response, and handles abort when the client disconnects.
 *
 * Usage with a built-in provider:
 *   app.post('/api/chat', raisMiddleware({ provider: 'openai', apiKey: process.env.OPENAI_API_KEY }))
 *
 * Usage with a custom handler:
 *   app.post('/api/chat', raisMiddleware({ handler: async (messages, signal) => myStream(messages, signal) }))
 */
export function raisMiddleware(options: RaisMiddlewareOptions): RequestHandler {
  return async (req, res, next) => {
    const abortController = new AbortController()
    req.on('close', () => abortController.abort())

    try {
      const { messages = [] } = req.body as ChatBody

      writeSseHeaders(res)

      let chunks: AsyncIterable<StreamChunk>

      if ('handler' in options) {
        chunks = options.handler(messages, abortController.signal)
      } else {
        const client = createAIClient(options)
        chunks = client.provider.stream(messages, abortController.signal)
      }

      await pipeChunksToResponse(chunks, res)
    } catch (err) {
      if (isAbortError(err)) {
        if (!res.writableEnded) res.end()
        return
      }
      const message = err instanceof Error ? err.message : 'Internal error'
      if (!res.headersSent) {
        res.status(500).json({ error: message })
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`)
        if (!res.writableEnded) res.end()
      }
    }
  }
}
