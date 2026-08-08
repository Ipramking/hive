/// <reference types="node" />
// Vercel serverless function — image understanding via Gemini vision.
// The browser POSTs { image: { data (base64, no prefix), mimeType }, prompt }.
// Returns { text } — a rich analysis of the picture. The key stays server-side.

const MODEL = 'gemini-flash-latest'

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  const keys = pool('GEMINI_API_KEY')
  if (!keys.length) {
    res.status(200).json({ text: '', unavailable: true })
    return
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const image = body?.image
    const comment: string = (body?.prompt || '').toString().slice(0, 4000)
    if (!image?.data || !image?.mimeType) {
      res.status(400).json({ error: 'missing image' })
      return
    }

    const instruction =
      `You are the Hive's vision analyst. Study the attached image closely and produce a detailed, factual brief for the team.\n` +
      `Cover: what the image shows; any text, numbers, labels, charts, code, UI or data visible (transcribe it); notable objects, people, places or brands; and anything that would matter for research or building on it.\n` +
      (comment
        ? `The user also said: "${comment}". Address that directly and tie your analysis to it.\n`
        : '') +
      `Write clear prose (no JSON). Be specific — this brief is the only thing the rest of the team will see; they cannot view the image themselves.`

    // walk the key pool until one answers
    let text = ''
    for (const key of keys) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { inline_data: { mime_type: image.mimeType, data: image.data } },
                    { text: instruction },
                  ],
                },
              ],
              generationConfig: { temperature: 0.6 },
            }),
          },
        )
        if (!r.ok) continue
        const data = await r.json()
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (text.trim()) break
      } catch {
        /* try the next key */
      }
    }

    res.status(200).json({ text })
  } catch (e: any) {
    res.status(200).json({ text: '', error: e?.message ?? 'vision error' })
  }
}
