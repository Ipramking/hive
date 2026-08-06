import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, FileText, Sparkles, Radio, Circle, agentIconOf } from './icons'
import { useHive } from '../store'
import { agentIn } from '../data/modes'
import { cn } from '../lib/cn'
import type { Agent, FeedMessage, ModeConfig, Stance } from '../types'

const HEX = 'polygon(50% 1%, 93% 25%, 93% 75%, 50% 99%, 7% 75%, 7% 25%)'

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

function HexAvatar({ agent, size = 32 }: { agent?: Agent; size?: number }) {
  const color = agent?.color ?? '#8891a5'
  const Icon = agent ? agentIconOf(agent) : Circle
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute inset-0" style={{ clipPath: HEX, background: `${color}66` }} />
      <div className="absolute" style={{ inset: 1.5, clipPath: HEX, background: '#0f1219' }} />
      <div className="absolute inset-0 grid place-items-center">
        <Icon size={Math.round(size * 0.46)} strokeWidth={1.9} style={{ color }} />
      </div>
    </div>
  )
}

export function Feed() {
  const mode = useHive((s) => s.activeMode())
  const feed = useHive((s) => s.feed)
  const agentStatus = useHive((s) => s.agentStatus)
  const bottomRef = useRef<HTMLDivElement>(null)

  const thinking = mode.agents.filter((a) => agentStatus[a.id] === 'thinking')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [feed.length, thinking.length])

  if (feed.length === 0) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden px-4 text-center">
        <div className="max-w-[240px]">
          <div className="mx-auto mb-2.5 grid h-10 w-10 place-items-center rounded-full border border-line bg-ink-800">
            <Sparkles size={16} className="text-white/60" />
          </div>
          <p className="font-display text-sm font-bold text-white/80">The floor is quiet.</p>
          <p className="mt-1 text-xs leading-snug text-white/50">Give the room a task and watch your coworkers take it on — together.</p>
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
      {thinking.length > 0 && <TypingRow agents={thinking} />}
      <div ref={bottomRef} />
    </div>
  )
}

function TypingRow({ agents }: { agents: ModeConfig['agents'] }) {
  const shown = agents.slice(0, 3)
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5">
      <div className="flex -space-x-2">
        {shown.map((a) => (
          <HexAvatar key={a.id} agent={a} size={26} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-line bg-ink-800/50 px-3 py-1.5">
        <span className="font-mono text-[10px] text-white/55">
          {shown.map((a) => a.name).join(', ')}
          {agents.length > 3 ? ` +${agents.length - 3}` : ''}
        </span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full bg-white/50"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -1.5, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
      </div>
    </motion.div>
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
        className="mx-auto w-fit rounded-full border border-line bg-ink-800/70 px-3 py-1 text-center font-mono text-[10px] uppercase tracking-wider text-white/55"
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
          className="max-w-[85%] rounded-2xl rounded-br-sm border px-3 py-2 text-[13px] leading-relaxed shadow-[0_6px_18px_-10px_rgba(0,0,0,0.6)]"
          style={{ borderColor: `${mode.accent}66`, background: `${mode.accent}22`, color: '#fff' }}
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
        className="mx-auto flex w-fit max-w-[92%] items-center gap-2 rounded-full border border-white/15 bg-gradient-to-r from-white/[0.08] to-transparent px-3.5 py-1.5"
      >
        <Radio size={13} className="text-white/70" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/55">Lead</span>
        <span className="text-[12.5px] text-white/85">{m.text}</span>
      </motion.div>
    )
  }

  if (m.kind === 'handoff') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 pl-11 text-[11px] italic text-white/50"
      >
        <ArrowRight size={12} style={{ color: agent?.color }} />
        {m.text}
      </motion.div>
    )
  }

  const isArtifact = m.kind === 'artifact'
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
      <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 20 }} className="mt-0.5">
        <HexAvatar agent={agent} size={32} />
      </motion.div>
      <div
        className={cn(
          'min-w-0 flex-1 rounded-xl border px-3 py-2',
          isArtifact ? 'border-emerald-500/30 bg-emerald-500/[0.07]' : 'border-line bg-ink-800/40',
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-sm font-bold" style={{ color: agent?.color }}>
            {agent?.name}
          </span>
          <span className="eyebrow">{agent?.tag ?? agent?.role}</span>

          {m.stance && m.stance !== 'agree' && <StanceChip stance={m.stance} />}

          {target && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
              style={{ borderColor: `${target.color}66`, color: target.color, background: `${target.color}18` }}
            >
              <motion.span className="inline-block" animate={{ x: [0, 3, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}>
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
        <p className={cn('mt-0.5 text-[13px] leading-relaxed', isArtifact ? 'text-emerald-100/90' : 'text-white/80')}>
          {m.text}
        </p>
      </div>
    </motion.div>
  )
}
