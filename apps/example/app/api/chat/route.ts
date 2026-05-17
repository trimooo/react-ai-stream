export const runtime = 'nodejs'

const RAIS_GATEWAY = 'https://react-ai-stream-gateway.vercel.app'

// Server-side proxy — RAIS_API_KEY never reaches the browser.
// Body passes through as-is (messages + provider) to the RAIS gateway.
export async function POST(req: Request) {
  const raisKey = (process.env.RAIS_API_KEY ?? '').trim()

  if (!raisKey) {
    return Response.json(
      { error: 'RAIS_API_KEY not set. Add it to .env.local — get a free key at react-ai-stream-playground.vercel.app/cloud' },
      { status: 503 },
    )
  }

  const upstream = await fetch(`${RAIS_GATEWAY}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${raisKey}`,
    },
    body: await req.text(),
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
