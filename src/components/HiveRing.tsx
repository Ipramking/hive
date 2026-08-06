import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cpu, agentIconOf, modeIconOf } from './icons'
import { useHive } from '../store'
import { brainForIndex } from '../engine/brains'
import type { Agent } from '../types'

const HEX = 'polygon(50% 1%, 93% 25%, 93% 75%, 50% 99%, 7% 75%, 7% 25%)'

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
  const runStatus = useHive((s) => s.runStatus)
  const artifacts = useHive((s) => s.artifacts)
  const rounds = useHive((s) => s.org.rounds)
  const running = runStatus === 'running'
  const [selected, setSelected] = useState<string | null>(null)

  const agents = mode.agents
  const n = agents.length
  const pos = useMemo(() => agents.map((_, i) => nodePos(i, n)), [n, agents])
  const idx = useMemo(() => Object.fromEntries(agents.map((a, i) => [a.id, i])), [agents])

  const handoffs = useMemo(() => {
    const out: { id: string; from: number; to: number }[] = []
    for (let i = feed.length - 1; i >= 0 && out.length < 4; i--) {
      const m = feed[i]
      if (m.kind === 'agent' && m.agentId && m.to && idx[m.agentId] != null && idx[m.to] != null) {
        out.push({ id: m.id, from: idx[m.agentId], to: idx[m.to] })
      }
    }
    return out
  }, [feed, idx])

  const activeCount = Object.values(agentStatus).filter((s) => s === 'thinking' || s === 'working').length
  const files = artifacts.filter((a) => a.kind === 'code').length
  const connections = n > 2 ? n : Math.max(0, n - 1)
  const progress = runStatus === 'complete' ? 100 : running ? Math.min(95, Math.round(((round - 0.5) / Math.max(1, rounds)) * 100)) : 0
  const sel = selected ? agents.find((a) => a.id === selected) : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-baseline gap-2">
          <p className="font-display text-sm font-bold">Hive Map</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            {n} {n === 1 ? 'node' : 'nodes'} · {connections} connections
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: running ? mode.accent : 'rgba(255,255,255,0.35)' }}>
          {running ? `Round ${round} · ${activeCount} active` : runStatus === 'complete' ? 'Connected' : 'Idle'}
        </p>
      </div>

      <div className="relative grid flex-1 place-items-center">
        <div className="relative aspect-square w-full max-w-[min(100%,560px)]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0.5,0.5 L4,3 L0.5,5.5" fill="none" stroke={mode.accent} strokeWidth="0.8" strokeOpacity="0.6" />
              </marker>
            </defs>

            {/* spokes to the core */}
            {pos.map((p, i) => {
              const on = agentStatus[agents[i].id] === 'thinking' || agentStatus[agents[i].id] === 'working'
              return <line key={`spoke-${i}`} x1="50" y1="50" x2={p.x} y2={p.y} stroke={agents[i].color} strokeWidth={0.22} strokeOpacity={on ? 0.5 : 0.1} />
            })}

            {/* directional perimeter connections — ideas flowing round the hive */}
            {pos.map((p, i) => {
              const q = pos[(i + 1) % n]
              if (n < 2) return null
              // shorten so the arrow sits between the hexes, not under them
              const dx = q.x - p.x, dy = q.y - p.y
              const len = Math.hypot(dx, dy) || 1
              const ux = dx / len, uy = dy / len
              const x1 = p.x + ux * 9, y1 = p.y + uy * 9
              const x2 = q.x - ux * 9, y2 = q.y - uy * 9
              return (
                <motion.line
                  key={`ring-${i}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={mode.accent}
                  strokeOpacity={running ? 0.35 : 0.18}
                  strokeWidth={0.3}
                  strokeDasharray="1.5 2"
                  markerEnd="url(#arrow)"
                  animate={running ? { strokeDashoffset: [0, -7] } : {}}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                />
              )
            })}

            {/* live hand-off pulses (several at once) */}
            <AnimatePresence>
              {handoffs.map((h, k) => (
                <motion.g key={h.id} exit={{ opacity: 0 }}>
                  {k === 0 && (
                    <motion.circle
                      r={1.6}
                      fill={agents[h.to].color}
                      initial={{ cx: pos[h.from].x, cy: pos[h.from].y, opacity: 1 }}
                      animate={{ cx: pos[h.to].x, cy: pos[h.to].y, opacity: [1, 1, 0] }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                      style={{ filter: `drop-shadow(0 0 2px ${agents[h.to].color})` }}
                    />
                  )}
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>

          {/* the core — the hive's heart */}
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <motion.div
              className="grid h-[56px] w-[56px] place-items-center"
              style={{ clipPath: HEX, background: `${mode.accent}1c`, boxShadow: `inset 0 0 0 1px ${mode.accent}55` }}
              animate={running ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              {(() => {
                const ModeI = modeIconOf(mode)
                return <ModeI size={22} strokeWidth={1.75} style={{ color: mode.accent }} />
              })()}
            </motion.div>
            <span className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">The Hive</span>
            {n === 0 && (
              <p className="mt-2 max-w-[220px] text-center text-xs leading-relaxed text-white/45">
                {running ? 'Assembling the team…' : 'Type a task — the hive assembles the right team for it.'}
              </p>
            )}
          </div>

          {/* hexagonal nodes */}
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
                <motion.div
                  animate={{ y: [0, -4, 0, 3, 0], x: [0, 2, 0, -2, 0] }}
                  transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
                >
                  <HexNode agent={a} active={active} done={done} selected={selected === a.id} />
                </motion.div>
              </button>
            )
          })}
        </div>
      </div>

      {/* stats bar */}
      {n > 0 && (
        <div className="mt-1 grid grid-cols-4 gap-2">
          <Stat value={n} label="Nodes" />
          <Stat value={connections} label="Links" />
          <Stat value={files} label="Files" accent={mode.accent} />
          <Stat value={`${progress}%`} label="Progress" accent={mode.accent} />
        </div>
      )}

      {/* selected node detail */}
      <AnimatePresence mode="wait">
        {sel && (
          <motion.div
            key={sel.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-2 w-full rounded-2xl border border-line bg-ink-850/70 p-3.5 backdrop-blur-sm"
          >
            <ProfileBody agent={sel} index={idx[sel.id]} status={agentStatus[sel.id] ?? 'idle'} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink-850/50 px-2 py-1.5 text-center">
      <p className="font-display text-base font-extrabold leading-none" style={accent ? { color: accent } : undefined}>{value}</p>
      <p className="eyebrow mt-1">{label}</p>
    </div>
  )
}

function HexNode({ agent, active, done, selected }: { agent: Agent; active: boolean; done: boolean; selected: boolean }) {
  const size = 'clamp(46px, 8.5vw, 70px)'
  const Icon = agentIconOf(agent)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        {/* outer hex = coloured border */}
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: HEX, background: active ? agent.color : `${agent.color}${selected ? 'cc' : '77'}`, filter: active ? `drop-shadow(0 0 6px ${agent.color})` : 'none' }}
          animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 1.4, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
        />
        {/* inner hex = dark fill */}
        <div className="absolute" style={{ inset: 2, clipPath: HEX, background: '#12141d' }} />
        {/* icon */}
        <div className="absolute inset-0 grid place-items-center">
          <Icon size={22} strokeWidth={1.75} style={{ color: agent.color }} />
        </div>
        {/* pulsing overlay while working */}
        {active && (
          <motion.div
            className="absolute inset-0"
            style={{ clipPath: HEX, boxShadow: `inset 0 0 0 1.5px ${agent.color}` }}
            animate={{ opacity: [0.15, 0.8, 0.15] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {done && (
          <span className="absolute -bottom-1 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[9px] font-bold text-ink-950">✓</span>
        )}
      </div>
      <div className="flex flex-col items-center leading-none">
        <span className="font-display text-[13px] font-bold text-white/90" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>{agent.name}</span>
        <span className="mt-0.5 max-w-[92px] truncate text-center font-mono text-[8px] uppercase tracking-wider text-white/40">{agent.tag ?? agent.role}</span>
      </div>
    </div>
  )
}

const statusText: Record<string, string> = { idle: 'idle', thinking: 'thinking…', working: 'working…', done: 'done' }

function ProfileBody({ agent, index, status }: { agent: Agent; index: number; status: string }) {
  const floor = useHive((s) => s.runStyle === 'floor')
  const brain = floor ? brainForIndex(index) : null
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center" style={{ clipPath: HEX, background: `${agent.color}22`, boxShadow: `inset 0 0 0 1px ${agent.color}66` }}>
        {(() => {
          const I = agentIconOf(agent)
          return <I size={18} strokeWidth={1.75} style={{ color: agent.color }} />
        })()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-sm font-bold">{agent.name}</p>
          {agent.tag && (
            <span className="rounded-full px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider" style={{ background: `${agent.color}18`, color: agent.color }}>{agent.tag}</span>
          )}
          <span className="ml-auto flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-wider" style={{ color: status === 'done' ? '#4ade80' : status !== 'idle' ? agent.color : 'rgba(255,255,255,0.4)' }}>
            {statusText[status]}
          </span>
        </div>
        <p className="eyebrow mt-0.5">{agent.role}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/55">{agent.blurb}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {agent.skills.map((s) => (
            <span key={s} className="chip border-white/10 text-[10px] text-white/55">{s}</span>
          ))}
          {brain && (
            <span className="ml-auto flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-wider text-white/35" title={`Runs on ${brain.label}`}>
              <Cpu size={9} /> {brain.provider}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
