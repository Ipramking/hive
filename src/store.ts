import { create } from 'zustand'
import type { Artifact, EngineName, FeedMessage, ModeConfig, RunRecord, RunStatus } from './types'
import { getEngine, resolveEngineName } from './engine'
import { searchWeb } from './engine/webSearch'
import { callLLM, looseJson } from './engine/llmClient'
import { brainForIndex, managerBrain } from './engine/brains'
import { buildAgentPrompt, buildManagerPrompt, parseAgentTurn, parseManager } from './engine/floor'
import { runToMarkdown } from './lib/exportRun'
import {
  loadActiveModeId,
  loadApiKey,
  loadHistory,
  loadModes,
  loadWebAccess,
  saveActiveModeId,
  saveApiKey,
  saveHistory,
  saveModes,
  saveWebAccess,
} from './lib/storage'

let seq = 0
const uid = () => `${Date.now()}-${seq++}`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const push = (feed: FeedMessage[], m: Omit<FeedMessage, 'id' | 'ts'>): FeedMessage[] => [
  ...feed,
  { ...m, id: uid(), ts: Date.now() },
]

interface HiveState {
  modes: ModeConfig[]
  activeModeId: string
  apiKey: string
  webAccess: boolean

  task: string
  runStyle: 'relay' | 'floor'
  round: number
  runStatus: RunStatus
  currentStageId: string | null
  agentStatus: Record<string, 'idle' | 'thinking' | 'working' | 'done'>
  feed: FeedMessage[]
  artifacts: Artifact[]
  lastRanTask: string
  runToken: number
  history: RunRecord[]

  // derived helpers
  activeMode: () => ModeConfig
  engineName: () => EngineName

  // history actions
  deleteRun: (id: string) => void
  clearHistory: () => void

  // mode + settings actions
  setActiveMode: (id: string) => void
  upsertMode: (mode: ModeConfig) => void
  deleteMode: (id: string) => void
  setApiKey: (key: string) => void
  setWebAccess: (on: boolean) => void

  // run actions
  setTask: (task: string) => void
  setRunStyle: (style: 'relay' | 'floor') => void
  reset: () => void
  run: () => Promise<void>
  runFloor: () => Promise<void>
  launch: () => Promise<void>
  currentRun: () => RunRecord
  exportMarkdown: () => string
}

const initialModes = loadModes()
const initialActive = (() => {
  const id = loadActiveModeId()
  return initialModes.some((m) => m.id === id) ? id : initialModes[0].id
})()

export const useHive = create<HiveState>((set, get) => ({
  modes: initialModes,
  activeModeId: initialActive,
  apiKey: loadApiKey(),
  webAccess: loadWebAccess(),

  task: '',
  runStyle: 'floor',
  round: 0,
  runStatus: 'draft',
  currentStageId: null,
  agentStatus: {},
  feed: [],
  artifacts: [],
  lastRanTask: '',
  runToken: 0,
  history: loadHistory(),

  deleteRun: (id) => {
    const next = get().history.filter((r) => r.id !== id)
    saveHistory(next)
    set({ history: next })
  },
  clearHistory: () => {
    saveHistory([])
    set({ history: [] })
  },

  activeMode: () => {
    const s = get()
    return s.modes.find((m) => m.id === s.activeModeId) ?? s.modes[0]
  },
  engineName: () => resolveEngineName(get().apiKey),

  setActiveMode: (id) => {
    if (get().activeModeId === id) return
    saveActiveModeId(id)
    set({
      activeModeId: id,
      runStatus: 'draft',
      currentStageId: null,
      agentStatus: {},
      feed: [],
      artifacts: [],
      lastRanTask: '',
      runToken: get().runToken + 1,
    })
  },

  upsertMode: (mode) => {
    const modes = get().modes
    const exists = modes.some((m) => m.id === mode.id)
    const next = exists ? modes.map((m) => (m.id === mode.id ? mode : m)) : [...modes, mode]
    saveModes(next)
    set({ modes: next })
    // if we edited the active mode, reset its run
    if (get().activeModeId === mode.id) get().reset()
  },

  deleteMode: (id) => {
    const target = get().modes.find((m) => m.id === id)
    if (!target || target.builtIn) return
    const next = get().modes.filter((m) => m.id !== id)
    saveModes(next)
    const nextActive = get().activeModeId === id ? next[0].id : get().activeModeId
    saveActiveModeId(nextActive)
    set({ modes: next, activeModeId: nextActive })
    if (get().activeModeId !== id) return
  },

  setApiKey: (key) => {
    saveApiKey(key)
    set({ apiKey: key })
  },

  setWebAccess: (on) => {
    saveWebAccess(on)
    set({ webAccess: on })
  },

  setTask: (task) => set({ task }),
  setRunStyle: (style) => set({ runStyle: style }),

  launch: async () => {
    if (get().runStyle === 'floor') return get().runFloor()
    return get().run()
  },

  reset: () =>
    set({
      runStatus: 'draft',
      currentStageId: null,
      round: 0,
      agentStatus: {},
      feed: [],
      artifacts: [],
      lastRanTask: '',
      runToken: get().runToken + 1,
    }),

  run: async () => {
    const { runStatus, task } = get()
    if (runStatus === 'running') return
    const mode = get().activeMode()
    const engine = getEngine(get().apiKey)
    const token = get().runToken + 1
    const nameOf = (id: string) => mode.agents.find((a) => a.id === id)?.name ?? id
    const live = engine.name === 'gemini'
    const webAccess = live && get().webAccess

    set({
      runToken: token,
      runStatus: 'running',
      currentStageId: null,
      artifacts: [],
      lastRanTask: task.trim(),
      agentStatus: Object.fromEntries(mode.agents.map((a) => [a.id, 'idle'])),
      feed: push([], {
        kind: 'system',
        text: `${mode.name} started on "${task.trim() || 'the task'}" · ${
          live ? (webAccess ? 'live Gemini + web' : 'live Gemini') : 'offline'
        } engine`,
      }),
    })

    const priorArtifacts: { title: string; body: string }[] = []

    for (const stage of mode.stages) {
      if (get().runToken !== token) return
      const agent = mode.agents.find((a) => a.id === stage.ownerId) ?? mode.agents[0]

      set((s) => ({
        currentStageId: stage.id,
        agentStatus: { ...s.agentStatus, [agent.id]: 'thinking' },
      }))

      const result = await engine.runStage({ task, mode, stage, agent, priorArtifacts, webAccess })
      if (get().runToken !== token) return

      for (const line of result.thinking) {
        if (get().runToken !== token) return
        await sleep(live ? 260 : 500)
        set((s) => ({
          feed: push(s.feed, { kind: 'agent', agentId: agent.id, stageId: stage.id, text: line }),
        }))
      }

      set((s) => ({ agentStatus: { ...s.agentStatus, [agent.id]: 'working' } }))
      await sleep(400)
      if (get().runToken !== token) return

      const artifact: Artifact = {
        id: uid(),
        stageId: stage.id,
        agentId: agent.id,
        title: stage.produces,
        body: result.artifactBody,
        ...(result.sources?.length ? { sources: result.sources } : {}),
      }
      priorArtifacts.push({ title: artifact.title, body: artifact.body })

      set((s) => ({
        artifacts: [...s.artifacts, artifact],
        agentStatus: { ...s.agentStatus, [agent.id]: 'done' },
        feed: push(s.feed, {
          kind: 'artifact',
          agentId: agent.id,
          stageId: stage.id,
          text: `${nameOf(agent.id)} delivered: ${artifact.title}`,
        }),
      }))

      await sleep(300)
      if (get().runToken !== token) return
      set((s) => ({
        feed: push(s.feed, { kind: 'handoff', agentId: agent.id, stageId: stage.id, text: result.handoff }),
      }))
      await sleep(240)
    }

    if (get().runToken !== token) return

    const record: RunRecord = {
      id: uid(),
      modeId: mode.id,
      modeName: mode.name,
      modeEmoji: mode.emoji,
      accent: mode.accent,
      task: get().lastRanTask,
      engineName: engine.name === 'gemini' ? 'gemini' : 'offline',
      ts: Date.now(),
      artifacts: get().artifacts.map((a) => {
        const agent = mode.agents.find((ag) => ag.id === a.agentId)
        return {
          title: a.title,
          body: a.body,
          agentName: agent?.name ?? '',
          agentRole: agent?.role ?? '',
          ...(a.sources?.length ? { sources: a.sources } : {}),
        }
      }),
    }
    const nextHistory = [record, ...get().history]
    saveHistory(nextHistory)

    set((s) => ({
      runStatus: 'complete',
      currentStageId: null,
      history: nextHistory,
      feed: push(s.feed, { kind: 'system', text: `${mode.name} complete — ${mode.stages.length} deliverables ready. ✅` }),
    }))
  },

  // Live Floor: a manager-led session where several coworkers work, talk, and
  // hand off IN PARALLEL — each on its own brain in the pool.
  runFloor: async () => {
    if (get().runStatus === 'running') return
    const mode = get().activeMode()
    const task = get().task.trim()
    const token = get().runToken + 1
    const agentIndex = (id: string) => mode.agents.findIndex((a) => a.id === id)

    set({
      runToken: token,
      runStatus: 'running',
      currentStageId: null,
      round: 0,
      artifacts: [],
      lastRanTask: task,
      agentStatus: Object.fromEntries(mode.agents.map((a) => [a.id, 'idle'])),
      feed: push([], {
        kind: 'system',
        text: `${mode.name} floor is live on "${task || 'the task'}" — ${mode.agents.length} coworkers in the room`,
      }),
    })

    // shared live web intel, pulled once for the whole room
    let intel = ''
    let intelSources: { title: string; uri: string }[] = []
    if (get().webAccess && task) {
      const web = await searchWeb(task)
      if (web.context) {
        intel = web.context
        intelSources = web.sources
        set((s) => ({
          feed: push(s.feed, { kind: 'system', text: `Live web intel on the board — ${web.sources.length} sources` }),
        }))
      }
    }

    const transcript: string[] = []
    const line = (t: string) => {
      transcript.push(t)
      if (transcript.length > 24) transcript.shift()
    }
    const maxRounds = Math.min(6, Math.max(3, mode.agents.length))
    const maxActivate = Math.min(3, mode.agents.length)

    for (let round = 1; round <= maxRounds; round++) {
      if (get().runToken !== token) return
      set({ round })

      // manager decides who works this round
      const mgrText = await callLLM(
        managerBrain(),
        buildManagerPrompt({
          mode,
          task,
          round,
          maxRounds,
          transcript: transcript.join('\n'),
          boardTitles: get().artifacts.map((a) => a.title),
          hasIntel: !!intel,
          maxActivate,
        }),
        true,
      )
      if (get().runToken !== token) return
      const plan = parseManager(looseJson(mgrText) ?? {}, mode, maxActivate)
      set((s) => ({ feed: push(s.feed, { kind: 'manager', text: plan.note }) }))
      line(`Lead: ${plan.note}`)
      if (plan.done || plan.activate.length === 0) break

      // everyone activated starts thinking at once
      set((s) => ({
        agentStatus: { ...s.agentStatus, ...Object.fromEntries(plan.activate.map((a) => [a.agentId, 'thinking'])) },
      }))
      await sleep(280)

      // run them in parallel — each on its own brain
      await Promise.all(
        plan.activate.map(async ({ agentId, instruction }) => {
          const agent = mode.agents.find((a) => a.id === agentId)
          if (!agent) return
          const text = await callLLM(
            brainForIndex(agentIndex(agentId)),
            buildAgentPrompt({ mode, agent, task, instruction, transcript: transcript.join('\n'), intel }),
            true,
          )
          if (get().runToken !== token) return
          const turn = parseAgentTurn(looseJson(text) ?? {}, mode)

          set((s) => ({ agentStatus: { ...s.agentStatus, [agentId]: 'working' } }))
          set((s) => ({
            feed: push(s.feed, { kind: 'agent', agentId, text: turn.say, to: turn.to ?? undefined }),
          }))
          line(`${agent.name}: ${turn.say}`)

          if (turn.deliver) {
            const artifact: Artifact = {
              id: uid(),
              stageId: `floor-r${round}`,
              agentId,
              title: turn.deliver.title,
              body: turn.deliver.body,
              ...(intel && intelSources.length ? { sources: intelSources } : {}),
            }
            set((s) => ({
              artifacts: [...s.artifacts, artifact],
              feed: push(s.feed, { kind: 'artifact', agentId, text: `${agent.name} dropped: ${turn.deliver!.title}` }),
            }))
            line(`${agent.name} delivered "${turn.deliver.title}"`)
          }
          set((s) => ({ agentStatus: { ...s.agentStatus, [agentId]: 'done' } }))
        }),
      )
      await sleep(320)
    }

    if (get().runToken !== token) return

    const record: RunRecord = {
      id: uid(),
      modeId: mode.id,
      modeName: mode.name,
      modeEmoji: mode.emoji,
      accent: mode.accent,
      task: get().lastRanTask,
      engineName: 'gemini',
      ts: Date.now(),
      artifacts: get().artifacts.map((a) => {
        const agent = mode.agents.find((ag) => ag.id === a.agentId)
        return {
          title: a.title,
          body: a.body,
          agentName: agent?.name ?? '',
          agentRole: agent?.role ?? '',
          ...(a.sources?.length ? { sources: a.sources } : {}),
        }
      }),
    }
    const nextHistory = [record, ...get().history]
    saveHistory(nextHistory)

    set((s) => ({
      runStatus: 'complete',
      round: 0,
      currentStageId: null,
      history: nextHistory,
      feed: push(s.feed, {
        kind: 'system',
        text: `Session wrapped — ${get().artifacts.length} deliverables on the board. ✅`,
      }),
    }))
  },

  currentRun: () => {
    const s = get()
    const mode = s.activeMode()
    return {
      id: 'current',
      modeId: mode.id,
      modeName: mode.name,
      modeEmoji: mode.emoji,
      accent: mode.accent,
      task: s.lastRanTask,
      engineName: s.engineName(),
      ts: Date.now(),
      artifacts: s.artifacts.map((a) => {
        const agent = mode.agents.find((ag) => ag.id === a.agentId)
        return {
          title: a.title,
          body: a.body,
          agentName: agent?.name ?? '',
          agentRole: agent?.role ?? '',
          ...(a.sources?.length ? { sources: a.sources } : {}),
        }
      }),
    }
  },

  exportMarkdown: () => runToMarkdown(get().currentRun()),
}))
