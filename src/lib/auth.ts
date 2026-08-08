import { create } from 'zustand'
import { useHive } from '../store'

/** Auth is only live when the deployment is configured with a database. */
export const AUTH_ENABLED = import.meta.env.VITE_AUTH === '1'

let unsub: (() => void) | null = null
let pushTimer: ReturnType<typeof setTimeout> | undefined

async function pullCloud() {
  try {
    const r = await fetch('/api/data')
    if (!r.ok) return
    const { data } = await r.json()
    if (data && Object.keys(data).length) useHive.getState().hydrate(data)
  } catch {
    /* offline — keep local */
  }
}

function pushNow() {
  const data = useHive.getState().snapshot()
  fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => {})
}

/** Save the account's durable data whenever it changes (debounced). */
function startSync() {
  stopSync()
  unsub = useHive.subscribe(() => {
    clearTimeout(pushTimer)
    pushTimer = setTimeout(pushNow, 1800)
  })
}
function stopSync() {
  if (unsub) unsub()
  unsub = null
  clearTimeout(pushTimer)
}

interface User {
  id: string
  email: string
}
interface AuthState {
  enabled: boolean
  user: User | null
  status: 'loading' | 'ready'
  error: string
  busy: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthState>((set) => ({
  enabled: AUTH_ENABLED,
  user: null,
  status: AUTH_ENABLED ? 'loading' : 'ready',
  error: '',
  busy: false,

  init: async () => {
    if (!AUTH_ENABLED) return set({ status: 'ready' })
    try {
      const r = await fetch('/api/auth/me')
      const { user } = await r.json()
      if (user) {
        set({ user })
        await pullCloud()
        startSync()
      }
    } catch {
      /* ignore */
    }
    set({ status: 'ready' })
  },

  signIn: async (email, password) => {
    set({ error: '', busy: true })
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const j = await r.json()
      if (!r.ok) {
        set({ error: j.error || 'Could not sign in.', busy: false })
        return false
      }
      set({ user: j.user, busy: false })
      await pullCloud()
      startSync()
      return true
    } catch {
      set({ error: 'Network error — try again.', busy: false })
      return false
    }
  },

  signUp: async (email, password) => {
    set({ error: '', busy: true })
    try {
      const r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const j = await r.json()
      if (!r.ok) {
        set({ error: j.error || 'Could not create the account.', busy: false })
        return false
      }
      set({ user: j.user, busy: false })
      // carry the current (guest) work into the new account
      pushNow()
      startSync()
      return true
    } catch {
      set({ error: 'Network error — try again.', busy: false })
      return false
    }
  },

  signOut: async () => {
    stopSync()
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    set({ user: null })
  },

  clearError: () => set({ error: '' }),
}))
