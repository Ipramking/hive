import type { Agent, ModeConfig } from '../types'

// distinct, legible colours assigned to generated coworkers by index — a
// blue→violet family so any generated team stays on the nebula palette
const PALETTE = ['#6d5bff', '#4aa8ff', '#a78bfa', '#8f82ff', '#5ec8ff', '#b39dff', '#7c9bff', '#9d8bff']
const FALLBACK_EMOJI = ['🧭', '🔬', '🎨', '⚙️', '🛡️', '🚀', '📊', '✍️']
const ACCENTS = ['#6d5bff', '#8b5cf6', '#4aa8ff', '#7c6cff', '#a78bfa']

export function buildTeamPrompt(task: string): string {
  return `A person gave this task to an on-demand organisation of AI coworkers:
"""${task}"""

Assemble the SMALLEST effective team to actually accomplish it — 3 to 5 coworkers.
Pick roles that genuinely fit THIS task (they might be engineers, designers, researchers,
marketers, analysts, lawyers, scientists, writers — whatever the work needs). If the task is
buildable, include at least one who will scaffold real code/files.

Reply with ONLY JSON:
{
  "team": "a short name for this team (2-3 words)",
  "emoji": "one emoji representing the team",
  "agents": [
    {
      "id": "short_snake_id",
      "name": "human first name",
      "role": "their role",
      "tag": "one-word department, e.g. Engineering",
      "emoji": "one emoji",
      "blurb": "one sentence on what they do here",
      "skills": ["3", "short", "skills"]
    }
  ]
}`
}

/** Turn the model's team JSON into a runnable, ephemeral ModeConfig. */
export function parseTeam(obj: any, task: string): ModeConfig | null {
  const rawAgents = Array.isArray(obj?.agents) ? obj.agents : []
  if (!rawAgents.length) return null
  const seen = new Set<string>()
  const agents: Agent[] = []
  rawAgents.slice(0, 6).forEach((a: any, i: number) => {
    let id = String(a?.id ?? `m${i}`).toLowerCase().replace(/[^a-z0-9_]/g, '') || `m${i}`
    while (seen.has(id)) id += i
    seen.add(id)
    agents.push({
      id,
      name: String(a?.name ?? `Coworker ${i + 1}`).trim().slice(0, 24) || `Coworker ${i + 1}`,
      role: String(a?.role ?? 'Specialist').trim().slice(0, 40) || 'Specialist',
      emoji: typeof a?.emoji === 'string' && a.emoji.trim() ? a.emoji.trim() : FALLBACK_EMOJI[i % FALLBACK_EMOJI.length],
      color: PALETTE[i % PALETTE.length],
      blurb: String(a?.blurb ?? 'Works this task with the room.').trim().slice(0, 140),
      skills: Array.isArray(a?.skills) ? a.skills.map(String).slice(0, 4) : [],
      tag: typeof a?.tag === 'string' && a.tag.trim() ? a.tag.trim().slice(0, 16) : undefined,
    })
  })
  if (!agents.length) return null

  const team = String(obj?.team ?? 'Auto Team').trim().slice(0, 40) || 'Auto Team'
  const emoji = typeof obj?.emoji === 'string' && obj.emoji.trim() ? obj.emoji.trim() : '✨'
  const accent = ACCENTS[Math.abs(hash(task)) % ACCENTS.length]

  return {
    id: `auto-${Date.now()}`,
    name: team,
    emoji,
    accent,
    tagline: 'A team assembled on the spot for this task.',
    agents,
    stages: [],
  }
}

/** Deterministic fallback team when the model is unavailable — never blocks a run. */
export function fallbackTeam(task: string): ModeConfig {
  const mk = (id: string, name: string, role: string, tag: string, emoji: string, i: number, blurb: string, skills: string[]): Agent => ({
    id, name, role, tag, emoji, color: PALETTE[i % PALETTE.length], blurb, skills,
  })
  return {
    id: `auto-${Date.now()}`,
    name: 'Auto Team',
    emoji: '✨',
    accent: ACCENTS[Math.abs(hash(task)) % ACCENTS.length],
    tagline: 'A team assembled on the spot for this task.',
    agents: [
      mk('lead', 'Ada', 'Lead & Planner', 'Product', '🧭', 0, 'Frames the work and keeps it pointed at the outcome.', ['Scoping', 'Planning']),
      mk('research', 'Noor', 'Researcher', 'Research', '🔬', 1, 'Digs up the facts and constraints.', ['Research', 'Synthesis']),
      mk('builder', 'Rex', 'Builder', 'Engineering', '⚙️', 3, 'Scaffolds the real files and code.', ['Code', 'Architecture']),
      mk('reviewer', 'Vee', 'Reviewer', 'Quality', '🛡️', 4, 'Pressure-tests it and lists what is left.', ['Review', 'Edge cases']),
    ],
    stages: [],
  }
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
