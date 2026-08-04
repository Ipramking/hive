import type { Engine, StageInput, StageResult } from './types'

/* ------------------------------------------------------------------ */
/* Deterministic offline engine — runs with zero API keys.            */
/* Works for ANY mode: built-in stages get bespoke templates,         */
/* custom stages fall back to a solid generic generator.              */
/* ------------------------------------------------------------------ */

const bullets = (items: string[]) => items.map((i) => `• ${i}`).join('\n')

function lower(s: string) {
  const t = s.trim().replace(/[.!?]+$/, '')
  return t.charAt(0).toLowerCase() + t.slice(1)
}

type Gen = (task: string) => StageResult

const templates: Record<string, Gen> = {
  /* ---- Product Delivery ---- */
  scope: (task) => ({
    thinking: [`Reading the ask: "${task}".`, 'Separating outcome from feature request.', 'Naming the primary user and their moment.'],
    artifactBody: [
      `Outcome: a fast, obvious way to ${lower(task)}.`,
      '',
      'In scope:',
      bullets(['The core happy path', 'One clear entry point', 'A visible, trustworthy result']),
      '',
      'Out of scope (v1):',
      bullets(['Edge configuration', 'Admin controls', 'Bulk operations']),
      '',
      'Done means: a user completes the flow end-to-end without help.',
    ].join('\n'),
    handoff: 'Scope is tight — over to discovery.',
  }),
  discover: (task) => ({
    thinking: ['Mapping who touches this and where it breaks.', 'Scanning comparable solutions and gaps.', 'Pulling out the constraints.'],
    artifactBody: [
      'Today, users:',
      bullets(['Work around it manually', 'Copy between tools', 'Lose context on handoff']),
      '',
      'Constraints:',
      bullets(['Fit existing habits', 'Fast feedback loop', 'Works on phone + desktop']),
      '',
      `Insight: the win for "${lower(task)}" is removing steps, not adding features.`,
    ].join('\n'),
    handoff: 'Users want fewer steps — design the shortest path.',
  }),
  shape: (task) => ({
    thinking: ['Sketching the shortest flow.', 'Deciding one screen vs. progressive disclosure.', 'Picking a familiar pattern.'],
    artifactBody: [
      'Flow (3 steps):',
      bullets(['1. State intent', '2. Review the result', '3. Confirm / act']),
      '',
      'Layout:',
      bullets(['One always-visible primary action', 'Result inline, not a new page', 'Empty / loading / done states designed']),
      '',
      `North star: a first-timer can ${lower(task)} without instructions.`,
    ].join('\n'),
    handoff: 'Flow is 3 steps — build against this.',
  }),
  build: (task) => ({
    thinking: ['Choosing a stack that ships today.', 'Defining seams for cheap next changes.', 'Ordering the build, riskiest first.'],
    artifactBody: [
      'Architecture:',
      bullets(['Thin client, single state store', 'Pluggable engine behind one interface', 'Deterministic fallback so it always runs']),
      '',
      'Build order:',
      bullets(['1. Data model + state', '2. Core flow end-to-end', '3. Polish states & motion']),
      '',
      `Result: a working path to ${lower(task)}, demo-ready.`,
    ].join('\n'),
    handoff: 'Build is up — pressure-test it.',
  }),
  review: (task) => ({
    thinking: ['Running the happy path, then breaking it.', 'Checking empty, slow, and error states.', 'Deciding if it ships.'],
    artifactBody: [
      'Happy path: passes end-to-end.',
      '',
      'Edge cases:',
      bullets(['Empty input handled', 'Long input keeps layout', 'Re-run is idempotent']),
      '',
      `Verdict: ready to ship the v1 that lets users ${lower(task)}. ✅`,
    ].join('\n'),
    handoff: 'Signed off — ready to ship.',
  }),

  /* ---- Hackathon Sprint ---- */
  target: (task) => ({
    thinking: [`Interpreting the brief: "${task}".`, 'Shortlisting real companies where this bites hardest.', 'Picking one with a researchable surface.'],
    artifactBody: [
      'Target: a mid-size player in the space named in the brief',
      '(swap in the real name once confirmed — the frame holds).',
      '',
      'Why them:',
      bullets(['Feels the problem daily', 'Big enough to pay, small enough to move', 'Public surface to research']),
      '',
      `Signal: "${lower(task)}" maps to a cost they already carry.`,
    ].join('\n'),
    handoff: 'Target locked — now the sharpest problem.',
  }),
  problem: (task) => ({
    thinking: ['Separating symptoms from root cause.', 'Finding the one problem that unlocks the rest.', 'Framing it for a judge.'],
    artifactBody: [
      'Problem statement:',
      `Today they do "${lower(task)}" through slow, manual, error-prone work.`,
      'It costs hours per week and the output is inconsistent.',
      '',
      'Why now:',
      bullets(['Volume outgrows headcount', 'Tolerance for manual work is dropping', 'AI finally makes the automated version viable']),
      '',
      'One-liner: "They spend their best hours on work software should do."',
    ].join('\n'),
    handoff: 'Problem is sharp — frame the wedge.',
  }),
  wedge: (task) => ({
    thinking: ['Positioning against the manual status quo.', 'Choosing the narrow wedge to win first.', 'Defining a metric judges can hold us to.'],
    artifactBody: [
      'Wedge: own the single most painful step first, then expand.',
      '',
      'Positioning:',
      bullets(['Not "another dashboard" — a coworker that does the task', 'Drops into existing habits', 'Value in the first 60 seconds']),
      '',
      'Winning looks like:',
      bullets(['Cut time-on-task by 80%', 'Zero new tools to learn', 'Trustworthy output by default']),
      '',
      `Bet: solving "${lower(task)}" as an agent, not a form, is the unlock.`,
    ].join('\n'),
    handoff: 'Wedge is clear — scope the MVP.',
  }),
  mvp: (task) => ({
    thinking: ['Cutting scope to what proves the bet.', 'Picking a stack to ship overnight.', 'Planning the moment judges lean in.'],
    artifactBody: [
      'MVP (demo-able overnight):',
      bullets(['One flow: intent → agent does the task → reviewable result', 'Deterministic fallback so the demo never fails', 'One clear "wow" moment']),
      '',
      'Stack: Vite + React + TS + Tailwind, pluggable AI engine, deploy to Vercel.',
      '',
      `Demo goal: show the agent complete "${lower(task)}" live, faster than a human.`,
    ].join('\n'),
    handoff: 'MVP scoped — write the pitch.',
  }),
  pitch: (task) => ({
    thinking: ['Finding the one sentence the room remembers.', 'Structuring pain → shift → demo → ask.', 'Writing the demo script.'],
    artifactBody: [
      'Hook: "Their best people spend the day on work software should do."',
      '',
      'Arc:',
      bullets(['1. The pain — concrete, costed, daily', '2. The shift — an AI coworker, not another tool', '3. The demo — watch it do the task live', '4. The ask — what we need to go bigger']),
      '',
      `Closing line: "We built the coworker that already knows how to ${lower(task)}."`,
    ].join('\n'),
    handoff: 'Pitch is ready — the sprint is complete. 🏁',
  }),
}

function generic({ task, stage, agent }: StageInput): StageResult {
  return {
    thinking: [
      `Picking up "${stage.title}".`,
      `Working toward: ${lower(stage.goal)}`,
      `Shaping the ${stage.produces.toLowerCase()} as ${agent.role}.`,
    ],
    artifactBody: [
      `${stage.produces} for "${task}":`,
      '',
      bullets([
        `Goal: ${stage.goal}`,
        `Approach: the shortest path that ${lower(stage.goal)}`,
        'Key decisions locked, open questions flagged',
        'Ready for the next teammate to build on',
      ]),
    ].join('\n'),
    handoff: `${stage.produces} is ready — handing off.`,
  }
}

export const simEngine: Engine = {
  name: 'offline',
  async runStage(input) {
    const cleanTask = input.task.trim() || 'the task'
    const tmpl = templates[input.stage.id]
    if (tmpl) return tmpl(cleanTask)
    return generic({ ...input, task: cleanTask })
  },
}
