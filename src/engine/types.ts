import type { Agent, ModeConfig, Source, Stage } from '../types'

export interface StageInput {
  task: string
  mode: ModeConfig
  stage: Stage
  agent: Agent
  /** artifacts produced by earlier stages, oldest first */
  priorArtifacts: { title: string; body: string }[]
  /** when true, ask the model to ground its work with live Google Search */
  webAccess?: boolean
}

export interface StageResult {
  /** short in-character lines the agent "says" while working */
  thinking: string[]
  /** the produced artifact body (markdown-ish plain text) */
  artifactBody: string
  /** one-line handoff to the next stage */
  handoff: string
  /** web sources the model grounded on, if web access was used */
  sources?: Source[]
}

export interface Engine {
  name: 'gemini' | 'offline'
  runStage(input: StageInput): Promise<StageResult>
}
