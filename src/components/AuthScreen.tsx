import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { useHive } from '../store'
import { Hexagon, KeyRound, X, Loader2, Check } from './icons'

export function AuthScreen({ onClose }: { onClose: () => void }) {
  const accent = useHive((s) => s.activeMode().accent)
  const { signIn, signUp, error, busy, clearError } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async () => {
    const ok = mode === 'in' ? await signIn(email, password) : await signUp(email, password)
    if (ok) onClose()
  }
  const swap = (m: 'in' | 'up') => {
    clearError()
    setMode(m)
  }

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-sm overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-line" style={{ background: `${accent}22` }}>
              <Hexagon size={16} style={{ color: accent }} strokeWidth={2.2} />
            </span>
            <div>
              <p className="eyebrow">Account</p>
              <p className="font-display text-sm font-bold">{mode === 'in' ? 'Sign in' : 'Create account'}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          {/* tabs */}
          <div className="mb-4 flex rounded-lg border border-line p-0.5 font-mono text-[11px] uppercase tracking-wide">
            {(['in', 'up'] as const).map((m) => (
              <button
                key={m}
                onClick={() => swap(m)}
                className={m === mode ? 'flex-1 rounded-md py-1.5 text-black' : 'flex-1 py-1.5 text-steel'}
                style={m === mode ? { background: accent } : undefined}
              >
                {m === 'in' ? 'Sign in' : 'Create'}
              </button>
            ))}
          </div>

          <label className="eyebrow">Email</label>
          <div className="inset mt-1.5 mb-3 flex items-center gap-2 px-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="you@example.com"
              autoFocus
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-steel-bright outline-none placeholder:text-steel-dim"
            />
          </div>

          <label className="eyebrow">Password</label>
          <div className="inset mt-1.5 flex items-center gap-2 px-3">
            <KeyRound size={14} className="text-steel-dim" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={mode === 'up' ? 'at least 8 characters' : '••••••••'}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-steel-bright outline-none placeholder:text-steel-dim"
            />
          </div>

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

          <button
            onClick={submit}
            disabled={busy || !email || !password}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-mono text-sm font-semibold uppercase tracking-wide text-black transition-all disabled:opacity-40"
            style={{ background: accent, boxShadow: `0 0 22px ${accent}55` }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {mode === 'in' ? 'Sign in' : 'Create account'}
          </button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-steel-dim">
            Your modes, history, and settings sync to your account.
            <br />
            No account? Everything still works — it just stays on this device.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
