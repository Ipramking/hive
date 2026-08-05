/// <reference types="node" />
// Vercel serverless function — the "brain pool".
// Routes a prompt to Gemini or Groq, picking a key from that provider's pool.
// Every key stays server-side; the browser only says which provider + brain slot.
//
// Env: GEMINI_API_KEY[, GEMINI_API_KEY_2 ...]  GROQ_API_KEY[, GROQ_API_KEY_2 ...]

const GEMINI_MODEL = 'gemini-flash-latest'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function pool(prefix: string): string[] {
  const keys: string[] = []
  const base = process.env[prefix]
  if (base) keys.push(base)
  for (let i = 2; i <= 8; i++) {
    const k = process.env[`${prefix}_${i}`]
    if (k) keys.push(k)
  }
  return keys
}

async function callGemini(key: string, prompt: string, json: boolean): Promise<string> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.95, ...(json ? { responseMimeType: 'application/json' } : {}) },
      }),
    },
  )
  if (!r.ok) throw new Error(`gemini ${r.status}`)
  const data = await r.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callGroq(key: string, prompt: string, json: boolean, model: string): Promise<string> {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.95,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!r.ok) throw new Error(`groq ${r.status}`)
  const data = await r.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const prompt: string | undefined = body?.prompt
    const provider: string = body?.provider === 'groq' ? 'groq' : 'gemini'
    const brain: number = Number.isFinite(body?.brain) ? Number(body.brain) : 0
    const json: boolean = body?.json !== false // default JSON output
    const model: string = body?.model || GROQ_MODEL
    if (!prompt) {
      res.status(400).json({ error: 'missing prompt' })
      return
    }

    const keys = provider === 'groq' ? pool('GROQ_API_KEY') : pool('GEMINI_API_KEY')
    if (!keys.length) {
      // provider not configured — tell the client so it can fall back
      res.status(200).json({ text: '', unavailable: true, provider })
      return
    }
    const key = keys[((brain % keys.length) + keys.length) % keys.length]

    const text =
      provider === 'groq'
        ? await callGroq(key, prompt, json, model)
        : await callGemini(key, prompt, json)

    res.status(200).json({ text, provider })
  } catch (e: any) {
    res.status(200).json({ text: '', error: e?.message ?? 'llm error' })
  }
}
