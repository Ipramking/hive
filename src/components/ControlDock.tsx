import { useState } from 'react'
import { Play, RotateCcw, Loader2, Sparkles, Zap, Globe, Users, GitBranch, Cpu, SendHorizonal } from 'lucide-react'
import { motion } from 'framer-motion'
import { useHive } from '../store'
import { Feed } from './Feed'
import { roster } from '../engine/brains'
import { alpha } from '../lib/color'
import { cn } from '../lib/cn'

const examplesById: Record<string, string[]> = {
  auto: ['Build a REST API for a todo app', 'Scaffold a landing page for a coffee brand', 'Write a Python script to dedupe a CSV'],
  normal: ['Add a way for users to export their data as CSV', 'Let customers reschedule a booking themselves'],
  hackathon: ['Cut support ticket resolution time for a fintech', 'Help a logistics company predict delivery delays'],
}

export function ControlDock() {
  const mode = useHive((s) => s.activeMode())
  const task = useHive((s) => s.task)
  const setTask = useHive((s) => s.setTask)
  const launch = useHive((s) => s.launch)
  const reset = useHive((s) => s.reset)
  const runStatus = useHive((s) => s.runStatus)
  const runStyle = useHive((s) => s.runStyle)
  const setRunStyle = useHive((s) => s.setRunStyle)
  const activeModeId = useHive((s) => s.activeModeId)
  const round = useHive((s) => s.round)
  const engineName = useHive((s) => s.engineName())
  const webAccess = useHive((s) => s.webAccess)
  const setWebAccess = useHive((s) => s.setWebAccess)
  const running = runStatus === 'running'
  const live = engineName === 'gemini'
  const floor = runStyle === 'floor'
  const accent = mode.accent
  const brains = roster().length
  const examples = examplesById[mode.id] ?? [`Run "${mode.name}" on a real task`]

  return (
    <section className="card flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-line p-4">
        <p className="eyebrow">User input</p>
        <p className="mt-1 font-display text-base font-bold">{mode.name}</p>
        <p className="mt-0.5 text-xs text-white/45">
          {floor ? 'Everyone works at once — talking, handing off, shipping.' : mode.tagline}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <div className={cn('relative flex items-center rounded-full border border-line bg-ink-900/70 p-0.5 font-mono text-[10px] uppercase tracking-wide', activeModeId === 'auto' && 'hidden')}>
            {(['floor', 'relay'] as const).map((s) => (
              <button
                key={s}
                onClick={() => !running && setRunStyle(s)}
                disabled={running}
                className={cn('relative z-10 flex items-center gap-1 rounded-full px-2 py-1 transition-colors', runStyle === s ? 'text-white' : 'text-white/45')}
              >
                {runStyle === s && (
                  <motion.span layoutId="dock-style" transition={{ type: 'spring', stiffness: 400, damping: 32 }} className="absolute inset-0 -z-10 rounded-full" style={{ background: alpha(accent, 0.22), border: `1px solid ${alpha(accent, 0.5)}` }} />
                )}
                {s === 'floor' ? <Users size={11} /> : <GitBranch size={11} />}
                {s}
              </button>
            ))}
          </div>
          <span className={cn('chip font-mono text-[10px] uppercase tracking-wide', live ? 'border-emerald-500/40 text-emerald-300' : 'border-white/10 text-white/45')}>
            {live ? <Zap size={11} /> : <Sparkles size={11} />}
            {live ? 'Live' : 'Offline'}
          </span>
          {floor && (
            <span className="chip border-white/10 font-mono text-[10px] uppercase tracking-wide text-white/50" title="Coworkers run in parallel across this many model keys">
              <Cpu size={11} /> {brains}
            </span>
          )}
          <button
            onClick={() => setWebAccess(!webAccess)}
            disabled={!live || running}
            title={live ? (webAccess ? 'Live web search on' : 'Live web search off') : 'Web search needs the live engine'}
            className={cn('chip font-mono text-[10px] uppercase tracking-wide transition-colors disabled:opacity-40', live && webAccess ? 'border-sky-400/50 text-sky-300' : 'border-white/10 text-white/45 hover:text-white/70')}
          >
            <Globe size={11} />
            {webAccess ? 'Web' : 'No web'}
          </button>
        </div>

        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !running && task.trim()) {
              e.preventDefault()
              launch()
            }
          }}
          disabled={running}
          rows={2}
          placeholder={floor ? 'What should the room go work on?' : 'What should the org go do?'}
          className="mt-3 w-full resize-none rounded-xl border border-line bg-ink-900/70 px-3.5 py-2.5 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-white/25 disabled:opacity-60"
        />

        {runStatus === 'complete' || running ? (
          <button
            onClick={reset}
            disabled={running}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-ink-700 disabled:opacity-50"
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
            {running ? (floor ? `Working · round ${round}` : 'Running…') : 'Clear the floor'}
          </button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={launch}
            disabled={!task.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: accent, boxShadow: `0 0 24px ${alpha(accent, 0.4)}` }}
          >
            <Play size={15} /> {floor ? 'Open the floor' : 'Run the org'}
          </motion.button>
        )}

        {runStatus === 'draft' && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button key={ex} onClick={() => setTask(ex)} className="chip border-white/10 text-[11px] text-white/50 transition-colors hover:border-white/25 hover:text-white/80">
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <p className="eyebrow">Channel</p>
        {running && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/45">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: accent }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            </span>
            live
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        <Feed />
      </div>

      <ChatInput accent={accent} />
    </section>
  )
}

function ChatInput({ accent }: { accent: string }) {
  const postUser = useHive((s) => s.postUser)
  const running = useHive((s) => s.runStatus === 'running')
  const [draft, setDraft] = useState('')
  const send = () => {
    if (!draft.trim()) return
    postUser(draft)
    setDraft('')
  }
  return (
    <div className="border-t border-line p-2.5">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-ink-900/70 px-3 focus-within:border-white/25">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={running ? 'Say something to the room…' : 'Start a run, then chat to steer it'}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white/90 outline-none placeholder:text-white/30"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          title="Send to the room"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-30"
          style={{ color: accent }}
        >
          <SendHorizonal size={16} />
        </button>
      </div>
    </div>
  )
}
