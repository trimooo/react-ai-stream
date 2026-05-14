import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Replace this URL with your own RAIS-compliant streaming server.
// Your server must emit SSE events in this format:
//   data: {"type":"text","text":"..."}
//   data: {"type":"done"}
//   data: {"type":"error","error":"..."}
//
// See the RAIS Protocol spec: https://react-ai-stream-docs.vercel.app/spec
const UPSTREAM_URL = 'https://your-server.example.com/api/chat'

interface Message { role: string; content: string }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { messages: Message[] }

    const upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: req.signal,
    })
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => upstream.statusText)
      throw new Error(`Upstream ${upstream.status}: ${text}`)
    }

    // Stream the RAIS-compliant SSE response straight through to the client.
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
