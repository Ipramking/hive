import { jsPDF } from 'jspdf'
import type { RunArtifact, RunRecord } from '../types'

// Treat markdown/notes as narrative "docs" even if flagged code (e.g. WHATS_LEFT.md).
function isNarrative(a: RunArtifact): boolean {
  if (a.kind !== 'code') return true
  const f = (a.filename ?? '').toLowerCase()
  const l = (a.language ?? '').toLowerCase()
  return /\.(md|markdown|txt|rst)$/.test(f) || ['md', 'markdown', 'txt'].includes(l)
}

const INK: [number, number, number] = [24, 26, 32]
const MUTED: [number, number, number] = [110, 116, 128]
const RULE: [number, number, number] = [222, 224, 230]

/** A designed, watermarked PDF: cover → notes (words) → files (code). */
export function downloadPdf(r: RunRecord) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 52
  const CW = W - M * 2
  const accent = hexToRgb(r.accent) ?? [34, 197, 94]

  const docs = r.artifacts.filter(isNarrative)
  const code = r.artifacts.filter((a) => !isNarrative(a))

  // ---- cover ----
  doc.setFillColor(...accent)
  doc.rect(0, 0, W, 150, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('T H E   H I V E', M, 54)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('AI COWORKER SESSION', M, 70)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  const titleLines = doc.splitTextToSize(r.task || r.modeName, CW) as string[]
  doc.text(titleLines.slice(0, 2), M, 104)

  let y = 200
  doc.setTextColor(...MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${r.modeName}  ·  ${r.engineName} engine  ·  ${new Date(r.ts).toLocaleString()}`, M, y)
  y += 16
  doc.text(`${docs.length} note${docs.length === 1 ? '' : 's'}  ·  ${code.length} file${code.length === 1 ? '' : 's'}`, M, y)
  y += 26
  doc.setDrawColor(...RULE)
  doc.line(M, y, W - M, y)
  y += 30

  const ensure = (need: number) => {
    if (y + need > H - 64) {
      doc.addPage()
      y = 64
    }
  }
  const write = (
    s: string,
    size: number,
    opts: { font?: 'helvetica' | 'courier'; style?: 'normal' | 'bold'; color?: [number, number, number]; gap?: number; indent?: number } = {},
  ) => {
    doc.setFont(opts.font ?? 'helvetica', opts.style ?? 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...(opts.color ?? INK))
    const x = M + (opts.indent ?? 0)
    const lines = doc.splitTextToSize(s, CW - (opts.indent ?? 0)) as string[]
    const lh = size * 1.45
    for (const ln of lines) {
      ensure(lh)
      doc.text(ln, x, y)
      y += lh
    }
    y += opts.gap ?? 0
  }
  const sectionHead = (label: string) => {
    ensure(40)
    doc.setFillColor(...accent)
    doc.rect(M, y - 9, 3, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...INK)
    doc.text(label.toUpperCase(), M + 10, y + 2)
    y += 26
  }

  // ---- notes (words) ----
  if (docs.length) {
    sectionHead('Notes')
    docs.forEach((a, i) => {
      if (i > 0) {
        y += 6
        ensure(14)
        doc.setDrawColor(...RULE)
        doc.line(M, y, W - M, y)
        y += 18
      }
      write(a.title, 12.5, { style: 'bold', gap: 2 })
      write(`${a.agentName} — ${a.agentRole}`, 8.5, { font: 'courier', color: MUTED, gap: 6 })
      write(a.body, 10.5, { gap: 4 })
      if (a.sources?.length) {
        write('Sources', 9, { style: 'bold', color: MUTED, gap: 2 })
        a.sources.forEach((s) => write(`• ${s.title} — ${s.uri}`, 8.5, { color: [70, 100, 190], gap: 1 }))
      }
    })
  }

  // ---- files (code) ----
  if (code.length) {
    y += 12
    sectionHead('Files')
    code.forEach((a, i) => {
      if (i > 0) y += 10
      write(a.filename || a.title, 11.5, { style: 'bold', font: 'courier', gap: 2 })
      write(`${a.agentName} — ${a.agentRole}`, 8.5, { font: 'courier', color: MUTED, gap: 6 })
      // light code block
      const lines = doc.splitTextToSize(a.body, CW - 20) as string[]
      const lh = 8.5 * 1.5
      for (const ln of lines) {
        ensure(lh + 6)
        doc.setFillColor(245, 246, 248)
        doc.rect(M, y - lh + 3, CW, lh, 'F')
        doc.setFont('courier', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(40, 44, 52)
        doc.text(ln, M + 10, y)
        y += lh
      }
      y += 8
    })
  }

  // ---- watermark + footer on every page ----
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    // faint diagonal watermark
    doc.saveGraphicsState()
    // @ts-expect-error GState exists at runtime in jsPDF
    doc.setGState(new doc.GState({ opacity: 0.05 }))
    doc.setTextColor(...accent)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(64)
    doc.text('THE HIVE', W / 2, H / 2, { align: 'center', angle: 30 })
    doc.restoreGraphicsState()
    // footer
    if (p > 1 || pages === 1) {
      doc.setFont('courier', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...MUTED)
      doc.text('Generated by The Hive · hive-psi-one.vercel.app', M, H - 34)
      doc.text(`${p} / ${pages}`, W - M, H - 34, { align: 'right' })
    }
  }

  const slug = (r.task || r.modeName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  doc.save(`hive-${slug || 'run'}.pdf`)
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
