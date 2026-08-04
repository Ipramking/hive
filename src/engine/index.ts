import type { Engine } from './types'
import type { EngineName } from '../types'
import { simEngine } from './sim'
import { makeGeminiEngine } from './gemini'
import { makeProxyEngine } from './proxy'

/** True when a server-side key proxy is available (set VITE_PROXY=1 at build/deploy). */
export const proxyEnabled = import.meta.env.VITE_PROXY === '1'

/**
 * Engine resolution, most-specific first:
 *   1. user's own key in the browser  → direct Gemini
 *   2. server proxy available          → proxy Gemini (key stays server-side)
 *   3. otherwise                       → deterministic offline engine
 */
export function getEngine(apiKey: string): Engine {
  if (apiKey.trim()) return makeGeminiEngine(apiKey.trim())
  if (proxyEnabled) return makeProxyEngine()
  return simEngine
}

/** What to show in the UI badge, without constructing an engine. */
export function resolveEngineName(apiKey: string): EngineName {
  return apiKey.trim() || proxyEnabled ? 'gemini' : 'offline'
}

export type { Engine } from './types'
