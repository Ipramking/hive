import type { Engine } from './types'
import { simEngine } from './sim'
import { buildRequestBody, coerce, extractJson, GEMINI_MODEL, parseGrounding } from './geminiShared'

const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

/** Direct Gemini engine — for local "bring your own key" use (key in the browser). */
export function makeGeminiEngine(apiKey: string): Engine {
  const call = async (input: Parameters<Engine['runStage']>[0], search: boolean) => {
    const res = await fetch(ENDPOINT(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(input, search)),
    })
    if (!res.ok) throw new Error(`gemini ${res.status}`)
    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('empty gemini response')
    return coerce(extractJson(text), parseGrounding(data))
  }
  return {
    name: 'gemini',
    async runStage(input) {
      const search = !!input.webAccess
      try {
        return await call(input, search)
      } catch (err) {
        // grounded search has a stricter quota — step down to plain live Gemini before offline
        if (search) {
          try {
            return await call(input, false)
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
