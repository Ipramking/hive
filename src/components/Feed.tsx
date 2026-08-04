import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, FileText, Sparkles } from 'lucide-react'
import { useHive } from '../store'
import { agentIn } from '../data/modes'
import { cn } from '../lib/cn'
import type { FeedMessage, ModeConfig } from '../types'

export function Feed() {
  const mode = useHive((s) => s.activeMode())
  const feed = useHive((s) => s.feed)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [feed.length])

  if (feed.length === 0) {
    return (
      <div className="grid flex-1 place-items-center text-center">
        <div className="max-w-xs px-6">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border border-line bg-ink-800">
            <Sparkles size={18} className="text-white/50" />
          </div>
          <p className="font-display text-base font-bold text-white/75">The floor is quiet.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/40">
            Give the org a task and watch your AI coworkers pick it up, hand off, and ship.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {feed.map((m) => (
          <Row key={m.id} m={m} mode={mode} />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}

function Row({ m, mode }: { m: FeedMessage; mode: ModeConfig }) {
  const agent = m.agentId ? agentIn(mode, m.agentId) : undefined

  if (m.kind === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-fit rounded-full border border-line bg-ink-800/70 px-3 py-1 text-center font-mono text-[10px] uppercase tracking-wider text-white/45"
      >
        {m.text}
      </motion.div>
    )
  }

  if (m.kind === 'handoff') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 pl-11 text-[11px] italic text-white/40"
      >
        <ArrowRight size={12} style={{ color: agent?.color }} />
        {m.text}
      </motion.div>
    )
  }

  const isArtifact = m.kind === 'artifact'
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
      <div
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm"
        style={{ background: `${agent?.color}22`, boxShadow: `inset 0 0 0 1px ${agent?.color}44` }}
      >
        {agent?.emoji}
      </div>
      <div
        className={cn(
          'min-w-0 flex-1 rounded-xl border px-3 py-2',
          isArtifact ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-line bg-ink-800/50',
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold" style={{ color: agent?.color }}>
            {agent?.name}
          </span>
          <span className="eyebrow">{agent?.role}</span>
          {isArtifact && (
            <span className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
              <FileText size={11} /> artifact
            </span>
          )}
        </div>
        <p className={cn('mt-0.5 text-[13px] leading-relaxed', isArtifact ? 'text-emerald-100/90' : 'text-white/75')}>
          {m.text}
        </p>
      </div>
    </motion.div>
  )
}
