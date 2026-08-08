import { useRef, useState } from 'react'
import { Play, RotateCcw, Loader2, Sparkles, Zap, Globe, Users, GitBranch, Cpu, SendHorizonal, ImagePlus, X, modeIconOf } from './icons'
import { motion } from 'framer-motion'
import { useHive } from '../store'
import { Feed } from './Feed'
import { roster } from '../engine/brains'
import { fileToPickedImage } from '../lib/image'
import { alpha } from '../lib/color'
import { cn } from '../lib/cn'

const examplesById: Record<string, string[]> = {
  auto: ['Build a REST API for a todo app', 'Scaffold a landing page for a coffee brand', 'Write a Python script to dedupe a CSV'],
  normal: ['Add a way for users to export their data as CSV', 'Let customers reschedule a booking themselves'],
  hackathon: ['Cut support ticket resolution time for a fintech', 'Help a logistics company predict delivery delays'],
}

export function ControlDock() {
  const mode = useHive((s) => s.activeMode())
  const task = useHive((s) => s.task)
  const setTask = useHive((s) => s.setTask)
  const launch = useHive((s) => s.launch)
  const reset = useHive((s) => s.reset)
  const runStatus = useHive((s) => s.runStatus)
  const runStyle = useHive((s) => s.runStyle)
  const setRunStyle = useHive((s) => s.setRunStyle)
  const activeModeId = useHive((s) => s.activeModeId)
  const round = useHive((s) => s.round)
  const engineName = useHive((s) => s.engineName())
  const webAccess = useHive((s) => s.webAccess)
  const setWebAccess = useHive((s) => s.setWebAccess)
  const attachment = useHive((s) => s.attachment)
  const setAttachment = useHive((s) => s.setAttachment)
  const fileRef = useRef<HTMLInputElement>(null)
  const [attaching, setAttaching] = useState(false)
  const running = runStatus === 'running'
  const live = engineName === 'gemini'
  const floor = runStyle === 'floor'
  const accent = mode.accent
  const brains = roster().length
  const examples = examplesById[mode.id] ?? [`Run "${mode.name}" on a real task`]

  const pickImage = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    setAttaching(true)
    try {
      const picked = await fileToPickedImage(file)
      setAttachment(picked)
    } finally {
      setAttaching(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="card flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-line p-4">
        <p className="eyebrow">Command</p>
        <div className="mt-1.5 flex items-center gap-2">
          {(() => {
            const ModeI = modeIconOf(mode)
            return <ModeI size={16} strokeWidth={1.9} style={{ color: accent }} />
          })()}
          <p className="font-display text-base font-bold">{mode.name}</p>
        </div>
        <p className="mt-1 text-xs text-steel">
          {floor ? 'Everyone works at once — talking, handing off, shipping.' : mode.tagline}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <div className={cn('relative flex items-center rounded-full border border-line bg-ink-900/70 p-0.5 font-mono text-[10px] uppercase tracking-wide', activeModeId === 'auto' && 'hidden')}>
            {(['floor', 'relay'] as const).map((s) => (
              <button
                key={s}
                onClick={() => !running && setRunStyle(s)}
                disabled={running}
                className={cn('relative z-10 flex items-center gap-1 rounded-full px-2 py-1 transition-colors', runStyle === s ? 'text-white' : 'text-white/45')}
              >
                {runStyle === s && (
                  <motion.span layoutId="dock-style" transition={{ type: 'spring', stiffness: 400, damping: 32 }} className="absolute inset-0 -z-10 rounded-full" style={{ background: alpha(accent, 0.22), border: `1px solid ${alpha(accent, 0.5)}` }} />
                )}
                {s === 'floor' ? <Users size={11} /> : <GitBranch size={11} />}
                {s}
              </button>
            ))}
          </div>
          <span className={cn('chip font-mono text-[10px] uppercase tracking-wide', live ? 'border-accent/50 text-accent-soft' : 'border-white/10 text-white/45')}>
            {live ? <Zap size={11} /> : <Sparkles size={11} />}
            {live ? 'Live' : 'Offline'}
          </span>
          {floor && (
            <span className="chip border-white/10 font-mono text-[10px] uppercase tracking-wide text-white/50" title="Coworkers run in parallel across this many model keys">
              <Cpu size={11} /> {brains}
            </span>
          )}
          <button
            onClick={() => setWebAccess(!webAccess)}
            disabled={!live || running}
            title={live ? (webAccess ? 'Live web search on' : 'Live web search off') : 'Web search needs the live engine'}
            className={cn('chip font-mono text-[10px] uppercase tracking-wide transition-colors disabled:opacity-40', live && webAccess ? 'border-accent/50 text-accent-soft' : 'border-white/10 text-white/45 hover:text-white/70')}
          >
            <Globe size={11} />
            {webAccess ? 'Web' : 'No web'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={running || attaching}
            title="Attach an image for the room to read and research"
            className={cn('chip font-mono text-[10px] uppercase tracking-wide transition-colors disabled:opacity-40', attachment ? 'border-[color:var(--accent)] text-white' : 'border-white/10 text-white/45 hover:text-white/70')}
          >
            {attaching ? <Loader2 size={11} className="animate-spin" /> : <ImagePlus size={11} />}
            Image
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0])} />
        </div>

        {attachment && (
          <div className="inset mt-3 flex items-center gap-3 p-2">
            <img src={attachment.dataUrl} alt={attachment.name} className="h-12 w-12 shrink-0 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[11px] text-steel-bright">{attachment.name}</p>
              <p className="font-mono text-[10px] text-steel-dim">the room will read this image, then work &amp; research on it</p>
            </div>
            <button onClick={() => setAttachment(null)} disabled={running} className="btn-icon shrink-0" title="Remove image">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="inset mt-3 flex items-start gap-2 px-3 py-2.5 transition-colors focus-within:border-[color:var(--accent)]">
          <span className="mt-px font-mono text-sm leading-6" style={{ color: accent }}>▸</span>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !running && (task.trim() || attachment)) {
                e.preventDefault()
                launch()
              }
            }}
            disabled={running}
            rows={2}
            placeholder={attachment ? 'add a comment on the image (optional)…' : 'what should the room build?'}
            className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-6 text-steel-bright outline-none placeholder:text-steel-dim disabled:opacity-60"
          />
        </div>

        {runStatus === 'complete' || running ? (
          <button onClick={reset} disabled={running} className="btn-soft mt-2 w-full font-mono uppercase tracking-wide">
            {running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
            {running ? `Executing · round ${round}` : 'Reset deck'}
          </button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={launch}
            disabled={!task.trim() && !attachment}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-mono text-sm font-semibold uppercase tracking-wide text-black transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: accent, boxShadow: `0 0 26px ${alpha(accent, 0.45)}` }}
          >
            <Play size={15} /> Execute
          </motion.button>
        )}

        {runStatus === 'draft' && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button key={ex} onClick={() => setTask(ex)} className="chip border-white/10 text-[11px] text-white/50 transition-colors hover:border-white/25 hover:text-white/80">
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <p className="eyebrow">Ops Log</p>
        {running && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-steel">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: accent }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            </span>
            live
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        <Feed />
      </div>

      <ChatInput accent={accent} />
    </section>
  )
}

function ChatInput({ accent }: { accent: string }) {
  const postUser = useHive((s) => s.postUser)
  const running = useHive((s) => s.runStatus === 'running')
  const [draft, setDraft] = useState('')
  const send = () => {
    if (!draft.trim()) return
    postUser(draft)
    setDraft('')
  }
  return (
    <div className="border-t border-line p-2.5">
      <div className="inset flex items-center gap-2 px-3 transition-colors focus-within:border-[color:var(--accent)]">
        <span className="font-mono text-sm" style={{ color: accent }}>›</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={running ? 'transmit to the room…' : 'run first, then steer it live'}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-steel-bright outline-none placeholder:text-steel-dim"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          title="Send to the room"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-all hover:scale-110 disabled:scale-100 disabled:opacity-30"
          style={{ color: accent }}
        >
          <SendHorizonal size={17} />
        </button>
      </div>
    </div>
  )
}
