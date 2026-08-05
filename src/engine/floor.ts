import type { Agent, ModeConfig } from '../types'

// ---- Manager (dispatcher) ----

export interface ManagerPlan {
  note: string
  done: boolean
  activate: { agentId: string; instruction: string }[]
}

export function buildManagerPrompt(opts: {
  mode: ModeConfig
  task: string
  round: number
  maxRounds: number
  transcript: string
  boardTitles: string[]
  hasIntel: boolean
  maxActivate: number
}): string {
  const { mode, task, round, maxRounds, transcript, boardTitles, hasIntel, maxActivate } = opts
  const roster = mode.agents
    .map((a) => `- ${a.id}: ${a.name}, ${a.role}${a.tag ? ` [${a.tag}]` : ''} — ${a.blurb}`)
    .join('\n')
  return `You are the team lead running a live working session for the "${mode.name}" org.
Goal (${mode.tagline}). The room is working on this task:
"""${task}"""

Your coworkers:
${roster}

${hasIntel ? 'Live web intel has been shared in the room.\n' : ''}Deliverables produced so far: ${boardTitles.length ? boardTitles.join(', ') : 'none yet'}.

Recent room activity:
${transcript || '(the session just started)'}

This is round ${round} of at most ${maxRounds}. Decide who should work THIS round and what each should do.
Activate 1 to ${maxActivate} coworkers who can make progress in parallel right now. Give each a specific, short instruction that builds on what teammates have already said. Set done=true only when the task is genuinely handled and the key deliverables exist.

Respond with ONLY JSON:
{
  "note": "one short line you say to the room to kick off this round",
  "done": false,
  "activate": [ { "agentId": "<id from the roster>", "instruction": "<specific thing to do now>" } ]
}`
}

export function parseManager(obj: any, mode: ModeConfig, maxActivate: number): ManagerPlan {
  const valid = new Set(mode.agents.map((a) => a.id))
  const activateRaw = Array.isArray(obj?.activate) ? obj.activate : []
  const activate = activateRaw
    .filter((x: any) => x && valid.has(x.agentId))
    .slice(0, maxActivate)
    .map((x: any) => ({ agentId: String(x.agentId), instruction: String(x.instruction ?? 'Make progress on the task.') }))
  return {
    note: typeof obj?.note === 'string' && obj.note.trim() ? obj.note.trim() : 'Let’s keep moving.',
    done: obj?.done === true,
    activate,
  }
}

// ---- Coworker turn ----

export interface AgentTurn {
  say: string
  to: string | null
  deliver: { title: string; body: string } | null
}

export function buildAgentPrompt(opts: {
  mode: ModeConfig
  agent: Agent
  task: string
  instruction: string
  transcript: string
  intel: string
}): string {
  const { mode, agent, task, instruction, transcript, intel } = opts
  const teammates = mode.agents
    .filter((a) => a.id !== agent.id)
    .map((a) => `${a.name} (${a.role}, id:${a.id})`)
    .join(', ')
  return `You are ${agent.name}, the ${agent.role}${agent.tag ? ` on the ${agent.tag} team` : ''} in the "${mode.name}" org.
Your style: ${agent.blurb} You are good at: ${agent.skills.join(', ')}.
You are one coworker among several working the same task IN THE SAME ROOM, in real time. Talk like a real colleague — natural, first person, concise. React to what teammates just said, build on it, and when you hand something to a specific person, address them by name.

Teammates: ${teammates}.

The task the room is working on:
"""${task}"""
${intel ? `\nShared live web intel:\n${intel}\n` : ''}
Recent room chatter:
${transcript || '(you are among the first to speak)'}

The lead just asked you to: ${instruction}

Do that now. Reply with ONLY JSON:
{
  "say": "what you say out loud to the room (1-3 sentences, natural, may @mention a teammate by name)",
  "to": "<teammate id you are handing to / addressing, or null>",
  "deliver": { "title": "short deliverable name", "body": "the actual work, concrete, plain text with • bullets" }
}
Set "deliver" to null if this turn is just discussion/coordination rather than a finished piece of work.`
}

export function parseAgentTurn(obj: any, mode: ModeConfig): AgentTurn {
  const valid = new Set(mode.agents.map((a) => a.id))
  const to = typeof obj?.to === 'string' && valid.has(obj.to) ? obj.to : null
  let deliver: AgentTurn['deliver'] = null
  if (obj?.deliver && typeof obj.deliver === 'object') {
    const title = String(obj.deliver.title ?? '').trim()
    const body = String(obj.deliver.body ?? '').trim()
    if (title && body) deliver = { title, body }
  }
  return {
    say: typeof obj?.say === 'string' && obj.say.trim() ? obj.say.trim() : 'On it.',
    to,
    deliver,
  }
}
