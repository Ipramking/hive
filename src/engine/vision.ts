// Ask the server-side Gemini vision endpoint to read an uploaded image.
// Takes a data URL (data:<mime>;base64,<data>) + the user's comment, returns
// a prose analysis. Soft-fails to '' so a run can still proceed without it.

export async function scanImage(dataUrl: string, comment: string): Promise<string> {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl)
  if (!m) return ''
  const [, mimeType, data] = m
  try {
    const res = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: { data, mimeType }, prompt: comment }),
    })
    if (!res.ok) return ''
    const j = await res.json()
    return typeof j?.text === 'string' ? j.text.trim() : ''
  } catch {
    return ''
  }
}
