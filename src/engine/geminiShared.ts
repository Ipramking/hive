import type { Source } from '../types'
import type { StageInput, StageResult } from './types'

export const GEMINI_MODEL = 'gemini-flash-latest'

/** Build the per-stage prompt sent to the model. Shared by direct + proxy engines. */
export function buildPrompt(
  { task, mode, stage, agent, priorArtifacts }: StageInput,
  webAccess = false,
): string {
  const prior = priorArtifacts.length
    ? priorArtifacts.map((a) => `### ${a.title}\n${a.body}`).join('\n\n')
    : '(none yet — you are the first step)'
  const web = webAccess
    ? `\nYou have LIVE WEB ACCESS. Use Google Search to ground your work in current, real facts — recent figures, real companies, real dates, today's context. Never invent statistics; if you cite a number, it should come from a real source.\n`
    : ''
  return `You are ${agent.name}, the ${agent.role} in an organisation of AI coworkers.
The org is running in "${mode.name}" mode: ${mode.tagline}
Your teammates: ${mode.agents.map((a) => `${a.name} (${a.role})`).join(', ')}.
${web}
The human gave the org this task:
"""${task}"""

Your step is "${stage.title}". Goal: ${stage.goal}
You must deliver: ${stage.produces}.

Work already done by earlier teammates:
${prior}

Respond with ONLY a JSON object (you may wrap it in a \`\`\`json fence), in exactly this shape:
{
  "thinking": ["3 to 4 very short first-person lines describing what you're doing"],
  "artifact": "the ${stage.produces}, concise and concrete, plain text with '•' bullets and short lines — no markdown headers",
  "handoff": "one short line handing off to the next teammate"
}
Stay in character as ${agent.name}. Be specific to the actual task, not generic.`
}

/**
 * Build the Gemini generateContent request body.
 * With web access we enable Google Search grounding — which is incompatible with
 * forced JSON output, so we drop responseMimeType and parse the JSON out of the prose.
 */
export function buildRequestBody(input: StageInput, webAccess: boolean) {
  return {
    contents: [{ role: 'user', parts: [{ text: buildPrompt(input, webAccess) }] }],
    generationConfig: webAccess
      ? { temperature: 0.9 }
      : { temperature: 0.9, responseMimeType: 'application/json' },
    ...(webAccess ? { tools: [{ google_search: {} }] } : {}),
  }
}

/** Pull grounding sources out of a Gemini response's groundingMetadata. */
export function parseGrounding(data: unknown): Source[] {
  const meta = (data as any)?.candidates?.[0]?.groundingMetadata
  const chunks = meta?.groundingChunks
  if (!Array.isArray(chunks)) return []
  const seen = new Set<string>()
  const out: Source[] = []
  for (const c of chunks) {
    const uri: string | undefined = c?.web?.uri
    if (!uri || seen.has(uri)) continue
    seen.add(uri)
    out.push({ title: c?.web?.title || uri, uri })
  }
  return out.slice(0, 8)
}

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('no json object in response')
  return JSON.parse(raw.slice(start, end + 1))
}

export function coerce(obj: unknown, sources: Source[] = []): StageResult {
  const o = obj as Record<string, unknown>
  const thinking = Array.isArray(o.thinking)
    ? (o.thinking as unknown[]).map(String).filter(Boolean).slice(0, 5)
    : []
  const artifactBody = typeof o.artifact === 'string' ? o.artifact.trim() : String(o.artifact ?? '')
  const handoff = typeof o.handoff === 'string' ? o.handoff.trim() : 'Handing off.'
  if (!artifactBody) throw new Error('empty artifact')
  return {
    thinking: thinking.length ? thinking : ['Working on it…'],
    artifactBody,
    handoff,
    ...(sources.length ? { sources } : {}),
  }
}

/** Shape of the request body sent to the /api/gemini proxy. */
export interface ProxyRequest {
  prompt: string
  /** enable Google Search grounding server-side */
  search?: boolean
}
export interface ProxyResponse {
  text: string
  sources?: Source[]
}
