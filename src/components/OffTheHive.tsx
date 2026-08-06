import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ClipboardCopy, Download, FileText, FileCode2, FileDown, FolderDown, Globe, Eye, X } from './icons'
import { useHive } from '../store'
import { agentIn } from '../data/modes'
import { downloadProject } from '../lib/exportProject'
import { downloadPdf } from '../lib/exportPdf'
import { buildPreviewDoc, hasViewableSite } from '../lib/preview'
import { PreviewModal } from './PreviewModal'
import type { Artifact } from '../types'

export function OffTheHive() {
  const mode = useHive((s) => s.activeMode())
  const artifacts = useHive((s) => s.artifacts)
  const exportMarkdown = useHive((s) => s.exportMarkdown)
  const currentRun = useHive((s) => s.currentRun)
  const lastRanTask = useHive((s) => s.lastRanTask)
  const [open, setOpen] = useState<Artifact | null>(null)
  const [previewDoc, setPreviewDoc] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const codeCount = artifacts.filter((a) => a.kind === 'code').length
  const canPreview = hasViewableSite(artifacts)

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
    <div className="card flex items-center gap-3 px-3 py-2.5">
      <div className="flex shrink-0 flex-col leading-none">
        <p className="eyebrow">Off the hive</p>
        <p className="mt-1 font-display text-sm font-bold">
          {artifacts.length} shipped{codeCount > 0 ? ` · ${codeCount} files` : ''}
        </p>
      </div>

      <div className="h-9 w-px bg-line" />

      {artifacts.length === 0 ? (
        <p className="text-xs text-white/50">Finished work lands here as the hive ships it.</p>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5">
          <AnimatePresence initial={false}>
            {artifacts.map((a) => {
              const agent = agentIn(mode, a.agentId)
              const isCode = a.kind === 'code'
              return (
                <motion.button
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: -8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  onClick={() => setOpen(a)}
                  className="paper flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left shadow-[0_4px_14px_-6px_rgba(0,0,0,0.5)]"
                  style={{ borderTop: `3px solid ${agent?.color}` }}
                  title={`${a.filename || a.title} — ${agent?.name}`}
                >
                  {isCode ? <FileCode2 size={12} className="text-paper-soft" /> : <FileText size={12} className="text-paper-soft" />}
                  <span className={isCode ? 'max-w-[200px] truncate font-mono text-[11.5px] font-semibold text-paper-ink' : 'max-w-[180px] truncate font-display text-[12.5px] font-bold text-paper-ink'}>
                    {isCode ? a.filename || a.title : a.title}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-paper-soft">{agent?.name}</span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {artifacts.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5">
          {canPreview && (
            <button
              onClick={() => setPreviewDoc(buildPreviewDoc(artifacts))}
              title="View the site the hive built"
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-mono text-xs font-semibold uppercase tracking-wide text-black transition-all hover:brightness-110"
              style={{ background: mode.accent, boxShadow: `0 0 20px ${mode.accent}55` }}
            >
              <Eye size={14} /> Preview
            </button>
          )}
          {codeCount > 0 && (
            <button
              onClick={() => downloadProject(currentRun())}
              title="Download the whole project as a .zip"
              className="flex h-9 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors"
              style={{ borderColor: `${mode.accent}66`, color: mode.accent }}
            >
              <FolderDown size={14} /> Project
            </button>
          )}
          <button onClick={copyAll} title="Copy all as Markdown" className="btn-icon">
            {copied ? <Check size={15} className="text-emerald-400" /> : <ClipboardCopy size={15} />}
          </button>
          <button onClick={download} title="Download as Markdown (.md)" className="btn-icon">
            <Download size={15} />
          </button>
          <button onClick={() => downloadPdf(currentRun())} title="Download as PDF" className="btn-icon">
            <FileDown size={15} />
          </button>
        </div>
      )}

      {/* reader */}
      <AnimatePresence>
        {open && <Reader artifact={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>

      {/* live site preview */}
      <AnimatePresence>
        {previewDoc && <PreviewModal srcDoc={previewDoc} accent={mode.accent} onClose={() => setPreviewDoc(null)} />}
      </AnimatePresence>
    </div>
  )
}

function Reader({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  const mode = useHive((s) => s.activeMode())
  const agent = agentIn(mode, artifact.agentId)
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, rotate: -0.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="paper max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg shadow-2xl"
        style={{ borderTop: `4px solid ${agent?.color}` }}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper-soft">{agent?.name} · {agent?.role}</p>
            {artifact.kind === 'code' && artifact.filename ? (
              <h3 className="mt-1 truncate font-mono text-base font-bold text-paper-ink">{artifact.filename}</h3>
            ) : (
              <h3 className="mt-1 font-display text-lg font-extrabold text-paper-ink">{artifact.title}</h3>
            )}
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-paper-soft transition-colors hover:bg-black/5">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[58vh] overflow-y-auto px-5 pb-5 pt-3">
          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-[1.75] text-paper-ink/85">{artifact.body}</pre>
          {artifact.sources && artifact.sources.length > 0 && (
            <div className="mt-4 border-t border-paper-line pt-3">
              <p className="mb-1.5 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-paper-soft">
                <Globe size={10} /> Sourced live from the web
              </p>
              <ul className="space-y-1">
                {artifact.sources.map((s) => (
                  <li key={s.uri}>
                    <a href={s.uri} target="_blank" rel="noreferrer" className="block truncate text-[11px] text-paper-ink/70 underline decoration-paper-ink/25 underline-offset-2 hover:text-paper-ink" title={s.uri}>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
