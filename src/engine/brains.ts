// The "brain pool" — which model/key each coworker thinks with.
// Reads VITE_BRAINS (e.g. "gemini:3,groq:2") — a non-secret descriptor of how
// many keys exist per provider. The real keys live server-side (/api/llm).

export type Provider = 'gemini' | 'groq'

export interface Brain {
  provider: Provider
  /** key slot within that provider's server-side pool */
  brain: number
  /** groq needs a model; gemini uses its default */
  model?: string
  /** short human label for the UI, e.g. "Groq · llama-3.3-70b" */
  label: string
}

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

function parseCounts(raw: string): Record<Provider, number> {
  const counts: Record<Provider, number> = { gemini: 0, groq: 0 }
  for (const part of raw.split(',')) {
    const [p, n] = part.split(':').map((s) => s.trim())
    if (p === 'gemini' || p === 'groq') counts[p] = Math.max(0, parseInt(n || '0', 10) || 0)
  }
  return counts
}

/** Build the interleaved brain roster so adjacent coworkers sit on different providers/keys. */
export function buildRoster(): Brain[] {
  const raw = (import.meta.env.VITE_BRAINS as string | undefined) ?? 'gemini:1'
  const counts = parseCounts(raw)

  const perProvider: Record<Provider, Brain[]> = { gemini: [], groq: [] }
  for (let i = 0; i < counts.gemini; i++) {
    perProvider.gemini.push({ provider: 'gemini', brain: i, label: 'Gemini · flash' })
  }
  for (let i = 0; i < counts.groq; i++) {
    const model = GROQ_MODELS[i % GROQ_MODELS.length]
    perProvider.groq.push({ provider: 'groq', brain: i, model, label: `Groq · ${model.replace('-versatile', '').replace('-instant', '')}` })
  }

  // interleave providers round-robin
  const roster: Brain[] = []
  const order: Provider[] = ['gemini', 'groq']
  let added = true
  const idx: Record<Provider, number> = { gemini: 0, groq: 0 }
  while (added) {
    added = false
    for (const p of order) {
      if (idx[p] < perProvider[p].length) {
        roster.push(perProvider[p][idx[p]])
        idx[p]++
        added = true
      }
    }
  }
  return roster.length ? roster : [{ provider: 'gemini', brain: 0, label: 'Gemini · flash' }]
}

let cached: Brain[] | null = null
export function roster(): Brain[] {
  if (!cached) cached = buildRoster()
  return cached
}

/** Deterministic brain for the coworker at a given roster index. */
export function brainForIndex(index: number): Brain {
  const r = roster()
  return r[((index % r.length) + r.length) % r.length]
}

/** The manager thinks on the first (usually Gemini) brain. */
export function managerBrain(): Brain {
  const r = roster()
  return r.find((b) => b.provider === 'gemini') ?? r[0]
}
