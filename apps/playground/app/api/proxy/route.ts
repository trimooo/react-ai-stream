export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { url, headers: extraHeaders = {}, body } = await req.json()

  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(body),
      // @ts-expect-error - Node.js fetch supports duplex
      duplex: 'half',
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    return new Response(text, { status: upstream.status })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
