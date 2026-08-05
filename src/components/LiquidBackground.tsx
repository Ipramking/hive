import { motion } from 'framer-motion'
import { alpha } from '../lib/color'

/**
 * A living, liquid backdrop — slow drifting metaballs in the mode's accent.
 * Sits behind everything; blurred and low-opacity so it never fights the UI.
 */
export function LiquidBackground({ accent, active }: { accent: string; active: boolean }) {
  const blobs = [
    { size: 640, top: '-10%', left: '-8%', dur: 26, mul: 1 },
    { size: 520, top: '38%', left: '64%', dur: 32, mul: 0.7 },
    { size: 480, top: '70%', left: '10%', dur: 30, mul: 0.85 },
  ]
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: `radial-gradient(circle at 50% 50%, ${alpha(accent, (active ? 0.42 : 0.26) * b.mul)}, transparent 70%)`,
          }}
          animate={{
            x: ['-4%', '6%', '-2%', '-4%'],
            y: ['-3%', '5%', '-4%', '-3%'],
            scale: active ? [1, 1.12, 0.96, 1] : [1, 1.05, 1],
          }}
          transition={{ duration: active ? b.dur * 0.6 : b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* a faint sweeping caustic — the "surface" of the liquid */}
      <motion.div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          background: `linear-gradient(115deg, transparent 40%, ${accent} 50%, transparent 60%)`,
          backgroundSize: '200% 200%',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}
