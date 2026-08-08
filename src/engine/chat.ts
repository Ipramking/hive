import type { Agent, ModeConfig } from '../types'

// ---- Intent: is the person trying to WORK, or just to TALK? ----

export function buildIntentPrompt(text: string): string {
  return `Someone just typed this into a room full of AI coworkers:
"""${text}"""

Decide what they want:
- "work"  = they want the team to build, code, design, research, plan, write, fix, or otherwise PRODUCE something. A real task with a deliverable.
- "chat"  = a greeting, small talk, banter, gossip, thanks, a casual question, checking in, or just talking to the room. No deliverable expected.

If it is short and social (like "hi", "how's it going", "you guys good?"), it is "chat". Only pick "work" when they clearly want something made or figured out.

Reply with ONLY JSON: { "intent": "work" | "chat" }`
}

const GREETING = /^(hi+|hey+|hello+|yo+|sup|wass?up|howdy|gm|good (morning|afternoon|evening)|hola|thanks?|thank you|ty|lol|haha|ok(ay)?|cool|nice|👋|how('?s| is| are)\b.*|you (guys|all|ok|good)\b.*|what'?s up)$/i

/** Fallback heuristic for when the classifier is unavailable. */
export function looksSocial(text: string): boolean {
  const t = text.trim()
  if (t.length <= 3) return true
  if (GREETING.test(t)) return true
  // short and no "build/make/write/create…" verbs → lean social
  const work = /\b(build|make|create|code|write|design|research|plan|scaffold|generate|fix|implement|add|refactor|analyz|draft|set ?up|develop)\b/i
  return t.split(/\s+/).length <= 6 && !work.test(t)
}

export function parseIntent(obj: any, text: string): 'work' | 'chat' {
  const raw = typeof obj?.intent === 'string' ? obj.intent.toLowerCase() : ''
  if (raw === 'chat') return 'chat'
  if (raw === 'work') return 'work'
  return looksSocial(text) ? 'chat' : 'work'
}

// ---- Casual conversation: each coworker decides, in character, whether to engage ----

export interface ChatTurn {
  respond: boolean
  say: string
  to: string | null
}

export function buildChatDecisionPrompt(opts: {
  agent: Agent
  mode: ModeConfig
  userMsg: string
  transcript: string
  round: number
  culture?: string
  force?: boolean
}): string {
  const { agent, mode, userMsg, transcript, round, culture, force } = opts
  const teammates = mode.agents
    .filter((a) => a.id !== agent.id)
    .map((a) => `${a.name} (${a.role}, id:${a.id})`)
    .join(', ')
  return `You are ${agent.name}, the ${agent.role}${agent.tag ? ` [${agent.tag}]` : ''} in the "${mode.name}" office.
Your personality: ${agent.blurb}
${culture ? `Office vibe: ${culture}\n` : ''}Coworkers around you: ${teammates || '(just you around)'}.

This is NOT a work task — it's casual. Someone in the room said:
"""${userMsg}"""

Recent room chatter:
${transcript || '(quiet so far)'}

Like a real person in an office, decide whether YOU feel like chiming in right now.
It's completely fine to stay out of it — maybe you're heads-down, or someone else has it, or it's just not your kind of conversation. Not everyone responds to everything.
${round > 1 ? 'You already heard the room react — only speak again if you genuinely have something to add, tease, or gossip about.' : ''}
${force ? 'The room has gone quiet and it would be rude to leave them hanging — say something warm and natural back.' : ''}
If you DO respond: be a real colleague — natural, brief (1-2 sentences), first person. Greet back, banter, gossip, react, or answer. Do NOT offer to build or do work unless they actually asked for it. React to teammates by name if it fits.

Reply with ONLY JSON:
{
  "respond": true | false,
  "say": "your natural line if responding, otherwise empty string",
  "to": "<teammate id you're reacting to, or null>"
}`
}

export function parseChatTurn(obj: any, mode: ModeConfig): ChatTurn {
  const valid = new Set(mode.agents.map((a) => a.id))
  const say = typeof obj?.say === 'string' ? obj.say.trim() : ''
  const respond = obj?.respond === true && !!say
  const to = typeof obj?.to === 'string' && valid.has(obj.to) ? obj.to : null
  return { respond, say, to }
}

// ---- A small "who's in the office" crew for casual chat when no team exists yet ----

export function casualCrewMode(): ModeConfig {
  const agents: Agent[] = [
    { id: 'c-mara', name: 'Mara', role: 'Product lead', emoji: '', color: '#4fd2ff', tag: 'Product', blurb: 'Warm and chatty, always up for a quick catch-up and the first to say hi.', skills: ['people', 'planning'] },
    { id: 'c-deji', name: 'Deji', role: 'Engineer', emoji: '', color: '#a78bfa', tag: 'Engineering', blurb: 'Dry, deadpan humour; usually heads-down but drops a good one-liner when it lands.', skills: ['systems', 'debugging'] },
    { id: 'c-sol', name: 'Sol', role: 'Designer', emoji: '', color: '#f5b74f', tag: 'Design', blurb: 'Curious and a little gossipy, loves the vibe of the room and small talk.', skills: ['ui', 'story'] },
    { id: 'c-rin', name: 'Rin', role: 'Ops', emoji: '', color: '#4ade80', tag: 'Ops', blurb: 'Quiet and focused, only chimes in when there is something real to add.', skills: ['reliability', 'process'] },
  ]
  return { id: 'auto', name: 'The Hive', emoji: '', accent: '#4fd2ff', tagline: 'the room', agents, stages: [] }
}
