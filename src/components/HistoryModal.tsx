import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Trash2, Clock, ChevronDown, modeIconById } from './icons'
import { Modal } from './Modal'
import { useHive } from '../store'
import { downloadRun } from '../lib/exportRun'
import { alpha } from '../lib/color'
import type { RunRecord } from '../types'

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function HistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const history = useHive((s) => s.history)
  const clearHistory = useHive((s) => s.clearHistory)

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Run history"
      subtitle={history.length ? `${history.length} saved run${history.length > 1 ? 's' : ''}` : undefined}
      footer={
        history.length > 0 ? (
          <div className="flex justify-between">
            <button onClick={clearHistory} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10">
              <Trash2 size={14} /> Clear all
            </button>
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm text-white/70 hover:bg-ink-700">
              Close
            </button>
          </div>
        ) : undefined
      }
    >
      {history.length === 0 ? (
        <div className="grid place-items-center py-10 text-center">
          <Clock size={22} className="mb-2 text-white/30" />
          <p className="text-sm text-white/60">No runs yet.</p>
          <p className="mt-1 text-xs text-white/35">Completed runs are saved here automatically — offline or live.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((r) => (
            <HistoryRow key={r.id} r={r} />
          ))}
        </div>
      )}
    </Modal>
  )
}

function HistoryRow({ r }: { r: RunRecord }) {
  const [open, setOpen] = useState(false)
  const deleteRun = useHive((s) => s.deleteRun)

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-800/40">
      <div className="flex items-center gap-2 p-2.5">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ background: alpha(r.accent, 0.18), boxShadow: `inset 0 0 0 1px ${alpha(r.accent, 0.4)}` }}
          >
            {(() => {
              const I = modeIconById(r.modeId)
              return <I size={15} strokeWidth={1.9} style={{ color: r.accent }} />
            })()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{r.task || '(untitled run)'}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-white/45">
              <span style={{ color: r.accent }}>{r.modeName}</span>
              <span>·</span>
              <span>{r.artifacts.length} deliverables</span>
              <span>·</span>
              <span>{r.engineName === 'gemini' ? 'live' : 'offline'}</span>
              <span>·</span>
              <span>{timeAgo(r.ts)}</span>
            </p>
          </div>
          <ChevronDown size={15} className={`shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={() => downloadRun(r)}
          title="Download as Markdown"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-white/60 hover:bg-ink-700"
        >
          <Download size={14} />
        </button>
        <button
          onClick={() => deleteRun(r.id)}
          title="Delete run"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-white/40 hover:text-red-300"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line"
          >
            <div className="space-y-2 p-2.5">
              {r.artifacts.map((a, i) => (
                <div key={i} className="rounded-lg border border-line bg-ink-900/50 p-2.5">
                  <p className="text-xs font-semibold" style={{ color: r.accent }}>
                    {a.title} <span className="font-normal text-white/40">· {a.agentName}</span>
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white/60">{a.body}</pre>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
