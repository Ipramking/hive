import { jsPDF } from 'jspdf'
import type { RunRecord } from '../types'

// A clean, readable PDF of a run: cover line, then each deliverable with a
// heading, byline, and body (code set in a monospace block).
export function downloadPdf(r: RunRecord) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const M = 48 // margin
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const CW = W - M * 2
  let y = M

  const ensure = (need: number) => {
    if (y + need > H - M) {
      doc.addPage()
      y = M
    }
  }
  const text = (s: string, size: number, opts: { font?: 'helvetica' | 'courier'; style?: 'normal' | 'bold'; color?: [number, number, number]; gap?: number } = {}) => {
    doc.setFont(opts.font ?? 'helvetica', opts.style ?? 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...(opts.color ?? [30, 30, 34]))
    const lines = doc.splitTextToSize(s, CW) as string[]
    const lh = size * 1.45
    for (const ln of lines) {
      ensure(lh)
      doc.text(ln, M, y)
      y += lh
    }
    y += opts.gap ?? 0
  }
  const rule = () => {
    ensure(18)
    doc.setDrawColor(220, 216, 208)
    doc.line(M, y, W - M, y)
    y += 18
  }

  // header
  text('THE HIVE', 9, { font: 'courier', color: [120, 120, 128] })
  text(r.task || r.modeName, 20, { style: 'bold', gap: 4 })
  text(`${r.modeName} · ${r.engineName} · ${new Date(r.ts).toLocaleString()}`, 9, { color: [130, 130, 138], gap: 10 })
  rule()

  r.artifacts.forEach((a, i) => {
    if (i > 0) rule()
    const heading = a.kind === 'code' && a.filename ? a.filename : a.title
    text(heading, 13, { style: 'bold', font: a.kind === 'code' ? 'courier' : 'helvetica', gap: 2 })
    text(`${a.agentName} — ${a.agentRole}`, 8.5, { font: 'courier', color: [130, 130, 138], gap: 6 })
    if (a.kind === 'code') {
      // light code block background
      const lines = doc.splitTextToSize(a.body, CW - 16) as string[]
      const blockH = lines.length * 9 * 1.4 + 16
      ensure(blockH)
      doc.setFillColor(244, 242, 236)
      doc.rect(M, y - 4, CW, Math.min(blockH, H - M - y + 4), 'F')
      text(a.body, 9, { font: 'courier', color: [40, 40, 46], gap: 6 })
    } else {
      text(a.body, 10.5, { color: [40, 40, 46], gap: 4 })
    }
    if (a.sources?.length) {
      text('Sources', 9, { style: 'bold', color: [110, 110, 118], gap: 2 })
      a.sources.forEach((s) => text(`• ${s.title} — ${s.uri}`, 8.5, { color: [90, 110, 200], gap: 1 }))
    }
  })

  const slug = (r.task || r.modeName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  doc.save(`hive-${slug || 'run'}.pdf`)
}
