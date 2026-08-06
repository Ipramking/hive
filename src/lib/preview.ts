import type { Artifact } from '../types'

const isHtml = (a: Artifact) => /\.html?$/i.test(a.filename ?? '') || (a.language ?? '').toLowerCase() === 'html'
const isCss = (a: Artifact) => /\.css$/i.test(a.filename ?? '') || (a.language ?? '').toLowerCase() === 'css'
const isJs = (a: Artifact) => /\.m?js$/i.test(a.filename ?? '') || ['js', 'javascript'].includes((a.language ?? '').toLowerCase())

/** True when the deliverables include something viewable in a browser. */
export function hasViewableSite(artifacts: Artifact[]): boolean {
  return artifacts.some((a) => a.kind === 'code' && isHtml(a))
}

/**
 * Assemble a single previewable HTML document from the code deliverables:
 * the HTML file, with any sibling CSS inlined into <head> and JS before </body>.
 * Returns null if there's no HTML to show.
 */
export function buildPreviewDoc(artifacts: Artifact[]): string | null {
  const code = artifacts.filter((a) => a.kind === 'code')
  const htmls = code.filter(isHtml)
  if (!htmls.length) return null
  const main = htmls.find((a) => /index\.html?$/i.test(a.filename ?? '')) ?? htmls[0]

  const styleTag = code.filter(isCss).map((c) => `<style>\n${c.body}\n</style>`).join('\n')
  const scriptTag = code.filter(isJs).map((j) => `<script>\n${j.body}\n</script>`).join('\n')

  let html = main.body
  const full = /<html[\s>]/i.test(html) || /<!doctype/i.test(html)
  if (!full) {
    html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n${html}\n</body></html>`
  }
  if (styleTag) {
    html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${styleTag}\n</head>`) : styleTag + html
  }
  if (scriptTag) {
    html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${scriptTag}\n</body>`) : html + scriptTag
  }
  return html
}
