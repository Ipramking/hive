/** Technical corner brackets — the mission-deck framing device. Place inside a relative box. */
export function Corners({ color = 'rgba(150,170,210,0.30)', size = 12, inset = 0 }: { color?: string; size?: number; inset?: number }) {
  const b = `1px solid ${color}`
  const base = { position: 'absolute', width: size, height: size, pointerEvents: 'none' } as const
  return (
    <>
      <span style={{ ...base, top: inset, left: inset, borderTop: b, borderLeft: b }} />
      <span style={{ ...base, top: inset, right: inset, borderTop: b, borderRight: b }} />
      <span style={{ ...base, bottom: inset, left: inset, borderBottom: b, borderLeft: b }} />
      <span style={{ ...base, bottom: inset, right: inset, borderBottom: b, borderRight: b }} />
    </>
  )
}
