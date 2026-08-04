import type { Source } from '../types'
import type { Engine, StageInput } from './types'
import { simEngine } from './sim'
import { buildPrompt, coerce, extractJson, queryFor, type ProxyRequest, type ProxyResponse, type PromptOpts } from './geminiShared'
import { searchWeb } from './webSearch'

/**
 * Proxy engine — for the deployed app. The key lives on the server;
 * the browser never sees it. Calls the /api/gemini serverless function.
 */
export function makeProxyEngine(): Engine {
  const call = async (input: StageInput, opts: PromptOpts, grounding: boolean, webSources: Source[]) => {
    const body: ProxyRequest = { prompt: buildPrompt(input, opts), search: grounding }
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`proxy ${res.status}`)
    const data = (await res.json()) as ProxyResponse
    if (!data?.text) throw new Error('empty proxy response')
    return coerce(extractJson(data.text), webSources.length ? webSources : data.sources ?? [])
  }
  return {
    name: 'gemini',
    async runStage(input) {
      const wantWeb = !!input.webAccess
      // 1. try a real web search (Tavily via /api/search); soft-fails to nothing
      const web = wantWeb ? await searchWeb(queryFor(input)) : { context: '', sources: [] }
      const grounding = wantWeb && !web.context // only ask Gemini to ground if Tavily gave us nothing
      const opts: PromptOpts = { webAccess: wantWeb, webContext: web.context }
      try {
        return await call(input, opts, grounding, web.sources)
      } catch (err) {
        // if we were relying on Gemini's own grounding, step down to plain live
        if (grounding) {
          try {
            return await call(input, { webAccess: false }, false, [])
          } catch {
            /* fall through to offline */
          }
        }
        console.warn('[hive] gemini (proxy) failed, using offline engine:', (err as Error).message)
        return simEngine.runStage(input)
      }
    },
  }
}
