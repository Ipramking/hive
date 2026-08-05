import type { Brain } from './brains'

/**
 * Call one brain in the server-side pool via /api/llm.
 * Returns the raw text, or '' on any failure (callers degrade gracefully).
 */
export async function callLLM(brain: Brain, prompt: string, json = true): Promise<string> {
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: brain.provider,
        brain: brain.brain,
        model: brain.model,
        prompt,
        json,
      }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    return typeof data?.text === 'string' ? data.text : ''
  } catch {
    return ''
  }
}

/** Pull the first {...} JSON object out of a model response (handles ```json fences and prose). */
export function looseJson<T = any>(text: string): T | null {
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T
  } catch {
    return null
  }
}
