import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ClipboardCopy, Download, FileText, Globe } from 'lucide-react'
import { useHive } from '../store'
import { agentIn } from '../data/modes'
import type { ModeConfig, Source } from '../types'

export function Artifacts() {
  const mode = useHive((s) => s.activeMode())
  const artifacts = useHive((s) => s.artifacts)
  const exportMarkdown = useHive((s) => s.exportMarkdown)
  const lastRanTask = useHive((s) => s.lastRanTask)
  const [copied, setCopied] = useState(false)

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const download = () => {
    const blob = new Blob([exportMarkdown()], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slug = (lastRanTask || mode.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    a.href = url
    a.download = `hive-${slug || 'run'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <aside className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="eyebrow">Off the line</p>
          <p className="mt-1 font-display text-sm font-bold">
            {artifacts.length}/{mode.stages.length} delivered
          </p>
        </div>
        {artifacts.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={copyAll}
              title="Copy all as Markdown"
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-white/70 transition-colors hover:bg-ink-700"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <ClipboardCopy size={14} />}
            </button>
            <button
              onClick={download}
              title="Download as Markdown"
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-white/70 transition-colors hover:bg-ink-700"
            >
              <Download size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {artifacts.length === 0 ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <p className="text-xs text-white/35">Each coworker drops a deliverable here as they finish their step.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {artifacts.map((a) => (
              <ArtifactCard key={a.id} title={a.title} body={a.body} agentId={a.agentId} sources={a.sources} mode={mode} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </aside>
  )
}

function ArtifactCard({
  title,
  body,
  agentId,
  sources,
  mode,
}: {
  title: string
  body: string
  agentId: string
  sources?: Source[]
  mode: ModeConfig
}) {
  const [open, setOpen] = useState(true)
  const agent = agentIn(mode, agentId)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, rotate: -0.6 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      className="paper overflow-hidden rounded-md shadow-[0_6px_18px_-8px_rgba(0,0,0,0.55)]"
      style={{ borderTop: `3px solid ${agent?.color}` }}
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3.5 pt-2.5 text-left">
        <FileText size={13} className="text-paper-soft" />
        <span className="flex-1 font-display text-sm font-bold text-paper-ink">{title}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-paper-soft">{agent?.name}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden whitespace-pre-wrap px-3.5 pb-3.5 pt-2 font-mono text-[11.5px] leading-[1.75] text-paper-ink/80"
          >
            {body}
          </motion.pre>
        )}
      </AnimatePresence>
      {open && sources && sources.length > 0 && (
        <div className="border-t border-paper-line px-3.5 pb-3 pt-2">
          <p className="mb-1.5 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-paper-soft">
            <Globe size={10} /> Sourced live from the web
          </p>
          <ul className="space-y-1">
            {sources.map((s) => (
              <li key={s.uri}>
                <a
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-[11px] text-paper-ink/70 underline decoration-paper-ink/25 underline-offset-2 hover:text-paper-ink"
                  title={s.uri}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
