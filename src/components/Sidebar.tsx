import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { PanelLeftClose, PanelLeft, Plus, History, Settings, Pencil } from 'lucide-react'
import { useHive } from '../store'
import { alpha } from '../lib/color'
import { cn } from '../lib/cn'

interface Props {
  collapsed: boolean
  onToggle: () => void
  view: 'floor' | 'settings'
  onNewMode: () => void
  onEditMode: () => void
  onHistory: () => void
  onSettings: () => void
  onHome: () => void
}

export function Sidebar({ collapsed, onToggle, view, onNewMode, onEditMode, onHistory, onSettings, onHome }: Props) {
  const modes = useHive((s) => s.modes)
  const activeModeId = useHive((s) => s.activeModeId)
  const setActiveMode = useHive((s) => s.setActiveMode)
  const running = useHive((s) => s.runStatus === 'running')
  const active = useHive((s) => s.activeMode())

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 244 }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className="card flex h-full shrink-0 flex-col overflow-hidden"
    >
      {/* workspace label + collapse */}
      <div className={cn('flex items-center border-b border-line p-3', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && <p className="eyebrow">Workspace</p>}
        <button onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-ink-700 hover:text-white/80" title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* modes */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {!collapsed && <p className="eyebrow px-2 pb-1 pt-2">Modes</p>}
        {modes.map((m) => {
          const on = m.id === activeModeId && view === 'floor'
          return (
            <button
              key={m.id}
              onClick={() => {
                if (running) return
                setActiveMode(m.id)
                onHome()
              }}
              disabled={running}
              title={m.name}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-50',
                on ? 'text-white' : 'text-white/60 hover:bg-ink-800/70 hover:text-white/90',
                collapsed && 'justify-center px-0',
              )}
            >
              {on && (
                <motion.span
                  layoutId="side-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-xl"
                  style={{ background: alpha(m.accent, 0.16), border: `1px solid ${alpha(m.accent, 0.45)}` }}
                />
              )}
              <span className="grid h-6 w-6 shrink-0 place-items-center text-base">{m.emoji}</span>
              {!collapsed && <span className="truncate font-medium">{m.name}</span>}
              {!collapsed && !m.builtIn && <span className="ml-auto font-mono text-[8px] uppercase tracking-wider text-white/30">custom</span>}
            </button>
          )
        })}

        <button
          onClick={onNewMode}
          title="New mode"
          className={cn('mt-1 flex items-center gap-2.5 rounded-xl border border-dashed border-line px-2.5 py-2 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white/80', collapsed && 'justify-center px-0')}
        >
          <Plus size={16} className="shrink-0" />
          {!collapsed && <span>New mode</span>}
        </button>
      </div>

      {/* nav */}
      <div className="border-t border-line p-2">
        <NavItem icon={<Pencil size={16} />} label="Edit this mode" collapsed={collapsed} onClick={onEditMode} />
        <NavItem icon={<History size={16} />} label="History" collapsed={collapsed} onClick={onHistory} />
        <NavItem icon={<Settings size={16} />} label="Settings" collapsed={collapsed} onClick={onSettings} active={view === 'settings'} accent={active.accent} />
      </div>
    </motion.aside>
  )
}

function NavItem({ icon, label, collapsed, onClick, active, accent }: { icon: ReactNode; label: string; collapsed: boolean; onClick: () => void; active?: boolean; accent?: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors',
        active ? 'text-white' : 'text-white/55 hover:bg-ink-800/70 hover:text-white/90',
        collapsed && 'justify-center px-0',
      )}
      style={active && accent ? { background: alpha(accent, 0.14), border: `1px solid ${alpha(accent, 0.4)}` } : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  )
}
