import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { TopHeader } from './components/TopHeader'
import { HiveRing } from './components/HiveRing'
import { ControlDock } from './components/ControlDock'
import { OffTheHive } from './components/OffTheHive'
import { SettingsPage } from './components/SettingsPage'
import { ModeEditor } from './components/ModeEditor'
import { HistoryModal } from './components/HistoryModal'
import { HiveBackdrop } from './components/HiveBackdrop'
import { useHive } from './store'
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
      className="mx-auto flex h-full max-w-[1640px] flex-col gap-3 p-3 sm:p-4"
      style={{ '--accent': mode.accent } as CSSProperties}
    >
      <HiveBackdrop accent={mode.accent} active={running} />

      <TopHeader onMenu={() => setMobileNav(true)} />

      <div className="flex min-h-0 flex-1 gap-3">
        {/* desktop sidebar */}
        <div className="hidden h-full lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} {...sidebarProps} />
        </div>

        {/* mobile drawer */}
        <AnimatePresence>
          {mobileNav && (
            <>
              <motion.div className="fixed inset-0 z-40 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeNav} />
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
      </div>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <ModeEditor open={editorOpen} onClose={() => setEditorOpen(false)} editing={editing} />
    </div>
  )
}
