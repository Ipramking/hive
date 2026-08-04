import { useEffect, useState } from 'react'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { Modal } from './Modal'
import { useHive } from '../store'

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const apiKey = useHive((s) => s.apiKey)
  const setApiKey = useHive((s) => s.setApiKey)
  const [draft, setDraft] = useState(apiKey)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (open) setDraft(apiKey)
  }, [open, apiKey])

  const save = () => {
    setApiKey(draft.trim())
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      subtitle="Connect a live model, or leave blank to run offline."
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm text-white/70 hover:bg-ink-700">
            Cancel
          </button>
          <button onClick={save} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-soft">
            Save
          </button>
        </div>
      }
    >
      <label className="mb-1.5 block text-xs font-semibold text-white/70">Gemini API key</label>
      <div className="flex items-center gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="AIza…"
          className="min-w-0 flex-1 rounded-xl border border-line bg-ink-900/70 px-3 py-2 font-mono text-sm outline-none focus:border-white/25"
        />
        <button
          onClick={() => setShow((s) => !s)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-white/60 hover:bg-ink-700"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      <p className="mt-2 text-xs text-white/45">
        With a key, agents produce real, task-specific output via <span className="font-mono">gemini-flash-latest</span>. Without
        one, Hive runs a deterministic offline engine — perfect for demos.
      </p>

      <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs text-amber-200/80">
        <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
        <span>
          The key is stored only in this browser (localStorage) and called directly from your device. Fine for local use and
          demos; for a shared deployment, proxy the model through a backend instead.
        </span>
      </div>

      <p className="mt-3 text-xs text-white/40">
        Get a free key at{' '}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-accent-soft underline">
          aistudio.google.com/apikey
        </a>
        .
      </p>
    </Modal>
  )
}
