import { Play, RotateCcw, Loader2, Sparkles, Zap, Globe, Users, GitBranch, Cpu } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHive } from '../store'
import { Pipeline } from './Pipeline'
import { Feed } from './Feed'
import { roster } from '../engine/brains'
import { alpha } from '../lib/color'
import { cn } from '../lib/cn'

const examplesById: Record<string, string[]> = {
  normal: [
    'Add a way for users to export their data as CSV',
    'Let customers reschedule a booking themselves',
    'Build an onboarding checklist for new users',
  ],
  hackathon: [
    'Cut support ticket resolution time for a fintech',
    'Help a logistics company predict delivery delays',
    'Reduce no-shows for a healthcare clinic',
  ],
}

export function Workspace() {
  const mode = useHive((s) => s.activeMode())
  const task = useHive((s) => s.task)
  const setTask = useHive((s) => s.setTask)
  const launch = useHive((s) => s.launch)
  const reset = useHive((s) => s.reset)
  const runStatus = useHive((s) => s.runStatus)
  const runStyle = useHive((s) => s.runStyle)
  const setRunStyle = useHive((s) => s.setRunStyle)
  const round = useHive((s) => s.round)
  const agentStatus = useHive((s) => s.agentStatus)
  const engineName = useHive((s) => s.engineName())
  const webAccess = useHive((s) => s.webAccess)
  const setWebAccess = useHive((s) => s.setWebAccess)
  const running = runStatus === 'running'
  const live = engineName === 'gemini'
  const accent = mode.accent
  const floor = runStyle === 'floor'
  const brainCount = roster().length
  const activeNow = Object.values(agentStatus).filter((s) => s === 'thinking' || s === 'working').length
  const examples = examplesById[mode.id] ?? [`Run "${mode.name}" on a real task`, 'Try something specific to your team']

  return (
    <section className="card relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-line p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-base font-bold">{mode.name}</p>

          {/* Relay ⇄ Floor toggle */}
          <div className="relative flex items-center rounded-full border border-line bg-ink-900/70 p-0.5 text-[10px] font-mono uppercase tracking-wide">
            {(['floor', 'relay'] as const).map((s) => (
              <button
                key={s}
                onClick={() => !running && setRunStyle(s)}
                disabled={running}
                className={cn('relative z-10 flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors', runStyle === s ? 'text-white' : 'text-white/45')}
              >
                {runStyle === s && (
                  <motion.span
                    layoutId="style-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-full"
                    style={{ background: alpha(accent, 0.22), border: `1px solid ${alpha(accent, 0.5)}` }}
                  />
                )}
                {s === 'floor' ? <Users size={11} /> : <GitBranch size={11} />}
                {s}
              </button>
            ))}
          </div>

          <span
            className={cn('chip font-mono text-[10px] uppercase tracking-wide', live ? 'border-emerald-500/40 text-emerald-300' : 'border-white/10 text-white/45')}
          >
            {live ? <Zap size={11} /> : <Sparkles size={11} />}
            {live ? 'Live' : 'Offline'}
          </span>

          {floor && (
            <span className="chip font-mono text-[10px] uppercase tracking-wide border-white/10 text-white/50" title="Coworkers run in parallel across this many model keys">
              <Cpu size={11} /> {brainCount} brains
            </span>
          )}

          <button
            onClick={() => setWebAccess(!webAccess)}
            disabled={!live || running}
            title={live ? (webAccess ? 'Live web search on' : 'Live web search off') : 'Web search needs the live engine'}
            className={cn(
              'chip font-mono text-[10px] uppercase tracking-wide transition-colors disabled:opacity-40',
              live && webAccess ? 'border-sky-400/50 text-sky-300' : 'border-white/10 text-white/45 hover:text-white/70',
            )}
          >
            <Globe size={11} />
            {webAccess ? 'Web on' : 'Web off'}
          </button>
        </div>
        <p className="mt-1 text-xs text-white/45">
          {floor ? 'Everyone works the same task at once — talking, handing off, shipping live.' : mode.tagline}
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !running && task.trim() && launch()}
            disabled={running}
            placeholder={floor ? 'What should the room go work on?' : 'What should the org go do?'}
            className="min-w-0 flex-1 rounded-xl border border-line bg-ink-900/70 px-3.5 py-2.5 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-white/25 disabled:opacity-60"
          />
          {runStatus === 'complete' || running ? (
            <button
              onClick={reset}
              disabled={running}
              className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-ink-700 disabled:opacity-50"
            >
              {running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              {running ? (floor ? `Round ${round}` : 'Running') : 'Reset'}
            </button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={launch}
              disabled={!task.trim()}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: accent, boxShadow: `0 0 24px ${alpha(accent, 0.4)}` }}
            >
              <Play size={15} /> {floor ? 'Open the floor' : 'Run the org'}
            </motion.button>
          )}
        </div>

        {runStatus === 'draft' && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setTask(ex)}
                className="chip border-white/10 text-[11px] text-white/50 transition-colors hover:border-white/25 hover:text-white/80"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* relay shows the stage pipeline; floor shows a live room strip */}
      {floor ? (
        <AnimatePresence>
          {running && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-line"
            >
              <div className="flex items-center gap-3 px-4 py-2.5">
                <span className="eyebrow">Round {round}</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: accent }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: accent }} />
                  </span>
                  <span className="font-mono text-[11px] text-white/55">{activeNow} working now</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className="border-b border-line px-4 py-3">
          <Pipeline />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <Feed />
      </div>
    </section>
  )
}
