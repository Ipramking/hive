import { create } from 'zustand'
import type { Artifact, EngineName, FeedMessage, ModeConfig, RunRecord, RunStatus } from './types'
import { getEngine, resolveEngineName } from './engine'
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
  reset: () => void
  run: () => Promise<void>
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

  reset: () =>
    set({
      runStatus: 'draft',
      currentStageId: null,
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
