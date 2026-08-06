import type { RunArtifact, RunRecord } from '../types'

function isNarrative(a: RunArtifact): boolean {
  if (a.kind !== 'code') return true
  const f = (a.filename ?? '').toLowerCase()
  const l = (a.language ?? '').toLowerCase()
  return /\.(md|markdown|txt|rst)$/.test(f) || ['md', 'markdown', 'txt'].includes(l)
}

/** Render a completed run as a structured Markdown brief: notes (words) first, code files last. */
export function runToMarkdown(r: RunRecord): string {
  const header = `# The Hive — ${r.task || r.modeName}\n\n_${r.modeName} · ${r.engineName} engine · ${new Date(r.ts).toLocaleString()}_\n`

  const docs = r.artifacts.filter(isNarrative)
  const code = r.artifacts.filter((a) => !isNarrative(a))

  const noteBlock = (a: RunArtifact) => {
    const src = a.sources?.length ? `\n\n**Sources**\n${a.sources.map((s) => `- [${s.title}](${s.uri})`).join('\n')}` : ''
    return `### ${a.title}\n*${a.agentName} — ${a.agentRole}*\n\n${a.body}${src}`
  }
  const codeBlock = (a: RunArtifact) =>
    `### \`${a.filename || a.title}\`\n*${a.agentName} — ${a.agentRole}*\n\n\`\`\`${a.language ?? ''}\n${a.body}\n\`\`\``

  const parts: string[] = [header]
  if (docs.length) parts.push(`\n## Notes\n\n${docs.map(noteBlock).join('\n\n---\n\n')}`)
  if (code.length) parts.push(`\n## Files\n\n${code.map(codeBlock).join('\n\n---\n\n')}`)
  return parts.join('\n') + '\n'
}

/** Trigger a browser download of a run as a .md file. */
export function downloadRun(r: RunRecord) {
  const blob = new Blob([runToMarkdown(r)], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const slug = (r.task || r.modeName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  a.href = url
  a.download = `hive-${slug || 'run'}.md`
  a.click()
  URL.revokeObjectURL(url)
}
