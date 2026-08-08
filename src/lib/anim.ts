// Small anime.js (v4) helpers, reduced-motion aware.
import { animate, stagger, utils } from 'animejs'

export const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Staggered entrance for a set of elements (fade + rise). Returns a no-op cleanup. */
export function enter(targets: string | Element | (Element | null)[], opts: { delay?: number; y?: number; from?: number } = {}) {
  if (prefersReduced()) return
  const { delay = 0, y = 16, from = 60 } = opts
  animate(targets as any, {
    opacity: [0, 1],
    translateY: [y, 0],
    duration: 720,
    delay: stagger(from, { start: delay }),
    ease: 'outExpo',
  })
}

/** Count a numeric readout up to its value. `el` gets its textContent updated. */
export function countUp(el: HTMLElement, to: number, suffix = '') {
  if (prefersReduced() || to === 0) {
    el.textContent = `${to}${suffix}`
    return
  }
  const obj = { v: 0 }
  animate(obj, {
    v: to,
    duration: 900,
    ease: 'out(3)',
    onUpdate: () => {
      el.textContent = `${utils.round(obj.v, 0)}${suffix}`
    },
  })
}
