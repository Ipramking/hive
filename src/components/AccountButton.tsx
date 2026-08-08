import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth, AUTH_ENABLED } from '../lib/auth'
import { AuthScreen } from './AuthScreen'
import { LogIn, LogOut, UserRound } from './icons'

/** Header account control — sign in / show the signed-in user + sign out. */
export function AccountButton() {
  const { user, signOut } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [menu, setMenu] = useState(false)

  // Auth off (no DB configured) — the app runs guest-only, so show nothing.
  if (!AUTH_ENABLED) return null

  if (!user) {
    return (
      <>
        <button
          onClick={() => setAuthOpen(true)}
          className="chip border-white/10 font-mono text-[10px] uppercase tracking-wide text-white/70 transition-colors hover:border-white/25 hover:text-white"
          title="Sign in to save your work"
        >
          <LogIn size={12} /> Sign in
        </button>
        <AnimatePresence>{authOpen && <AuthScreen onClose={() => setAuthOpen(false)} />}</AnimatePresence>
      </>
    )
  }

  const initial = user.email.charAt(0).toUpperCase()
  return (
    <div className="relative">
      <button
        onClick={() => setMenu((m) => !m)}
        className="grid h-8 w-8 place-items-center rounded-full border border-line font-mono text-xs font-bold text-steel-bright transition-colors hover:border-white/30"
        title={user.email}
      >
        {initial}
      </button>
      <AnimatePresence>
        {menu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="card absolute right-0 top-10 z-50 w-56 overflow-hidden p-1"
            >
              <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line">
                  <UserRound size={14} className="text-steel" />
                </span>
                <div className="min-w-0">
                  <p className="eyebrow">Signed in</p>
                  <p className="truncate text-xs text-steel-bright">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMenu(false)
                  signOut()
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-steel transition-colors hover:bg-white/5 hover:text-white"
              >
                <LogOut size={14} /> Sign out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
