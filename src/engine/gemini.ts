import type { Source } from '../types'
import type { Engine, StageInput } from './types'
import { simEngine } from './sim'
import { buildRequestBody, coerce, extractJson, GEMINI_MODEL, parseGrounding, queryFor, type PromptOpts } from './geminiShared'
import { searchWeb } from './webSearch'

const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

/** Direct Gemini engine — for local "bring your own key" use (key in the browser). */
export function makeGeminiEngine(apiKey: string): Engine {
  const call = async (input: StageInput, opts: PromptOpts, webSources: Source[]) => {
    const res = await fetch(ENDPOINT(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(input, opts)),
    })
    if (!res.ok) throw new Error(`gemini ${res.status}`)
    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('empty gemini response')
    // prefer real Tavily sources; else whatever Gemini grounded on
    return coerce(extractJson(text), webSources.length ? webSources : parseGrounding(data))
  }
  return {
    name: 'gemini',
    async runStage(input) {
      const wantWeb = !!input.webAccess
      // 1. try a real web search (Tavily via /api/search); soft-fails to nothing
      const web = wantWeb ? await searchWeb(queryFor(input)) : { context: '', sources: [] }
      const opts: PromptOpts = { webAccess: wantWeb, webContext: web.context }
      try {
        return await call(input, opts, web.sources)
      } catch (err) {
        // if we were relying on Gemini's own grounding (no Tavily results), step down to plain live
        if (wantWeb && !web.context) {
          try {
            return await call(input, { webAccess: false }, [])
          } catch {
            /* fall through to offline */
          }
        }
        console.warn('[hive] gemini (direct) failed, using offline engine:', (err as Error).message)
        return simEngine.runStage(input)
      }
    },
  }
}
