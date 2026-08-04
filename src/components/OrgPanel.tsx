import { AnimatePresence, motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { useHive } from '../store'
import { cn } from '../lib/cn'

const statusLabel: Record<string, string> = {
  idle: 'idle',
  thinking: 'thinking…',
  working: 'working…',
  done: 'done',
}

export function OrgPanel({ onEdit }: { onEdit: () => void }) {
  const mode = useHive((s) => s.activeMode())
  const agentStatus = useHive((s) => s.agentStatus)

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
          {mode.agents.map((a) => {
            const status = agentStatus[a.id] ?? 'idle'
            const active = status === 'thinking' || status === 'working'
            return (
              <motion.div
                key={`${mode.id}-${a.id}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className={cn('rounded-xl border border-line bg-ink-800/50 p-3')}
                style={active ? { boxShadow: `0 0 0 1px ${a.color}55, 0 0 22px ${a.color}22` } : undefined}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-lg"
                    style={{ background: `${a.color}22`, boxShadow: `inset 0 0 0 1px ${a.color}44` }}
                  >
                    {a.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-display text-sm font-bold">{a.name}</p>
                      <StatusDot status={status} color={a.color} />
                    </div>
                    <p className="eyebrow truncate">{a.role}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/45">{a.blurb}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.skills.map((s) => (
                        <span key={s} className="chip border-white/10 text-[10px] text-white/55">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
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
      <span
        className={cn('h-2 w-2 rounded-full', active && 'animate-pulseSoft')}
        style={{ background: done ? '#4ade80' : active ? color : 'rgba(255,255,255,0.25)' }}
      />
      <span className="font-mono text-[9px] uppercase tracking-wider text-white/45">{statusLabel[status]}</span>
    </span>
  )
}
