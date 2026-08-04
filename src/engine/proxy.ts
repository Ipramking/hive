import type { Engine } from './types'
import { simEngine } from './sim'
import { buildPrompt, coerce, extractJson, type ProxyRequest, type ProxyResponse } from './geminiShared'

/**
 * Proxy engine — for the deployed app. The key lives on the server;
 * the browser never sees it. Calls the /api/gemini serverless function.
 */
export function makeProxyEngine(): Engine {
  const call = async (input: Parameters<Engine['runStage']>[0], search: boolean) => {
    const body: ProxyRequest = { prompt: buildPrompt(input, search), search }
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`proxy ${res.status}`)
    const data = (await res.json()) as ProxyResponse
    if (!data?.text) throw new Error('empty proxy response')
    return coerce(extractJson(data.text), data.sources ?? [])
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
        console.warn('[hive] gemini (proxy) failed, using offline engine:', (err as Error).message)
        return simEngine.runStage(input)
      }
    },
  }
}
