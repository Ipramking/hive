// Vercel serverless function — keeps the Gemini key server-side.
// The browser POSTs { prompt } here; the key never reaches the client.
// Set GEMINI_API_KEY (server env) and build the client with VITE_PROXY=1.

const MODEL = 'gemini-flash-latest'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured on the server' })
    return
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const prompt: string | undefined = body?.prompt
    const search: boolean = !!body?.search
    if (!prompt) {
      res.status(400).json({ error: 'missing prompt' })
      return
    }
    // Google Search grounding is incompatible with forced JSON output, so when
    // search is on we drop responseMimeType and let the client parse JSON from prose.
    const reqBody: any = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: search
        ? { temperature: 0.9 }
        : { temperature: 0.9, responseMimeType: 'application/json' },
    }
    if (search) reqBody.tools = [{ google_search: {} }]

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      },
    )
    if (!r.ok) {
      res.status(502).json({ error: `gemini upstream ${r.status}` })
      return
    }
    const data = await r.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // extract grounding sources (mirrors parseGrounding in geminiShared.ts)
    const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks
    const sources: { title: string; uri: string }[] = []
    if (Array.isArray(chunks)) {
      const seen = new Set<string>()
      for (const c of chunks) {
        const uri = c?.web?.uri
        if (!uri || seen.has(uri)) continue
        seen.add(uri)
        sources.push({ title: c?.web?.title || uri, uri })
        if (sources.length >= 8) break
      }
    }
    res.status(200).json({ text, sources })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'proxy error' })
  }
}
