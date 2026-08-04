import type { Source } from '../types'

interface TavilyResult {
  title: string
  url: string
  content: string
}
interface SearchResponse {
  results?: TavilyResult[]
  answer?: string
}

export interface WebSearch {
  /** formatted block to inject into the prompt, or '' if nothing found */
  context: string
  /** sources to cite on the deliverable */
  sources: Source[]
}

const EMPTY: WebSearch = { context: '', sources: [] }

/**
 * Live web search via the /api/search (Tavily) serverless function.
 * Soft-fails to empty so callers degrade gracefully (→ Gemini grounding → offline).
 */
export async function searchWeb(query: string): Promise<WebSearch> {
  const q = query.trim()
  if (!q) return EMPTY
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    })
    if (!res.ok) return EMPTY
    const data = (await res.json()) as SearchResponse
    const results = data.results ?? []
    if (!results.length) return EMPTY

    const sources: Source[] = results
      .filter((r) => r.url)
      .map((r) => ({ title: r.title || r.url, uri: r.url }))

    const lines = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\n(${r.url})`)
      .join('\n\n')
    const answer = data.answer ? `Summary: ${data.answer}\n\n` : ''
    const context = `${answer}${lines}`

    return { context, sources }
  } catch {
    return EMPTY
  }
}
