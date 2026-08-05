import { create } from 'zustand'
import type { Artifact, EngineName, FeedMessage, ModeConfig, OrgSettings, RunRecord, RunStatus } from './types'
import { getEngine, resolveEngineName } from './engine'
import { searchWeb } from './engine/webSearch'
import { callResilient, looseJson } from './engine/llmClient'
import { brainForIndex, managerBrain } from './engine/brains'
import { buildAgentPrompt, buildManagerPrompt, buildWhatsLeftPrompt, parseAgentTurn, parseManager } from './engine/floor'
import { buildTeamPrompt, fallbackTeam, parseTeam } from './engine/autoTeam'
import { runToMarkdown } from './lib/exportRun'
import {
  loadActiveModeId,
  loadApiKey,
  loadHistory,
  loadModes,
  loadOrg,
  loadWebAccess,
  saveActiveModeId,
  saveApiKey,
  saveHistory,
  saveModes,
  saveOrg,
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
  /** the ephemeral team the hive assembled for the current Auto run */
  autoTeam: ModeConfig | null
  apiKey: string
  webAccess: boolean
  org: OrgSettings
  /** user messages typed mid-session, consumed by the next round */
  pendingUser: string[]

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
  setOrg: (patch: Partial<OrgSettings>) => void
  postUser: (text: string) => void

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
  autoTeam: null,
  apiKey: loadApiKey(),
  webAccess: loadWebAccess(),
  org: loadOrg(),
  pendingUser: [],

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
    if (s.activeModeId === 'auto' && s.autoTeam) return s.autoTeam
    return s.modes.find((m) => m.id === s.activeModeId) ?? s.modes[0]
  },
  engineName: () => resolveEngineName(get().apiKey),

  setActiveMode: (id) => {
    if (get().activeModeId === id) return
    saveActiveModeId(id)
    set({
      activeModeId: id,
      autoTeam: null,
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

  setOrg: (patch) => {
    const next = { ...get().org, ...patch }
    saveOrg(next)
    set({ org: next })
  },

  // user speaks into the room — shown immediately, folded into the next round
  postUser: (text) => {
    const t = text.trim()
    if (!t) return
    set((s) => ({
      feed: push(s.feed, { kind: 'user', text: t }),
      pendingUser: [...s.pendingUser, t],
    }))
  },

  setTask: (task) => set({ task }),
  setRunStyle: (style) => set({ runStyle: style }),

  launch: async () => {
    // Auto has no fixed stages — it always runs as a live floor
    if (get().runStyle === 'floor' || get().activeModeId === 'auto') return get().runFloor()
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
      autoTeam: get().activeModeId === 'auto' ? null : get().autoTeam,
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
  // hand off IN PARALLEL — each on its own brain in the pool. Assembles its own
  // team in Auto mode, scaffolds real files, and always ships a "What's left" doc.
  runFloor: async () => {
    if (get().runStatus === 'running') return
    const task = get().task.trim()
    const token = get().runToken + 1

    const org = get().org
    set({
      runToken: token,
      runStatus: 'running',
      currentStageId: null,
      round: 0,
      artifacts: [],
      lastRanTask: task,
      pendingUser: [],
      agentStatus: {},
      feed: push([], { kind: 'system', text: `Opening the floor on "${task || 'the task'}"` }),
    })

    // 1. Assemble the team (Auto mode) or use the picked mode's roster
    let mode = get().activeMode()
    if (get().activeModeId === 'auto') {
      set((s) => ({ feed: push(s.feed, { kind: 'system', text: 'Assembling a team for this task…' }) }))
      const teamText = await callResilient(buildTeamPrompt(task), true, managerBrain())
      if (get().runToken !== token) return
      mode = parseTeam(looseJson(teamText) ?? {}, task) ?? fallbackTeam(task)
      set({ autoTeam: mode })
      set((s) => ({
        agentStatus: Object.fromEntries(mode.agents.map((a) => [a.id, 'idle'])),
        feed: push(s.feed, { kind: 'system', text: `Team assembled — ${mode.agents.map((a) => a.name).join(', ')}` }),
      }))
    } else {
      set({ agentStatus: Object.fromEntries(mode.agents.map((a) => [a.id, 'idle'])) })
    }
    if (!mode.agents.length) mode = fallbackTeam(task)
    const agentIndex = (id: string) => mode.agents.findIndex((a) => a.id === id)

    // 2. Shared live web intel, pulled once for the whole room
    let intel = ''
    let intelSources: { title: string; uri: string }[] = []
    if (get().webAccess && task) {
      const web = await searchWeb(task)
      if (web.context) {
        intel = web.context
        intelSources = web.sources
        set((s) => ({ feed: push(s.feed, { kind: 'system', text: `Live web intel on the board — ${web.sources.length} sources` }) }))
      }
    }

    const transcript: string[] = []
    const line = (t: string) => {
      transcript.push(t)
      if (transcript.length > 24) transcript.shift()
    }
    const maxRounds = Math.min(8, Math.max(3, org.rounds))
    // how many work at once — cap at the roster and the number of brains so they truly run in parallel
    const maxActivate = Math.min(mode.agents.length, Math.max(2, org.concurrency))

    for (let round = 1; round <= maxRounds; round++) {
      if (get().runToken !== token) return
      set({ round })

      // fold in anything the human typed into the room since last round
      const steerArr = get().pendingUser
      const humanSteer = steerArr.join(' | ')
      if (steerArr.length) {
        steerArr.forEach((m) => line(`Human: ${m}`))
        set({ pendingUser: [] })
      }

      // manager decides who works this round (resilient across the whole pool)
      const mgrText = await callResilient(
        buildManagerPrompt({
          mode,
          task,
          round,
          maxRounds,
          transcript: transcript.join('\n'),
          boardTitles: get().artifacts.map((a) => a.title),
          hasIntel: !!intel,
          maxActivate,
          humanSteer,
          debate: org.debate,
          culture: org.culture,
        }),
        true,
        managerBrain(),
      )
      if (get().runToken !== token) return
      let plan = parseManager(looseJson(mgrText) ?? {}, mode, maxActivate)

      // robustness: if the manager gave nothing on the first round, put the whole room to work anyway
      if (plan.activate.length === 0 && round === 1) {
        plan = {
          note: 'Everyone take a piece and start shipping.',
          done: false,
          activate: mode.agents.slice(0, maxActivate).map((a) => ({ agentId: a.id, instruction: 'Do your part of this task now and ship a concrete file or doc.' })),
        }
      }

      // collaboration: top up so `concurrency` coworkers work at once, not just the ones the lead named
      if (!plan.done && plan.activate.length < maxActivate) {
        const busy = new Set(plan.activate.map((a) => a.agentId))
        for (const a of mode.agents) {
          if (plan.activate.length >= maxActivate) break
          if (busy.has(a.id)) continue
          plan.activate.push({ agentId: a.id, instruction: 'Jump in — react to the room, push your angle, and ship your piece.' })
        }
      }

      set((s) => ({ feed: push(s.feed, { kind: 'manager', text: plan.note }) }))
      line(`Lead: ${plan.note}`)
      if (plan.done || plan.activate.length === 0) break

      set((s) => ({ agentStatus: { ...s.agentStatus, ...Object.fromEntries(plan.activate.map((a) => [a.agentId, 'thinking'])) } }))
      await sleep(280)

      // run them in parallel — each prefers its own brain, but falls back across the pool
      await Promise.all(
        plan.activate.map(async ({ agentId, instruction }) => {
          const agent = mode.agents.find((a) => a.id === agentId)
          if (!agent) return
          const text = await callResilient(
            buildAgentPrompt({ mode, agent, task, instruction, transcript: transcript.join('\n'), intel, debate: org.debate, culture: org.culture, humanSteer }),
            true,
            brainForIndex(agentIndex(agentId)),
          )
          if (get().runToken !== token) return
          const turn = parseAgentTurn(looseJson(text) ?? {}, mode)

          set((s) => ({ agentStatus: { ...s.agentStatus, [agentId]: 'working' } }))
          set((s) => ({ feed: push(s.feed, { kind: 'agent', agentId, text: turn.say, to: turn.to ?? undefined, stance: turn.stance ?? undefined }) }))
          line(`${agent.name}${turn.stance === 'challenge' ? ' (pushes back)' : ''}: ${turn.say}`)

          if (turn.deliver) {
            const d = turn.deliver
            const artifact: Artifact = {
              id: uid(),
              stageId: `floor-r${round}`,
              agentId,
              title: d.title,
              body: d.body,
              kind: d.kind,
              ...(d.filename ? { filename: d.filename } : {}),
              ...(d.language ? { language: d.language } : {}),
              ...(intel && intelSources.length && d.kind === 'doc' ? { sources: intelSources } : {}),
            }
            set((s) => ({
              artifacts: [...s.artifacts, artifact],
              feed: push(s.feed, { kind: 'artifact', agentId, text: `${agent.name} shipped: ${d.filename || d.title}` }),
            }))
            line(`${agent.name} shipped ${d.filename || d.title}`)
          }
          set((s) => ({ agentStatus: { ...s.agentStatus, [agentId]: 'done' } }))
        }),
      )
      await sleep(320)
    }

    if (get().runToken !== token) return

    // 3. Always close with a "What's left" handoff doc
    set((s) => ({ feed: push(s.feed, { kind: 'system', text: 'Writing the "What’s left" handoff…' }) }))
    const wlText = await callResilient(
      buildWhatsLeftPrompt({
        mode,
        task,
        deliverables: get().artifacts.map((a) => ({ title: a.title, filename: a.filename, kind: a.kind })),
      }),
      true,
      managerBrain(),
    )
    if (get().runToken !== token) return
    const wlBody =
      (looseJson<{ body: string }>(wlText)?.body || '').trim() ||
      `## What's left\n\n- [ ] Review the shipped files and wire them together\n- [ ] Fill in any stubbed logic\n- [ ] Add tests and error handling\n- [ ] Deploy\n\n_(Generated offline — the pool was unavailable.)_`
    const wlArtifact: Artifact = {
      id: uid(),
      stageId: 'floor-wrap',
      agentId: mode.agents[0]?.id ?? 'lead',
      title: "What's left",
      body: wlBody,
      kind: 'code',
      filename: 'WHATS_LEFT.md',
      language: 'md',
    }
    set((s) => ({
      artifacts: [...s.artifacts, wlArtifact],
      feed: push(s.feed, { kind: 'artifact', agentId: wlArtifact.agentId, text: 'Shipped: WHATS_LEFT.md' }),
    }))

    const codeCount = get().artifacts.filter((a) => a.kind === 'code').length
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
          ...(a.kind ? { kind: a.kind } : {}),
          ...(a.filename ? { filename: a.filename } : {}),
          ...(a.language ? { language: a.language } : {}),
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
      feed: push(s.feed, { kind: 'system', text: `Session wrapped — ${codeCount} files + docs on the board. ✅` }),
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
          ...(a.kind ? { kind: a.kind } : {}),
          ...(a.filename ? { filename: a.filename } : {}),
          ...(a.language ? { language: a.language } : {}),
        }
      }),
    }
  },

  exportMarkdown: () => runToMarkdown(get().currentRun()),
}))
