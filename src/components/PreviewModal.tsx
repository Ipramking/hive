import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, ExternalLink, Globe } from './icons'

const WIDTHS = { Desktop: '100%', Tablet: '820px', Phone: '390px' } as const
type Device = keyof typeof WIDTHS

/** Renders an assembled HTML site in a sandboxed iframe — a live preview of what the hive built. */
export function PreviewModal({ srcDoc, accent, onClose }: { srcDoc: string; accent: string; onClose: () => void }) {
  const [device, setDevice] = useState<Device>('Desktop')

  const openTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="card flex h-[86vh] w-full max-w-5xl flex-col overflow-hidden"
      >
        {/* browser chrome */}
        <div className="flex items-center gap-3 border-b border-line px-3 py-2">
          <div className="flex items-center gap-1.5 pl-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <div className="inset flex flex-1 items-center gap-2 px-3 py-1.5">
            <Globe size={12} style={{ color: accent }} />
            <span className="font-mono text-[11px] text-steel">preview · localhost</span>
          </div>
          <div className="hidden items-center rounded-md border border-line p-0.5 font-mono text-[10px] uppercase tracking-wide sm:flex">
            {(Object.keys(WIDTHS) as Device[]).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={device === d ? 'rounded px-2 py-1 text-black' : 'px-2 py-1 text-steel'}
                style={device === d ? { background: accent } : undefined}
              >
                {d}
              </button>
            ))}
          </div>
          <button onClick={openTab} className="btn-icon" title="Open in a new tab">
            <ExternalLink size={15} />
          </button>
          <button onClick={onClose} className="btn-icon" title="Close preview">
            <X size={16} />
          </button>
        </div>

        {/* the site */}
        <div className="grid flex-1 place-items-center overflow-auto bg-ink-950/60 p-3">
          <iframe
            title="Site preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-forms allow-popups allow-modals"
            className="h-full rounded-lg border border-line bg-white shadow-2xl transition-all"
            style={{ width: WIDTHS[device] }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
