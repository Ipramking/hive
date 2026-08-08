import { motion } from 'framer-motion'
import { alpha } from '../lib/color'

/**
 * The hive's atmosphere: a faint honeycomb lattice + slow drifting accent light.
 * Fixed behind everything; gives the whole app an unmistakable "hive" texture.
 */
export function HiveBackdrop({ accent, active }: { accent: string; active: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* honeycomb lattice */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]">
        <defs>
          <pattern id="comb" width="56" height="97" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            {/* two offset hexagons tile into a honeycomb */}
            <path
              d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L56 80 L56 112 M28 64 L0 80 L0 112"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#comb)" />
      </svg>

      {/* accent glow blobs */}
      {[
        { size: 680, top: '-12%', left: '-8%', dur: 28, mul: 1 },
        { size: 560, top: '42%', left: '66%', dur: 34, mul: 0.7 },
        { size: 500, top: '72%', left: '8%', dur: 30, mul: 0.85 },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[100px]"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: `radial-gradient(circle at 50% 50%, ${alpha(accent, (active ? 0.5 : 0.3) * b.mul)}, transparent 70%)`,
          }}
          animate={{
            x: ['-3%', '5%', '-2%', '-3%'],
            y: ['-3%', '4%', '-4%', '-3%'],
            scale: active ? [1, 1.12, 0.96, 1] : [1, 1.05, 1],
          }}
          transition={{ duration: active ? b.dur * 0.6 : b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* top vignette so the header reads cleanly */}
      <div className="absolute inset-x-0 top-0 h-40" style={{ background: 'linear-gradient(rgba(8,8,20,0.85), transparent)' }} />
    </div>
  )
}
