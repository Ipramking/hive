import { useState, type ReactNode } from 'react'
import { Cpu, Globe, Users, GitBranch, Trash2, KeyRound, ExternalLink, Check } from './icons'
import { useHive } from '../store'
import { roster } from '../engine/brains'
import { cn } from '../lib/cn'

export function SettingsPage() {
  const apiKey = useHive((s) => s.apiKey)
  const setApiKey = useHive((s) => s.setApiKey)
  const webAccess = useHive((s) => s.webAccess)
  const setWebAccess = useHive((s) => s.setWebAccess)
  const runStyle = useHive((s) => s.runStyle)
  const setRunStyle = useHive((s) => s.setRunStyle)
  const org = useHive((s) => s.org)
  const setOrg = useHive((s) => s.setOrg)
  const history = useHive((s) => s.history)
  const clearHistory = useHive((s) => s.clearHistory)
  const engineName = useHive((s) => s.engineName())

  const [keyDraft, setKeyDraft] = useState(apiKey)
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const brains = roster()
  const gemini = brains.filter((b) => b.provider === 'gemini').length
  const groq = brains.filter((b) => b.provider === 'groq').length

  const saveKey = () => {
    setApiKey(keyDraft.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="card h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8">
        <p className="eyebrow">Settings</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Configure the hive</h1>
        <p className="mt-1 text-sm text-white/45">How the org thinks, searches, and runs. Changes save as you make them.</p>

        {/* Brain pool */}
        <Section title="Brain pool" desc="Coworkers run in parallel, each on a key from this server-side pool.">
          <div className="flex flex-wrap gap-2">
            <Stat icon={<Cpu size={14} />} label="Brains" value={String(brains.length)} />
            <Stat icon={<span className="text-xs">✦</span>} label="Gemini keys" value={String(gemini)} />
            <Stat icon={<span className="text-xs">◆</span>} label="Groq keys" value={String(groq)} />
            <Stat icon={engineName === 'gemini' ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : <span className="h-2 w-2 rounded-full bg-white/30" />} label="Engine" value={engineName === 'gemini' ? 'Live' : 'Offline'} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/40">
            Keys live on the server and never reach your browser. To change the pool, set <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[11px] text-white/60">GEMINI_API_KEY</code>, <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[11px] text-white/60">GROQ_API_KEY</code> (and <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[11px] text-white/60">VITE_BRAINS</code>) in your deployment.
          </p>
        </Section>

        {/* Your own key */}
        <Section title="Your own Gemini key" desc="Optional — run the org on your key instead of the shared pool. Stored only in this browser.">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-ink-900/70 px-3">
              <KeyRound size={15} className="text-white/40" />
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="AIza… or leave blank to use the pool"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white/90 outline-none placeholder:text-white/25"
              />
            </div>
            <button onClick={saveKey} className="flex items-center gap-1.5 rounded-xl border border-line px-4 text-sm font-semibold text-white/80 transition-colors hover:bg-ink-700">
              {saved ? <Check size={15} className="text-emerald-400" /> : null}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </Section>

        {/* Run style + web */}
        <Section title="How it runs" desc="Pick the default working style and whether coworkers can search the web.">
          <div className="space-y-2.5">
            <Row label="Working style" hint={runStyle === 'floor' ? 'Everyone works at once, talking and handing off.' : 'One coworker at a time, down a relay.'}>
              <Segmented
                value={runStyle}
                onChange={(v) => setRunStyle(v as 'floor' | 'relay')}
                options={[
                  { value: 'floor', label: 'Live floor', icon: <Users size={13} /> },
                  { value: 'relay', label: 'Relay', icon: <GitBranch size={13} /> },
                ]}
              />
            </Row>
            <Row label="Live web search" hint="Coworkers ground their work in current data and cite sources.">
              <Toggle on={webAccess} onClick={() => setWebAccess(!webAccess)} icon={<Globe size={13} />} />
            </Row>
          </div>
        </Section>

        {/* Organization */}
        <Section title="Organization" desc="How the room works together. These shape behaviour — they don't slow the room down.">
          <div className="space-y-2.5">
            <Row label="Max working at once" hint="Upper limit — the lead activates only who's needed, up to this.">
              <Stepper value={org.concurrency} min={2} max={6} onChange={(v) => setOrg({ concurrency: v })} />
            </Row>
            <Row label="Rounds" hint="How long the session can run before it wraps.">
              <Stepper value={org.rounds} min={3} max={8} onChange={(v) => setOrg({ rounds: v })} />
            </Row>
            <Row label="Debate" hint="Let coworkers disagree, argue, and resolve — not just agree.">
              <Toggle on={org.debate} onClick={() => setOrg({ debate: !org.debate })} icon={<Users size={13} />} />
            </Row>
          </div>
          <div className="mt-2.5 rounded-xl border border-line bg-ink-900/50 p-3">
            <p className="text-sm font-medium text-white/80">Team culture</p>
            <p className="mb-2 text-xs text-white/40">A charter line that shapes how they work together.</p>
            <textarea
              value={org.culture}
              onChange={(e) => setOrg({ culture: e.target.value })}
              rows={2}
              placeholder="e.g. Move fast, disagree openly, ship real work over talk."
              className="w-full resize-none rounded-lg border border-line bg-ink-900 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/25"
            />
          </div>
        </Section>

        {/* Data */}
        <Section title="Data" desc="Runs are saved locally in this browser.">
          <div className="flex items-center justify-between rounded-xl border border-line bg-ink-900/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white/80">{history.length} saved {history.length === 1 ? 'run' : 'runs'}</p>
              <p className="text-xs text-white/40">Clearing can't be undone.</p>
            </div>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <button onClick={() => { clearHistory(); setConfirmClear(false) }} className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500">
                  Clear all
                </button>
                <button onClick={() => setConfirmClear(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-white/60 hover:bg-ink-700">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} disabled={history.length === 0} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-ink-700 disabled:opacity-40">
                <Trash2 size={13} /> Clear history
              </button>
            )}
          </div>
        </Section>

        {/* About */}
        <Section title="About" desc="Hive — an organisation of AI coworkers.">
          <div className="flex flex-wrap gap-2">
            <a href="https://github.com/Ipramking/hive" target="_blank" rel="noreferrer" className="chip border-white/10 text-xs text-white/60 hover:text-white/90">
              <ExternalLink size={12} /> Source
            </a>
            <span className="chip border-white/10 text-xs text-white/45">Runs offline or on live Gemini + Groq</span>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <section className="mt-6 border-t border-line pt-5">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <p className="mb-3 mt-0.5 text-xs text-white/40">{desc}</p>
      {children}
    </section>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-ink-900/50 px-3 py-2">
      <span className="grid h-6 w-6 place-items-center text-white/60">{icon}</span>
      <div className="leading-none">
        <p className="font-display text-sm font-bold">{value}</p>
        <p className="eyebrow mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink-900/50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="truncate text-xs text-white/40">{hint}</p>
      </div>
      {children}
    </div>
  )
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; icon: ReactNode }[] }) {
  return (
    <div className="flex shrink-0 items-center rounded-full border border-line bg-ink-900/70 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors', value === o.value ? 'bg-ink-700 text-white' : 'text-white/50 hover:text-white/80')}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-ink-900/70 p-0.5">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="grid h-7 w-7 place-items-center rounded-full text-white/70 transition-colors hover:bg-ink-700 disabled:opacity-30">−</button>
      <span className="min-w-6 text-center font-display text-sm font-bold">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="grid h-7 w-7 place-items-center rounded-full text-white/70 transition-colors hover:bg-ink-700 disabled:opacity-30">+</button>
    </div>
  )
}

function Toggle({ on, onClick, icon }: { on: boolean; onClick: () => void; icon: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex h-7 w-12 shrink-0 items-center rounded-full border px-0.5 transition-colors', on ? 'justify-end border-sky-400/50 bg-sky-400/20' : 'justify-start border-line bg-ink-900')}
    >
      <span className={cn('grid h-6 w-6 place-items-center rounded-full', on ? 'bg-sky-400 text-ink-950' : 'bg-ink-700 text-white/50')}>{icon}</span>
    </button>
  )
}
