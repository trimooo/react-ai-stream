import 'dotenv/config'
import express from 'express'
import { raisMiddleware } from '@react-ai-stream/express'
import type { Message, StreamChunk } from '@react-ai-stream/express'

const app = express()
app.use(express.json())

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})
app.options('*' as string, (_, res) => { res.sendStatus(200) })

// Replace this with your own AI model integration
async function* myHandler(messages: Message[], signal: AbortSignal): AsyncIterable<StreamChunk> {
  const last = messages.at(-1)?.content ?? 'Hello!'

  // Stream back words one at a time as a demo
  for (const word of `You said: "${last}" — wire your real model here!`.split(' ')) {
    if (signal.aborted) return
    yield { type: 'text', text: word + ' ' }
    await new Promise<void>(r => setTimeout(r, 60))
  }
  yield { type: 'done' }
}

app.post('/api/chat', raisMiddleware({ handler: myHandler }))

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`RAIS server → http://localhost:${PORT}`)
  console.log('POST /api/chat  — connect any RAIS frontend here')
})
