import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { prefersReduced } from '../lib/anim'

// orbiting particles — radius (0..50), speed (turns/cycle, signed), phase, size
const NODES = [
  { r: 22, sp: 1, ph: 0, s: 2.4 },
  { r: 22, sp: 1, ph: 180, s: 1.8 },
  { r: 33, sp: -0.66, ph: 60, s: 2.8 },
  { r: 33, sp: -0.66, ph: 210, s: 2 },
  { r: 41, sp: 0.45, ph: 130, s: 2.2 },
  { r: 41, sp: 0.45, ph: 300, s: 1.6 },
]

/**
 * The idle "living hive": particles orbit a pulsing hex core, connected by
 * breathing spokes, with ripples washing outward. Driven by anime.js.
 */
export function AmbientHive({ accent }: { accent: string }) {
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([])
  const lineRefs = useRef<(SVGLineElement | null)[]>([])
  const coreRef = useRef<SVGGElement | null>(null)
  const r1 = useRef<SVGCircleElement | null>(null)
  const r2 = useRef<SVGCircleElement | null>(null)

  useEffect(() => {
    if (prefersReduced()) return
    const state = { t: 0 }
    const driver = animate(
      state,
      {
        t: 1,
        duration: 14000,
        ease: 'linear',
        loop: true,
        onUpdate: () => {
          const t = state.t
          NODES.forEach((cfg, i) => {
            const a = (cfg.ph + t * 360 * cfg.sp) * (Math.PI / 180)
            const x = 50 + cfg.r * Math.cos(a)
            const y = 50 + cfg.r * Math.sin(a)
            const el = nodeRefs.current[i]
            if (el) {
              el.setAttribute('cx', String(x))
              el.setAttribute('cy', String(y))
            }
            const ln = lineRefs.current[i]
            if (ln) {
              ln.setAttribute('x2', String(x))
              ln.setAttribute('y2', String(y))
              ln.setAttribute('stroke-opacity', String(0.08 + 0.14 * (0.5 + 0.5 * Math.sin(a * 2 + i))))
            }
          })
        },
      },
    )

    const core = coreRef.current && animate(coreRef.current, {
      scale: [1, 1.12, 1],
      opacity: [0.85, 1, 0.85],
      duration: 2600,
      ease: 'inOutSine',
      loop: true,
    })

    const ripple = (el: SVGCircleElement | null, delay: number) =>
      el && animate(el, { r: [6, 46], opacity: [0.35, 0], duration: 4200, delay, ease: 'outSine', loop: true })
    const rp1 = ripple(r1.current, 0)
    const rp2 = ripple(r2.current, 2100)

    return () => {
      ;(driver as any)?.cancel?.()
      ;(core as any)?.cancel?.()
      ;(rp1 as any)?.cancel?.()
      ;(rp2 as any)?.cancel?.()
    }
  }, [])

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <radialGradient id="ah-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.7" />
        </radialGradient>
        <filter id="ah-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="0.7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ripples */}
      <circle ref={r1} cx="50" cy="50" r="6" fill="none" stroke={accent} strokeWidth="0.4" />
      <circle ref={r2} cx="50" cy="50" r="6" fill="none" stroke={accent} strokeWidth="0.4" />

      {/* spokes */}
      {NODES.map((_, i) => (
        <line key={`l${i}`} ref={(el) => { lineRefs.current[i] = el }} x1="50" y1="50" x2="50" y2="50" stroke={accent} strokeOpacity="0.12" strokeWidth="0.3" />
      ))}

      {/* orbiting particles */}
      {NODES.map((cfg, i) => (
        <circle
          key={`n${i}`}
          ref={(el) => { nodeRefs.current[i] = el }}
          cx="50" cy="50" r={cfg.s}
          fill={accent}
          filter="url(#ah-glow)"
          style={{ opacity: 0.85 }}
        />
      ))}

      {/* pulsing hex core */}
      <g ref={coreRef} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <polygon points="50,42 57,46 57,54 50,58 43,54 43,46" fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="4.5" fill="url(#ah-core)" filter="url(#ah-glow)" />
      </g>
    </svg>
  )
}
