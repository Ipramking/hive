import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Hexagon } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { HiveRing } from './components/HiveRing'
import { ControlDock } from './components/ControlDock'
import { OffTheHive } from './components/OffTheHive'
import { SettingsPage } from './components/SettingsPage'
import { ModeEditor } from './components/ModeEditor'
import { HistoryModal } from './components/HistoryModal'
import { LiquidBackground } from './components/LiquidBackground'
import { useHive } from './store'
import { alpha } from './lib/color'
import type { ModeConfig } from './types'

export default function App() {
  const mode = useHive((s) => s.activeMode())
  const running = useHive((s) => s.runStatus === 'running')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [view, setView] = useState<'floor' | 'settings'>('floor')
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
  // wrap sidebar actions so they also close the mobile drawer
  const closeNav = () => setMobileNav(false)
  const sidebarProps = {
    view,
    onNewMode: () => { closeNav(); openNew() },
    onEditMode: () => { closeNav(); openEdit() },
    onHistory: () => { closeNav(); setHistoryOpen(true) },
    onSettings: () => { closeNav(); setView('settings') },
    onHome: () => { closeNav(); setView('floor') },
  }

  return (
    <div
      className="mx-auto flex h-full max-w-[1600px] gap-3 p-3 sm:p-4"
      style={{ '--accent': mode.accent } as CSSProperties}
    >
      <LiquidBackground accent={mode.accent} active={running} />

      {/* desktop sidebar */}
      <div className="hidden h-full lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} {...sidebarProps} />
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeNav}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 p-3 lg:hidden"
              initial={{ x: '-105%' }}
              animate={{ x: 0 }}
              exit={{ x: '-105%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <Sidebar collapsed={false} onToggle={closeNav} {...sidebarProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col gap-3">
        {/* mobile top bar */}
        <div className="card flex items-center gap-3 px-3 py-2.5 lg:hidden">
          <button onClick={() => setMobileNav(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-white/70" title="Menu">
            <Menu size={18} />
          </button>
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-line" style={{ background: alpha(mode.accent, 0.14) }}>
            <Hexagon size={15} style={{ color: mode.accent }} strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg font-extrabold leading-none">Hive</span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-white/40">{mode.emoji} {mode.name}</span>
        </div>

        {view === 'settings' ? (
          <SettingsPage />
        ) : (
          <>
            <OffTheHive />
            <div className="flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
              <div className="card min-h-[46vh] p-4 lg:min-h-0">
                <HiveRing />
              </div>
              <div className="min-h-0 flex-1 lg:flex-none">
                <ControlDock />
              </div>
            </div>
          </>
        )}
      </main>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <ModeEditor open={editorOpen} onClose={() => setEditorOpen(false)} editing={editing} />
    </div>
  )
}
