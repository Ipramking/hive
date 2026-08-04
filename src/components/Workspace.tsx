import { Play, RotateCcw, Loader2, Sparkles, Zap, Globe } from 'lucide-react'
import { useHive } from '../store'
import { Pipeline } from './Pipeline'
import { Feed } from './Feed'
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
  const run = useHive((s) => s.run)
  const reset = useHive((s) => s.reset)
  const runStatus = useHive((s) => s.runStatus)
  const engineName = useHive((s) => s.engineName())
  const webAccess = useHive((s) => s.webAccess)
  const setWebAccess = useHive((s) => s.setWebAccess)
  const running = runStatus === 'running'
  const live = engineName === 'gemini'
  const accent = mode.accent
  const examples = examplesById[mode.id] ?? [
    `Run "${mode.name}" on a real task`,
    'Try something specific to your team',
  ]

  return (
    <section className="card flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-line p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-base font-bold">{mode.name}</p>
          <span
            className="chip font-mono text-[10px] uppercase tracking-wide"
            style={{ borderColor: alpha(accent, 0.4), color: accent }}
          >
            {mode.emoji} {mode.stages.length}-step
          </span>
          <span
            className={cn(
              'chip font-mono text-[10px] uppercase tracking-wide',
              live ? 'border-emerald-500/40 text-emerald-300' : 'border-white/10 text-white/45',
            )}
          >
            {live ? <Zap size={11} /> : <Sparkles size={11} />}
            {live ? 'Live Gemini' : 'Offline'}
          </span>
          <button
            onClick={() => setWebAccess(!webAccess)}
            disabled={!live || running}
            title={
              live
                ? webAccess
                  ? 'Live web search on — coworkers ground answers in current data'
                  : 'Live web search off — click to let coworkers search the web'
                : 'Web search needs the live Gemini engine'
            }
            className={cn(
              'chip font-mono text-[10px] uppercase tracking-wide transition-colors disabled:opacity-40',
              live && webAccess ? 'border-sky-400/50 text-sky-300' : 'border-white/10 text-white/45 hover:text-white/70',
            )}
          >
            <Globe size={11} />
            {webAccess ? 'Web on' : 'Web off'}
          </button>
        </div>
        <p className="mt-1 text-xs text-white/45">{mode.tagline}</p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !running && task.trim() && run()}
            disabled={running}
            placeholder="What should the org go do?"
            className="min-w-0 flex-1 rounded-xl border border-line bg-ink-900/70 px-3.5 py-2.5 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-white/25 disabled:opacity-60"
          />
          {runStatus === 'complete' || running ? (
            <button
              onClick={reset}
              disabled={running}
              className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-ink-700 disabled:opacity-50"
            >
              {running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              {running ? 'Running' : 'Reset'}
            </button>
          ) : (
            <button
              onClick={run}
              disabled={!task.trim()}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: accent, boxShadow: `0 0 24px ${alpha(accent, 0.4)}` }}
            >
              <Play size={15} /> Run the org
            </button>
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

      <div className="border-b border-line px-4 py-3">
        <Pipeline />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <Feed />
      </div>
    </section>
  )
}
