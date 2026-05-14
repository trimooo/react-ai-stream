import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import type { ServerConfig, ChatMessage, StreamToken } from './types.js'
import { streamOpenAI } from './providers/openai.js'
import { streamAnthropic } from './providers/anthropic.js'

function setRaisHeaders(res: ServerResponse, cors: boolean) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (cors) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  }
}

function sendEvent(res: ServerResponse, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

export function createRaisServer(config: ServerConfig) {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // CORS preflight
    if (config.cors) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

    // Only POST /api/chat
    if (req.method !== 'POST' || req.url !== '/api/chat') {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found. POST /api/chat to start a RAIS stream.' }))
      return
    }

    // Parse body
    let messages: ChatMessage[] = []
    try {
      const body = await readBody(req)
      const parsed = JSON.parse(body)
      messages = parsed.messages ?? []
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON body. Expected: {"messages":[...]}' }))
      return
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'messages must be a non-empty array' }))
      return
    }

    // Start RAIS stream
    setRaisHeaders(res, config.cors)
    res.writeHead(200)

    const abortController = new AbortController()
    req.on('close', () => abortController.abort())

    try {
      let generator: AsyncGenerator<StreamToken>

      if (config.provider === 'anthropic') {
        generator = streamAnthropic(messages, config, abortController.signal)
      } else {
        // openai + groq (openai-compatible)
        generator = streamOpenAI(messages, config, abortController.signal)
      }

      for await (const token of generator) {
        if (abortController.signal.aborted) break
        sendEvent(res, token)
        if (token.type === 'done' || token.type === 'error') break
      }
    } catch (err) {
      const e = err as Error
      if (!abortController.signal.aborted) {
        sendEvent(res, { type: 'error', error: e.message })
      }
    } finally {
      res.end()
    }
  })

  return server
}
