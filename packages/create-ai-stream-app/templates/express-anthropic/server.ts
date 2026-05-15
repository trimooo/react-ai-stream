import 'dotenv/config'
import express from 'express'
import { raisMiddleware } from '@react-ai-stream/express'

const app = express()
app.use(express.json())

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})
app.options('*' as string, (_, res) => { res.sendStatus(200) })

app.post('/api/chat', raisMiddleware({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  model: 'claude-haiku-4-5-20251001',
}))

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`RAIS server → http://localhost:${PORT}`)
  console.log('POST /api/chat  — connect any RAIS frontend here')
})
