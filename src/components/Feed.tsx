import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, FileText, Sparkles, Radio } from 'lucide-react'
import { useHive } from '../store'
import { agentIn } from '../data/modes'
import { cn } from '../lib/cn'
import type { FeedMessage, ModeConfig, Stance } from '../types'

const STANCE: Record<Stance, { label: string; cls: string }> = {
  challenge: { label: 'pushes back', cls: 'border-amber-400/50 text-amber-300' },
  build: { label: 'builds on', cls: 'border-sky-400/50 text-sky-300' },
  ask: { label: 'asks', cls: 'border-violet-400/50 text-violet-300' },
  agree: { label: 'agrees', cls: 'border-emerald-400/50 text-emerald-300' },
}

function StanceChip({ stance }: { stance: Stance }) {
  const s = STANCE[stance]
  return <span className={`rounded-full border px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider ${s.cls}`}>{s.label}</span>
}

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
            Give the room a task and watch your AI coworkers pick it up, talk it through, hand off, and ship — all at once.
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
  const target = m.to ? agentIn(mode, m.to) : undefined

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

  // the human speaking into the room
  if (m.kind === 'user') {
    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-br-sm border px-3 py-2 text-[13px] leading-relaxed"
          style={{ borderColor: `${mode.accent}55`, background: `${mode.accent}1a`, color: '#fff' }}
        >
          <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider" style={{ color: mode.accent }}>You</span>
          {m.text}
        </div>
      </motion.div>
    )
  }

  // Team lead / manager voice
  if (m.kind === 'manager') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="mx-auto flex w-fit max-w-[90%] items-center gap-2 rounded-full border border-white/15 bg-gradient-to-r from-white/[0.06] to-transparent px-3.5 py-1.5"
      >
        <Radio size={13} className="text-white/70" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">Lead</span>
        <span className="text-[12.5px] text-white/80">{m.text}</span>
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
      <motion.div
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm"
        style={{ background: `${agent?.color}22`, boxShadow: `inset 0 0 0 1px ${agent?.color}44` }}
        initial={{ scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
      >
        {agent?.emoji}
      </motion.div>
      <div
        className={cn(
          'min-w-0 flex-1 rounded-xl border px-3 py-2',
          isArtifact ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-line bg-ink-800/50',
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-sm font-bold" style={{ color: agent?.color }}>
            {agent?.name}
          </span>
          <span className="eyebrow">{agent?.tag ?? agent?.role}</span>

          {m.stance && m.stance !== 'agree' && <StanceChip stance={m.stance} />}

          {/* the "passing to" cross-talk detail — a live pulsing handoff */}
          {target && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
              style={{ borderColor: `${target.color}55`, color: target.color, background: `${target.color}12` }}
            >
              <motion.span
                className="inline-block"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight size={9} />
              </motion.span>
              {target.name}
            </motion.span>
          )}

          {isArtifact && (
            <span className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
              <FileText size={11} /> shipped
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
