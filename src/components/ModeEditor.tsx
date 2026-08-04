import { useEffect, useState, type ReactNode } from 'react'
import { Plus, Trash2, Users, ListChecks } from 'lucide-react'
import { Modal } from './Modal'
import { useHive } from '../store'
import type { Agent, ModeConfig, Stage } from '../types'
import { alpha } from '../lib/color'

const ACCENTS = ['#6d7cff', '#ff7a45', '#3fd0c9', '#ff7ab6', '#f5c451', '#8b5cf6', '#22c55e', '#ef4444']
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`

function blankAgent(color: string): Agent {
  return { id: uid('a'), name: '', role: '', emoji: '🤖', color, blurb: '', skills: [] }
}
function blankStage(ownerId: string): Stage {
  return { id: uid('s'), title: '', ownerId, goal: '', produces: '' }
}

function emptyMode(): ModeConfig {
  const color = ACCENTS[0]
  const a1 = { ...blankAgent(color), name: 'Lead', role: 'Coordinator', emoji: '🧭' }
  return {
    id: uid('mode'),
    name: '',
    emoji: '✨',
    accent: color,
    tagline: '',
    agents: [a1],
    stages: [{ ...blankStage(a1.id), title: 'Kick off', goal: 'Frame the work', produces: 'Brief' }],
  }
}

export function ModeEditor({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: ModeConfig | null
}) {
  const upsertMode = useHive((s) => s.upsertMode)
  const deleteMode = useHive((s) => s.deleteMode)
  const [draft, setDraft] = useState<ModeConfig>(emptyMode())
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setDraft(editing ? structuredClone(editing) : emptyMode())
      setError('')
    }
  }, [open, editing])

  const set = (patch: Partial<ModeConfig>) => setDraft((d) => ({ ...d, ...patch }))
  const setAgent = (id: string, patch: Partial<Agent>) =>
    setDraft((d) => ({ ...d, agents: d.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)) }))
  const setStage = (id: string, patch: Partial<Stage>) =>
    setDraft((d) => ({ ...d, stages: d.stages.map((s) => (s.id === id ? { ...s, ...patch } : s)) }))

  const addAgent = () => setDraft((d) => ({ ...d, agents: [...d.agents, blankAgent(d.accent)] }))
  const removeAgent = (id: string) =>
    setDraft((d) => {
      const agents = d.agents.filter((a) => a.id !== id)
      const fallback = agents[0]?.id ?? ''
      const stages = d.stages.map((s) => (s.ownerId === id ? { ...s, ownerId: fallback } : s))
      return { ...d, agents, stages }
    })
  const addStage = () => setDraft((d) => ({ ...d, stages: [...d.stages, blankStage(d.agents[0]?.id ?? '')] }))
  const removeStage = (id: string) => setDraft((d) => ({ ...d, stages: d.stages.filter((s) => s.id !== id) }))

  const save = () => {
    const clean: ModeConfig = {
      ...draft,
      name: draft.name.trim(),
      tagline: draft.tagline.trim() || `A ${draft.agents.length}-agent workflow.`,
      emoji: draft.emoji.trim() || '✨',
      agents: draft.agents.map((a) => ({
        ...a,
        name: a.name.trim() || 'Agent',
        role: a.role.trim() || 'Coworker',
        emoji: a.emoji.trim() || '🤖',
        blurb: a.blurb.trim() || 'Does their part of the workflow.',
        skills: (a.skills ?? []).map((s) => s.trim()).filter(Boolean),
      })),
      stages: draft.stages.map((s) => ({
        ...s,
        title: s.title.trim() || 'Step',
        goal: s.goal.trim() || 'Move the work forward',
        produces: s.produces.trim() || 'Output',
        ownerId: draft.agents.some((a) => a.id === s.ownerId) ? s.ownerId : draft.agents[0].id,
      })),
    }
    if (!clean.name) return setError('Give the mode a name.')
    if (clean.agents.length === 0) return setError('Add at least one agent.')
    if (clean.stages.length === 0) return setError('Add at least one stage.')
    upsertMode(clean)
    onClose()
  }

  const remove = () => {
    if (editing && !editing.builtIn) {
      deleteMode(editing.id)
      onClose()
    }
  }

  const isBuiltIn = !!editing?.builtIn

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={editing ? (isBuiltIn ? `Duplicate & edit “${editing.name}”` : `Edit “${editing.name}”`) : 'New mode'}
      subtitle="A mode is an org configuration — its own agents, workflow, and colour."
      footer={
        <div className="flex items-center justify-between gap-2">
          {editing && !isBuiltIn ? (
            <button onClick={remove} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10">
              <Trash2 size={14} /> Delete
            </button>
          ) : (
            <span className="text-xs text-white/35">{isBuiltIn ? 'Built-in presets save as a copy.' : ''}</span>
          )}
          <div className="flex items-center gap-2">
            {error && <span className="text-xs text-red-300">{error}</span>}
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm text-white/70 hover:bg-ink-700">
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white"
              style={{ background: draft.accent, boxShadow: `0 0 20px ${alpha(draft.accent, 0.4)}` }}
            >
              Save mode
            </button>
          </div>
        </div>
      }
    >
      {isBuiltIn && (
        <p className="mb-3 rounded-lg border border-line bg-ink-800/60 px-3 py-2 text-xs text-white/55">
          This is a built-in preset — saving creates an editable copy and leaves the original intact.
        </p>
      )}

      {/* Identity */}
      <div className="grid grid-cols-[64px_1fr] gap-3">
        <input
          value={draft.emoji}
          onChange={(e) => set({ emoji: e.target.value })}
          className="grid h-[46px] place-items-center rounded-xl border border-line bg-ink-900/70 text-center text-2xl outline-none focus:border-white/25"
        />
        <input
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Mode name — e.g. Content Studio"
          className="rounded-xl border border-line bg-ink-900/70 px-3 text-sm font-semibold outline-none focus:border-white/25"
        />
      </div>
      <input
        value={draft.tagline}
        onChange={(e) => set({ tagline: e.target.value })}
        placeholder="One-line description of what this org does"
        className="mt-3 w-full rounded-xl border border-line bg-ink-900/70 px-3 py-2 text-sm outline-none focus:border-white/25"
      />
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-white/50">Accent</span>
        {ACCENTS.map((c) => (
          <button
            key={c}
            onClick={() => set({ accent: c })}
            className="h-6 w-6 rounded-full ring-offset-2 ring-offset-ink-850 transition-transform hover:scale-110"
            style={{ background: c, boxShadow: draft.accent === c ? `0 0 0 2px ${c}` : 'none' }}
          />
        ))}
        <input
          type="color"
          value={draft.accent}
          onChange={(e) => set({ accent: e.target.value })}
          className="h-6 w-8 cursor-pointer rounded border border-line bg-transparent"
        />
      </div>

      {/* Agents */}
      <SectionHeader icon={<Users size={14} />} title="Agents" onAdd={addAgent} addLabel="Add agent" />
      <div className="space-y-2">
        {draft.agents.map((a) => (
          <div key={a.id} className="rounded-xl border border-line bg-ink-800/40 p-2.5">
            <div className="flex items-center gap-2">
              <input
                value={a.emoji}
                onChange={(e) => setAgent(a.id, { emoji: e.target.value })}
                className="h-9 w-9 shrink-0 rounded-lg border border-line bg-ink-900/70 text-center text-lg outline-none focus:border-white/25"
              />
              <input
                value={a.name}
                onChange={(e) => setAgent(a.id, { name: e.target.value })}
                placeholder="Name"
                className="h-9 w-28 rounded-lg border border-line bg-ink-900/70 px-2 text-sm font-semibold outline-none focus:border-white/25"
              />
              <input
                value={a.role}
                onChange={(e) => setAgent(a.id, { role: e.target.value })}
                placeholder="Role"
                className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-ink-900/70 px-2 text-sm outline-none focus:border-white/25"
              />
              <input
                type="color"
                value={a.color}
                onChange={(e) => setAgent(a.id, { color: e.target.value })}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent"
              />
              <button
                onClick={() => removeAgent(a.id)}
                disabled={draft.agents.length <= 1}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-white/40 hover:text-red-300 disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={a.blurb}
                onChange={(e) => setAgent(a.id, { blurb: e.target.value })}
                placeholder="What they do"
                className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-ink-900/70 px-2 text-xs outline-none focus:border-white/25"
              />
              <input
                value={a.skills.join(', ')}
                onChange={(e) => setAgent(a.id, { skills: e.target.value.split(',').map((x) => x.trim()) })}
                placeholder="skills, comma, separated"
                className="h-8 w-44 rounded-lg border border-line bg-ink-900/70 px-2 text-xs outline-none focus:border-white/25"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Stages */}
      <SectionHeader icon={<ListChecks size={14} />} title="Workflow" onAdd={addStage} addLabel="Add step" />
      <div className="space-y-2">
        {draft.stages.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-line bg-ink-800/40 p-2.5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line text-[10px] text-white/50">
                {i + 1}
              </span>
              <input
                value={s.title}
                onChange={(e) => setStage(s.id, { title: e.target.value })}
                placeholder="Step title"
                className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-ink-900/70 px-2 text-sm font-semibold outline-none focus:border-white/25"
              />
              <select
                value={s.ownerId}
                onChange={(e) => setStage(s.id, { ownerId: e.target.value })}
                className="h-9 w-32 shrink-0 rounded-lg border border-line bg-ink-900/70 px-2 text-xs outline-none focus:border-white/25"
              >
                {draft.agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.name || 'Agent'}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeStage(s.id)}
                disabled={draft.stages.length <= 1}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-white/40 hover:text-red-300 disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={s.goal}
                onChange={(e) => setStage(s.id, { goal: e.target.value })}
                placeholder="Goal of this step"
                className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-ink-900/70 px-2 text-xs outline-none focus:border-white/25"
              />
              <input
                value={s.produces}
                onChange={(e) => setStage(s.id, { produces: e.target.value })}
                placeholder="Deliverable"
                className="h-8 w-44 rounded-lg border border-line bg-ink-900/70 px-2 text-xs outline-none focus:border-white/25"
              />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function SectionHeader({ icon, title, onAdd, addLabel }: { icon: ReactNode; title: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">
        {icon} {title}
      </p>
      <button onClick={onAdd} className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs text-white/70 hover:bg-ink-700">
        <Plus size={12} /> {addLabel}
      </button>
    </div>
  )
}
