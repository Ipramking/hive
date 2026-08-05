export type AgentStatus = 'idle' | 'thinking' | 'working' | 'done'

export interface Agent {
  id: string
  name: string
  role: string
  emoji: string
  color: string
  blurb: string
  skills: string[]
  /** org/department tag shown on the profile, e.g. "Engineering" */
  tag?: string
}

/** A single step in a workflow, owned by one agent. */
export interface Stage {
  id: string
  title: string
  /** agent id responsible for this stage */
  ownerId: string
  /** what happens here */
  goal: string
  /** the artifact this stage produces */
  produces: string
}

/** A mode is a full org configuration: a roster + a workflow + a theme. */
export interface ModeConfig {
  id: string
  name: string
  emoji: string
  /** hex accent colour that themes the whole app in this mode */
  accent: string
  tagline: string
  /** built-in presets can't be deleted */
  builtIn?: boolean
  agents: Agent[]
  stages: Stage[]
}

export type MessageKind = 'system' | 'agent' | 'handoff' | 'artifact' | 'manager' | 'user'

/** how a coworker's message relates to the room's discussion */
export type Stance = 'agree' | 'challenge' | 'build' | 'ask'

export interface FeedMessage {
  id: string
  kind: MessageKind
  agentId?: string
  stageId?: string
  text: string
  ts: number
  /** agent id this message is directed at — used to render "passing to" cross-talk */
  to?: string
  /** debate posture for agent messages */
  stance?: Stance
}

/** How the organisation works — tunable without slowing the room down. */
export interface OrgSettings {
  /** how many coworkers work at once each round */
  concurrency: number
  /** how many rounds the session can run */
  rounds: number
  /** allow coworkers to disagree and argue toward a resolution */
  debate: boolean
  /** a short charter/culture line that shapes how they work together */
  culture: string
}

/** A web source the model grounded an artifact on (via Google Search grounding). */
export interface Source {
  title: string
  uri: string
}

export type ArtifactKind = 'doc' | 'code'

export interface Artifact {
  id: string
  stageId: string
  agentId: string
  title: string
  body: string
  sources?: Source[]
  /** 'code' artifacts carry a real file; 'doc' is prose */
  kind?: ArtifactKind
  /** for code: the path/filename, e.g. "src/api/export.ts" */
  filename?: string
  /** for code: language hint for highlighting, e.g. "ts", "py" */
  language?: string
}

export type RunStatus = 'draft' | 'running' | 'complete'

export type EngineName = 'gemini' | 'offline'

export interface RunArtifact {
  title: string
  body: string
  agentName: string
  agentRole: string
  sources?: Source[]
  kind?: ArtifactKind
  filename?: string
  language?: string
}

/** A completed run, saved to history. */
export interface RunRecord {
  id: string
  modeId: string
  modeName: string
  modeEmoji: string
  accent: string
  task: string
  engineName: EngineName
  ts: number
  artifacts: RunArtifact[]
}
