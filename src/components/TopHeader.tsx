import { motion } from 'framer-motion'
import { Menu, Hexagon, Zap, Sparkles, Cpu } from 'lucide-react'
import { useHive } from '../store'
import { roster } from '../engine/brains'
import { alpha } from '../lib/color'
import { cn } from '../lib/cn'

export function TopHeader({ onMenu }: { onMenu: () => void }) {
  const mode = useHive((s) => s.activeMode())
  const engineName = useHive((s) => s.engineName())
  const running = useHive((s) => s.runStatus === 'running')
  const live = engineName === 'gemini'
  const brains = roster().length

  return (
    <header className="card flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
      <button onClick={onMenu} className="btn-icon lg:hidden" title="Menu">
        <Menu size={18} />
      </button>

      <motion.div
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line"
        style={{ background: alpha(mode.accent, 0.16) }}
        animate={{ boxShadow: [`0 0 14px ${alpha(mode.accent, 0.2)}`, `0 0 26px ${alpha(mode.accent, 0.4)}`, `0 0 14px ${alpha(mode.accent, 0.2)}`] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div animate={{ rotate: running ? 360 : 0 }} transition={{ duration: 8, repeat: running ? Infinity : 0, ease: 'linear' }}>
          <Hexagon size={19} style={{ color: mode.accent }} strokeWidth={2.4} />
        </motion.div>
      </motion.div>

      <div className="min-w-0">
        <h1 className="font-display text-lg font-extrabold leading-none tracking-tight sm:text-xl">The Hive</h1>
        <p className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.22em] sm:block" style={{ color: mode.accent }}>
          Connect · Collaborate · Create
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-white/60 sm:flex">
          {mode.emoji} {mode.name}
        </span>
        <span className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide', live ? 'border-emerald-500/40 text-emerald-300' : 'border-white/10 text-white/45')}>
          {live ? <Zap size={11} /> : <Sparkles size={11} />}
          {live ? 'Live' : 'Offline'}
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-white/55 md:flex" title="Model brains working in parallel">
          <Cpu size={11} /> {brains}
        </span>
      </div>
    </header>
  )
}
