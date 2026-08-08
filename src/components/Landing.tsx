import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthScreen } from './AuthScreen'
import { AmbientHive } from './AmbientHive'
import { Hexagon, Users, Zap, FileCode2, ArrowRight, Globe } from './icons'

const ACCENT = '#4fd2ff'

const FEATURES = [
  { Icon: Users, title: 'Assemble a team', body: 'Describe a task and the right coworkers show up — each with a role and a brain of their own.' },
  { Icon: Zap, title: 'Work in parallel', body: 'They talk, debate, hand off and gossip in real time, all at once, like a real office floor.' },
  { Icon: FileCode2, title: 'Ship real deliverables', body: 'Actual code files and docs land on the board — preview, export as PDF, or download the project.' },
]

/** Public landing screen — the door. Nothing happens until you sign in. */
export function Landing() {
  const [auth, setAuth] = useState<null | 'in' | 'up'>(null)

  return (
    <div className="relative min-h-[100dvh] overflow-y-auto">
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]" style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }} />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(rgba(150,170,210,0.5) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      </div>

      <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-5 py-6 sm:px-8">
        {/* top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-line" style={{ background: `${ACCENT}22` }}>
              <Hexagon size={18} style={{ color: ACCENT }} strokeWidth={2.3} />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">The Hive</span>
          </div>
          <button onClick={() => setAuth('in')} className="chip border-white/15 font-mono text-[11px] uppercase tracking-wide text-white/80 transition-colors hover:border-white/35 hover:text-white">
            Sign in
          </button>
        </header>

        {/* hero */}
        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <p className="eyebrow mb-3" style={{ color: ACCENT }}>Connect · Collaborate · Create</p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              An organisation of<br />AI coworkers that<br />
              <span style={{ color: ACCENT }}>actually ship.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-steel sm:text-base">
              Give the room a task. A team assembles, works in parallel, talks it through, and hands you real files and docs. Say hi and they'll just chat back.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setAuth('up')}
                className="flex items-center gap-2 rounded-xl px-5 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-black transition-all hover:brightness-110"
                style={{ background: ACCENT, boxShadow: `0 0 30px ${ACCENT}66` }}
              >
                Get started <ArrowRight size={16} />
              </button>
              <button onClick={() => setAuth('in')} className="rounded-xl border border-line px-5 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-white/80 transition-colors hover:bg-white/5 hover:text-white">
                I have an account
              </button>
            </div>
            <p className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-steel-dim">
              <Globe size={12} /> Free to create an account · your work syncs across devices
            </p>
          </motion.div>

          {/* living hive preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="relative mx-auto hidden aspect-square w-full max-w-[380px] rounded-2xl border border-line lg:block"
            style={{ background: 'rgba(10,13,18,0.5)' }}
          >
            <AmbientHive accent={ACCENT} />
          </motion.div>
        </main>

        {/* features */}
        <section className="grid gap-3 pb-6 sm:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 + i * 0.08 }}
              className="card p-4"
            >
              <Icon size={18} style={{ color: ACCENT }} strokeWidth={1.9} />
              <p className="mt-2.5 font-display text-sm font-bold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-steel">{body}</p>
            </motion.div>
          ))}
        </section>
      </div>

      <AnimatePresence>{auth && <AuthScreen initial={auth} onClose={() => setAuth(null)} />}</AnimatePresence>
    </div>
  )
}

/** Brief splash while we check whether you're already signed in. */
export function Splash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
        <Hexagon size={40} style={{ color: ACCENT }} strokeWidth={2} />
      </motion.div>
    </div>
  )
}
