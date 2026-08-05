import JSZip from 'jszip'
import type { RunRecord } from '../types'
import { runToMarkdown } from './exportRun'

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'file'
}

/** Bundle a run into a downloadable project: code files at their paths, docs, and a README. */
export async function downloadProject(r: RunRecord) {
  const zip = new JSZip()
  const used = new Set<string>()
  const put = (path: string, content: string) => {
    let p = path
    let i = 2
    while (used.has(p)) {
      const dot = path.lastIndexOf('.')
      p = dot > 0 ? `${path.slice(0, dot)}-${i}${path.slice(dot)}` : `${path}-${i}`
      i++
    }
    used.add(p)
    zip.file(p, content)
  }

  const codeFiles: string[] = []
  const docs: string[] = []

  for (const a of r.artifacts) {
    if (a.kind === 'code' && a.filename) {
      put(a.filename.replace(/^\/+/, ''), a.body)
      codeFiles.push(a.filename)
    } else {
      const name = `docs/${slug(a.title)}.md`
      put(name, `# ${a.title}\n\n_${a.agentName} — ${a.agentRole}_\n\n${a.body}\n`)
      docs.push(a.title)
    }
  }

  const readme = [
    `# ${r.task || r.modeName}`,
    ``,
    `Scaffolded by **Hive** — ${r.modeEmoji} ${r.modeName}. ${new Date(r.ts).toLocaleString()}`,
    ``,
    codeFiles.length ? `## Files\n${codeFiles.map((f) => `- \`${f}\``).join('\n')}` : '',
    docs.length ? `\n## Docs\n${docs.map((d) => `- ${d}`).join('\n')}` : '',
    ``,
    `Open **WHATS_LEFT.md** for what remains to be built.`,
    ``,
  ]
    .filter(Boolean)
    .join('\n')
  put('README.md', readme)
  // full transcript as a bonus
  put('docs/session.md', runToMarkdown(r))

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hive-${slug(r.task || r.modeName)}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
