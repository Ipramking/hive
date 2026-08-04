import { useState, type CSSProperties } from 'react'
import { Hexagon } from 'lucide-react'
import { ModeBar } from './components/ModeBar'
import { OrgPanel } from './components/OrgPanel'
import { Workspace } from './components/Workspace'
import { Artifacts } from './components/Artifacts'
import { SettingsModal } from './components/SettingsModal'
import { ModeEditor } from './components/ModeEditor'
import { HistoryModal } from './components/HistoryModal'
import { useHive } from './store'
import { alpha } from './lib/color'
import type { ModeConfig } from './types'

export default function App() {
  const mode = useHive((s) => s.activeMode())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ModeConfig | null>(null)

  const openNew = () => {
    setEditing(null)
    setEditorOpen(true)
  }
  const openEdit = () => {
    setEditing(mode)
    setEditorOpen(true)
  }

  return (
    <div
      className="mx-auto flex h-full max-w-[1500px] flex-col px-4 py-4 sm:px-6"
      style={{ '--accent': mode.accent } as CSSProperties}
    >
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="relative grid h-11 w-11 place-items-center rounded-xl border border-line"
            style={{ background: alpha(mode.accent, 0.14), boxShadow: `0 0 28px ${alpha(mode.accent, 0.22)}` }}
          >
            <Hexagon size={20} style={{ color: mode.accent }} strokeWidth={2.25} />
            <span
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{ background: mode.accent, boxShadow: `0 0 10px ${mode.accent}` }}
            />
          </div>
          <div>
            <p className="eyebrow mb-0.5">AI coworkers · at work</p>
            <h1 className="font-display text-2xl font-extrabold leading-none tracking-tight">Hive</h1>
          </div>
        </div>
        <ModeBar onNew={openNew} onSettings={() => setSettingsOpen(true)} onHistory={() => setHistoryOpen(true)} />
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="hidden min-h-0 lg:block">
          <OrgPanel onEdit={openEdit} />
        </div>
        <div className="min-h-0">
          <Workspace />
        </div>
        <div className="hidden min-h-0 lg:block">
          <Artifacts />
        </div>
      </main>

      <footer className="mt-3 text-center text-[11px] text-white/30">
        {mode.builtIn ? 'Built-in mode' : 'Custom mode'} · runs offline or on live Gemini · deliverables export to Markdown
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <ModeEditor open={editorOpen} onClose={() => setEditorOpen(false)} editing={editing} />
    </div>
  )
}
