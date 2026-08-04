import { Check } from 'lucide-react'
import { useHive } from '../store'
import { agentIn } from '../data/modes'
import { cn } from '../lib/cn'

export function Pipeline() {
  const mode = useHive((s) => s.activeMode())
  const currentStageId = useHive((s) => s.currentStageId)
  const artifacts = useHive((s) => s.artifacts)
  const doneStageIds = new Set(artifacts.map((a) => a.stageId))

  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
      {mode.stages.map((stage, i) => {
        const owner = agentIn(mode, stage.ownerId)
        const done = doneStageIds.has(stage.id)
        const active = currentStageId === stage.id
        return (
          <div key={stage.id} className="flex items-center gap-1">
            <div
              className={cn(
                'min-w-[136px] rounded-xl border px-3 py-2 transition-all',
                active
                  ? 'border-transparent bg-ink-700'
                  : done
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-line bg-ink-850/50',
              )}
              style={active && owner ? { boxShadow: `0 0 0 1px ${owner.color}77, 0 0 20px ${owner.color}22` } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow">Step {String(i + 1).padStart(2, '0')}</span>
                {done ? (
                  <Check size={13} className="text-emerald-400" />
                ) : active ? (
                  <span className="h-2 w-2 animate-pulseSoft rounded-full" style={{ background: owner?.color }} />
                ) : null}
              </div>
              <p className="mt-1.5 font-display text-sm font-bold leading-tight">{stage.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/45">
                <span>{owner?.emoji}</span>
                {owner?.name}
              </p>
            </div>
            {i < mode.stages.length - 1 && (
              <div className={cn('h-px w-4 shrink-0', done ? 'bg-emerald-500/40' : 'bg-line')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
