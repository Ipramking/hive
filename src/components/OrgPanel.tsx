import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Cpu } from 'lucide-react'
import { useHive } from '../store'
import { brainForIndex } from '../engine/brains'

const statusLabel: Record<string, string> = {
  idle: 'idle',
  thinking: 'thinking…',
  working: 'working…',
  done: 'done',
}

export function OrgPanel({ onEdit }: { onEdit: () => void }) {
  const mode = useHive((s) => s.activeMode())
  const agentStatus = useHive((s) => s.agentStatus)
  const floor = useHive((s) => s.runStyle === 'floor')

  return (
    <aside className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="eyebrow">On the floor</p>
          <p className="mt-1 font-display text-sm font-bold">
            {mode.agents.length} coworkers · {mode.name}
          </p>
        </div>
        <button
          onClick={onEdit}
          title="Edit this mode"
          className="grid h-7 w-7 place-items-center rounded-lg border border-line text-white/50 transition-colors hover:bg-ink-700 hover:text-white/80"
        >
          <Pencil size={13} />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <AnimatePresence mode="popLayout">
          {mode.agents.map((a, i) => {
            const status = agentStatus[a.id] ?? 'idle'
            const active = status === 'thinking' || status === 'working'
            const done = status === 'done'
            const brain = floor ? brainForIndex(i) : null
            return (
              <motion.div
                key={`${mode.id}-${a.id}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: active ? 1.015 : 1,
                }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="relative overflow-hidden rounded-xl border border-line bg-ink-800/50 p-3"
                style={active ? { boxShadow: `0 0 0 1px ${a.color}66, 0 0 26px ${a.color}2e` } : undefined}
              >
                {/* liquid sheen that sweeps across an active worker */}
                {active && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `linear-gradient(115deg, transparent 30%, ${a.color}20 50%, transparent 70%)`,
                    }}
                    initial={{ x: '-120%' }}
                    animate={{ x: '120%' }}
                    transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                <div className="relative flex items-start gap-3">
                  <div className="relative">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-lg"
                      style={{ background: `${a.color}22`, boxShadow: `inset 0 0 0 1px ${a.color}44` }}
                    >
                      {a.emoji}
                    </div>
                    {active && (
                      <motion.span
                        className="absolute inset-0 rounded-lg"
                        style={{ boxShadow: `0 0 0 2px ${a.color}` }}
                        animate={{ opacity: [0.15, 0.7, 0.15] }}
                        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-display text-sm font-bold">{a.name}</p>
                      <StatusDot status={status} color={a.color} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="eyebrow truncate">{a.role}</p>
                      {a.tag && (
                        <span
                          className="rounded-full px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider"
                          style={{ background: `${a.color}18`, color: a.color }}
                        >
                          {a.tag}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/45">{a.blurb}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {a.skills.slice(0, 3).map((s) => (
                        <span key={s} className="chip border-white/10 text-[10px] text-white/55">
                          {s}
                        </span>
                      ))}
                      {brain && (
                        <span
                          className="ml-auto flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-wider text-white/35"
                          title={`This coworker thinks on ${brain.label}`}
                        >
                          <Cpu size={9} /> {brain.provider}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {done && (
                  <motion.div
                    aria-hidden
                    className="absolute bottom-0 left-0 h-0.5"
                    style={{ background: a.color }}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </aside>
  )
}

function StatusDot({ status, color }: { status: string; color: string }) {
  const active = status === 'thinking' || status === 'working'
  const done = status === 'done'
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-medium">
      {active ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: color }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
        </span>
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ background: done ? '#4ade80' : 'rgba(255,255,255,0.25)' }} />
      )}
      <span className="font-mono text-[9px] uppercase tracking-wider text-white/45">{statusLabel[status]}</span>
    </span>
  )
}
