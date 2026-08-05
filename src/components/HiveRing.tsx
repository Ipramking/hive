import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cpu } from 'lucide-react'
import { useHive } from '../store'
import { brainForIndex } from '../engine/brains'
import type { Agent } from '../types'

/** polar → cartesian in a 0..100 square, 12 o'clock = -90° */
function nodePos(i: number, n: number, radius = 35) {
  const a = (-90 + (360 / n) * i) * (Math.PI / 180)
  return { x: 50 + radius * Math.cos(a), y: 50 + radius * Math.sin(a) }
}

export function HiveRing() {
  const mode = useHive((s) => s.activeMode())
  const agentStatus = useHive((s) => s.agentStatus)
  const feed = useHive((s) => s.feed)
  const round = useHive((s) => s.round)
  const running = useHive((s) => s.runStatus === 'running')
  const [selected, setSelected] = useState<string | null>(null)

  const agents = mode.agents
  const n = agents.length
  const pos = useMemo(() => agents.map((_, i) => nodePos(i, n)), [n, agents])
  const idx = useMemo(() => Object.fromEntries(agents.map((a, i) => [a.id, i])), [agents])

  // most recent hand-off (agent message addressed "to" someone) drives a travelling pulse
  const handoff = useMemo(() => {
    for (let i = feed.length - 1; i >= 0; i--) {
      const m = feed[i]
      if (m.kind === 'agent' && m.agentId && m.to && idx[m.agentId] != null && idx[m.to] != null) {
        return { id: m.id, from: idx[m.agentId], to: idx[m.to] }
      }
    }
    return null
  }, [feed, idx])

  const activeCount = Object.values(agentStatus).filter((s) => s === 'thinking' || s === 'working').length
  const sel = selected ? agents.find((a) => a.id === selected) : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="eyebrow">The hive</p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
          {running ? `Round ${round} · ${activeCount} active` : `${n} coworkers`}
        </p>
      </div>

      <div className="relative grid flex-1 place-items-center">
        <div className="relative aspect-square w-full max-w-[min(100%,560px)]">
          {/* threads + pulses */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
            {/* spokes to the core */}
            {pos.map((p, i) => (
              <line
                key={`spoke-${i}`}
                x1="50"
                y1="50"
                x2={p.x}
                y2={p.y}
                stroke={agents[i].color}
                strokeWidth={0.25}
                strokeOpacity={agentStatus[agents[i].id] === 'thinking' || agentStatus[agents[i].id] === 'working' ? 0.5 : 0.12}
              />
            ))}
            {/* perimeter web */}
            {pos.map((p, i) => {
              const q = pos[(i + 1) % n]
              return <line key={`ring-${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="rgba(236,232,222,0.10)" strokeWidth={0.2} />
            })}
            {/* live hand-off chord + travelling light */}
            <AnimatePresence>
              {handoff && (
                <motion.g key={handoff.id}>
                  <motion.line
                    x1={pos[handoff.from].x}
                    y1={pos[handoff.from].y}
                    x2={pos[handoff.to].x}
                    y2={pos[handoff.to].y}
                    stroke={agents[handoff.to].color}
                    strokeWidth={0.5}
                    initial={{ pathLength: 0, opacity: 0.9 }}
                    animate={{ pathLength: 1, opacity: [0.9, 0.25] }}
                    transition={{ duration: 1 }}
                  />
                  <motion.circle
                    r={1.4}
                    fill={agents[handoff.to].color}
                    initial={{ cx: pos[handoff.from].x, cy: pos[handoff.from].y, opacity: 1 }}
                    animate={{ cx: pos[handoff.to].x, cy: pos[handoff.to].y, opacity: [1, 1, 0] }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    style={{ filter: `drop-shadow(0 0 2px ${agents[handoff.to].color})` }}
                  />
                </motion.g>
              )}
            </AnimatePresence>
          </svg>

          {/* the core — the hive's heart */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="grid h-[15%] min-h-[54px] w-[15%] min-w-[54px] place-items-center rounded-full border border-line"
              style={{ background: `${mode.accent}14` }}
              animate={running ? { boxShadow: [`0 0 0 0 ${mode.accent}55`, `0 0 0 14px ${mode.accent}00`] } : {}}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <span className="text-2xl">{mode.emoji}</span>
            </motion.div>
          </div>

          {/* coworker cells */}
          {agents.map((a, i) => {
            const status = agentStatus[a.id] ?? 'idle'
            const active = status === 'thinking' || status === 'working'
            const done = status === 'done'
            return (
              <button
                key={a.id}
                onClick={() => setSelected((s) => (s === a.id ? null : a.id))}
                className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%` }}
                title={`${a.name} · ${a.role}`}
              >
                <Cell agent={a} active={active} done={done} selected={selected === a.id} accent={mode.accent} />
              </button>
            )
          })}
        </div>
      </div>

      {/* selected coworker profile */}
      <AnimatePresence mode="wait">
        {sel && (
          <motion.div
            key={sel.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-line bg-ink-850/70 p-3.5 backdrop-blur-sm"
          >
            <ProfileBody agent={sel} index={idx[sel.id]} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Cell({ agent, active, done, selected, accent }: { agent: Agent; active: boolean; done: boolean; selected: boolean; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <motion.div
          className="grid place-items-center rounded-full"
          style={{
            width: 'clamp(44px, 8vw, 66px)',
            height: 'clamp(44px, 8vw, 66px)',
            background: `${agent.color}1f`,
            boxShadow: `inset 0 0 0 1.5px ${agent.color}${active ? 'ee' : selected ? 'aa' : '55'}`,
          }}
          animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 1.4, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
        >
          <span style={{ fontSize: 'clamp(18px, 3vw, 26px)' }}>{agent.emoji}</span>
        </motion.div>
        {/* pulsing ring while working */}
        {active && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 0 2px ${agent.color}` }}
            animate={{ opacity: [0.1, 0.7, 0.1], scale: [1, 1.12, 1] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {/* done tick */}
        {done && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[9px] font-bold text-ink-950">
            ✓
          </span>
        )}
      </div>
      <div className="flex flex-col items-center leading-none">
        <span className="font-display text-[13px] font-bold text-white/90" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
          {agent.name}
        </span>
        {agent.tag && (
          <span className="mt-0.5 rounded-full px-1.5 py-px font-mono text-[8px] uppercase tracking-wider" style={{ background: `${agent.color}20`, color: agent.color }}>
            {agent.tag}
          </span>
        )}
      </div>
      {selected && (
        <span className="absolute -inset-2 -z-10 rounded-full" style={{ boxShadow: `0 0 0 1px ${accent}44` }} />
      )}
    </div>
  )
}

function ProfileBody({ agent, index }: { agent: Agent; index: number }) {
  const floor = useHive((s) => s.runStyle === 'floor')
  const brain = floor ? brainForIndex(index) : null
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl" style={{ background: `${agent.color}22`, boxShadow: `inset 0 0 0 1px ${agent.color}55` }}>
        {agent.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-sm font-bold">{agent.name}</p>
          {agent.tag && (
            <span className="rounded-full px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider" style={{ background: `${agent.color}18`, color: agent.color }}>
              {agent.tag}
            </span>
          )}
          {brain && (
            <span className="ml-auto flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-wider text-white/35">
              <Cpu size={9} /> {brain.provider}
            </span>
          )}
        </div>
        <p className="eyebrow mt-0.5">{agent.role}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/55">{agent.blurb}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.skills.map((s) => (
            <span key={s} className="chip border-white/10 text-[10px] text-white/55">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
