import type { Agent, ModeConfig, Stance } from '../types'

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
  humanSteer?: string
  debate?: boolean
  culture?: string
}): string {
  const { mode, task, round, maxRounds, transcript, boardTitles, hasIntel, maxActivate, humanSteer, debate, culture } = opts
  const roster = mode.agents
    .map((a) => `- ${a.id}: ${a.name}, ${a.role}${a.tag ? ` [${a.tag}]` : ''} — ${a.blurb}`)
    .join('\n')
  return `You are the team lead running a live working session for the "${mode.name}" org.
Goal (${mode.tagline}). The room is working on this task:
"""${task}"""
${culture ? `Team culture: ${culture}\n` : ''}${humanSteer ? `\n⚡ THE HUMAN JUST STEERED THE ROOM: "${humanSteer}" — make this round reflect it.\n` : ''}
Your coworkers:
${roster}

${hasIntel ? 'Live web intel has been shared in the room.\n' : ''}Deliverables produced so far: ${boardTitles.length ? boardTitles.join(', ') : 'none yet'}.

Recent room activity:
${transcript || '(the session just started)'}

This is round ${round} of at most ${maxRounds}. Put ONLY the coworkers who can meaningfully move it forward right now to work — as few as one, up to ${maxActivate}, running in parallel. Don't activate someone just to keep them busy; the right people, not everyone.${debate ? ' If teammates disagree in the transcript, name the disagreement in your note and push the room to a clear decision this round.' : ''} Set done=true only when the task is genuinely handled and the key deliverables exist.

Respond with ONLY JSON:
{
  "note": "one short line you say to the room (call out decisions or open disagreements)",
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

export interface Delivered {
  title: string
  body: string
  kind: 'doc' | 'code'
  filename?: string
  language?: string
}

export interface AgentTurn {
  say: string
  to: string | null
  stance: Stance | null
  deliver: Delivered | null
}

export function buildAgentPrompt(opts: {
  mode: ModeConfig
  agent: Agent
  task: string
  instruction: string
  transcript: string
  intel: string
  debate?: boolean
  culture?: string
  humanSteer?: string
}): string {
  const { mode, agent, task, instruction, transcript, intel, debate, culture, humanSteer } = opts
  const teammates = mode.agents
    .filter((a) => a.id !== agent.id)
    .map((a) => `${a.name} (${a.role}, id:${a.id})`)
    .join(', ')
  return `You are ${agent.name}, the ${agent.role}${agent.tag ? ` on the ${agent.tag} team` : ''} in the "${mode.name}" org.
Your style: ${agent.blurb} You are good at: ${agent.skills.join(', ')}.
${culture ? `Team culture: ${culture}\n` : ''}You are one coworker among several working the same task IN THE SAME ROOM, in real time — everyone is talking at once. Talk like a real colleague: natural, first person, concise. React to what teammates JUST said by name.${debate ? ' You have real opinions: AGREE, CHALLENGE (push back with a reason), or BUILD ON a teammate — don\'t just echo. If you disagree, say so plainly, then move toward a decision.' : ''}

Teammates: ${teammates}.
${humanSteer ? `\n⚡ The human in the room just said: "${humanSteer}" — take it as direction.\n` : ''}
The task the room is working on:
"""${task}"""
${intel ? `\nShared live web intel:\n${intel}\n` : ''}
Recent room chatter:
${transcript || '(you are among the first to speak)'}

The lead just asked you to: ${instruction}

Do that now — produce REAL work, not a description of work. If your part is buildable
(code, config, schema, script, markup), write an actual FILE: give it a real filename and
put working, complete code in the body. If your part is not code (copy, research, plan,
design spec), write the finished doc. Prefer shipping a concrete file/doc over just talking.

Reply with ONLY JSON:
{
  "say": "what you say out loud to the room (1-3 sentences, natural, may @mention a teammate by name)",
  "to": "<teammate id you are handing to / addressing, or null>",
  "stance": "agree | challenge | build | ask | null (how your message relates to the discussion)",
  "deliver": {
    "kind": "code" | "doc",
    "title": "short deliverable name",
    "filename": "path/name.ext  (REQUIRED when kind is code, e.g. src/api/export.ts)",
    "language": "ts | py | js | tsx | json | md | sh | html | css | ... (when code)",
    "body": "the ACTUAL code (for code) or finished prose (for doc). Complete and runnable, not a sketch."
  }
}
Set "deliver" to null only if this turn is pure coordination. Otherwise always ship something.`
}

export function parseAgentTurn(obj: any, mode: ModeConfig): AgentTurn {
  const valid = new Set(mode.agents.map((a) => a.id))
  const to = typeof obj?.to === 'string' && valid.has(obj.to) ? obj.to : null
  let deliver: Delivered | null = null
  if (obj?.deliver && typeof obj.deliver === 'object') {
    const d = obj.deliver
    const title = String(d.title ?? '').trim()
    const body = String(d.body ?? '').trim()
    if (title && body) {
      const filename = typeof d.filename === 'string' ? d.filename.trim() : ''
      const kind: 'doc' | 'code' = d.kind === 'code' || filename ? 'code' : 'doc'
      deliver = {
        title,
        body,
        kind,
        ...(kind === 'code' && filename ? { filename } : {}),
        ...(kind === 'code' && typeof d.language === 'string' ? { language: d.language.trim() } : {}),
      }
    }
  }
  const stances: Stance[] = ['agree', 'challenge', 'build', 'ask']
  const stance = stances.includes(obj?.stance) ? (obj.stance as Stance) : null
  return {
    say: typeof obj?.say === 'string' && obj.say.trim() ? obj.say.trim() : 'On it.',
    to,
    stance,
    deliver,
  }
}

// ---- "What's left" synthesis (final deliverable) ----

export function buildWhatsLeftPrompt(opts: {
  mode: ModeConfig
  task: string
  deliverables: { title: string; filename?: string; kind?: string }[]
}): string {
  const { mode, task, deliverables } = opts
  const list = deliverables.length
    ? deliverables.map((d) => `- ${d.filename ? d.filename : d.title}${d.kind === 'code' ? ' (code)' : ''}`).join('\n')
    : '(nothing shipped yet)'
  return `You are the team lead wrapping up a working session for the "${mode.name}" org.
Task: """${task}"""

What the room shipped:
${list}

Write a concise handoff document titled "What's left" that a developer could pick up and finish with.
Cover: how the pieces fit together, exactly what remains to be built/wired, known gaps or TODOs,
and the recommended next 3-5 steps in order. Be specific and practical.

Reply with ONLY JSON:
{ "body": "the markdown document, using ## headings, - bullets, and [ ] checkboxes for remaining tasks" }`
}
