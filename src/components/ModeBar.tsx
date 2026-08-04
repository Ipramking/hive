import { motion } from 'framer-motion'
import { History, Plus, Settings } from 'lucide-react'
import { useHive } from '../store'
import { alpha } from '../lib/color'
import { cn } from '../lib/cn'

export function ModeBar({
  onNew,
  onSettings,
  onHistory,
}: {
  onNew: () => void
  onSettings: () => void
  onHistory: () => void
}) {
  const modes = useHive((s) => s.modes)
  const activeModeId = useHive((s) => s.activeModeId)
  const setActiveMode = useHive((s) => s.setActiveMode)
  const running = useHive((s) => s.runStatus === 'running')

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'flex items-center gap-1 overflow-x-auto rounded-full border border-line bg-ink-900/80 p-1',
          running && 'pointer-events-none opacity-60',
        )}
      >
        {modes.map((m) => {
          const active = m.id === activeModeId
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={cn(
                'relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                active ? 'text-white' : 'text-white/55 hover:text-white/80',
              )}
            >
              {active && (
                <motion.span
                  layoutId="mode-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 -z-10 rounded-full"
                  style={{
                    background: alpha(m.accent, 0.18),
                    boxShadow: `0 0 22px ${alpha(m.accent, 0.4)}`,
                    border: `1px solid ${alpha(m.accent, 0.5)}`,
                  }}
                />
              )}
              <span>{m.emoji}</span>
              {m.name}
            </button>
          )
        })}
      </div>

      <button
        onClick={onNew}
        title="New mode"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-white/60 transition-colors hover:bg-ink-700 hover:text-white"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={onHistory}
        title="Run history"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-white/60 transition-colors hover:bg-ink-700 hover:text-white"
      >
        <History size={16} />
      </button>
      <button
        onClick={onSettings}
        title="Settings"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-white/60 transition-colors hover:bg-ink-700 hover:text-white"
      >
        <Settings size={16} />
      </button>
    </div>
  )
}
