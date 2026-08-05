import type { Agent, ModeConfig } from '../types'

/** Built-in preset: a standard product-delivery org. */
export const normalMode: ModeConfig = {
  id: 'normal',
  name: 'Product Delivery',
  emoji: '🧭',
  accent: '#6d7cff',
  tagline: 'From a fuzzy ask to a shipped, reviewed feature.',
  builtIn: true,
  agents: [
    {
      id: 'pm',
      name: 'Ada',
      role: 'Product Manager',
      emoji: '🧭',
      color: '#6d7cff',
      blurb: 'Turns a fuzzy ask into a scoped plan and keeps everyone pointed at the outcome.',
      skills: ['Scoping', 'Prioritisation', 'User stories'],
      tag: 'Product',
    },
    {
      id: 'research',
      name: 'Noor',
      role: 'Researcher',
      emoji: '🔬',
      color: '#3fd0c9',
      blurb: 'Digs into the domain, users, and constraints so the team builds the right thing.',
      skills: ['Discovery', 'Synthesis', 'Competitive scan'],
      tag: 'Research',
    },
    {
      id: 'design',
      name: 'Kai',
      role: 'Designer',
      emoji: '🎨',
      color: '#ff7ab6',
      blurb: 'Shapes the flow and interface so the solution is obvious to use.',
      skills: ['UX flows', 'UI system', 'Prototyping'],
      tag: 'Design',
    },
    {
      id: 'eng',
      name: 'Rex',
      role: 'Engineer',
      emoji: '⚙️',
      color: '#f5c451',
      blurb: 'Builds the thing — pragmatic, ships, leaves a clean seam for the next change.',
      skills: ['Architecture', 'Implementation', 'Integration'],
      tag: 'Engineering',
    },
    {
      id: 'qa',
      name: 'Vee',
      role: 'QA & Reviewer',
      emoji: '🛡️',
      color: '#8b96ff',
      blurb: 'Pressure-tests the work, catches the sharp edges, signs off before it ships.',
      skills: ['Test plans', 'Edge cases', 'Sign-off'],
      tag: 'Quality',
    },
  ],
  stages: [
    { id: 'scope', title: 'Scope the ask', ownerId: 'pm', goal: 'Clarify the outcome, users, and what "done" means.', produces: 'Scope brief' },
    { id: 'discover', title: 'Discovery', ownerId: 'research', goal: 'Understand the domain, users, and constraints.', produces: 'Research notes' },
    { id: 'shape', title: 'Design the flow', ownerId: 'design', goal: 'Lay out the UX flow and interface approach.', produces: 'Design outline' },
    { id: 'build', title: 'Build it', ownerId: 'eng', goal: 'Implement the solution against the scope.', produces: 'Implementation plan' },
    { id: 'review', title: 'Review & sign-off', ownerId: 'qa', goal: 'Pressure-test, list edge cases, sign off.', produces: 'QA report' },
  ],
}

/** Built-in preset: a lean hackathon build-and-pitch squad. */
export const hackathonMode: ModeConfig = {
  id: 'hackathon',
  name: 'Hackathon Sprint',
  emoji: '⚡',
  accent: '#ff7a45',
  tagline: 'Research a real company, find a problem, build, and pitch.',
  builtIn: true,
  agents: [
    {
      id: 'scout',
      name: 'Scout',
      role: 'Company & Problem Scout',
      emoji: '🛰️',
      color: '#ff7a45',
      blurb: 'Researches a real target company and surfaces the sharpest problem worth solving.',
      skills: ['Company research', 'Problem hunting', 'Market read'],
      tag: 'Research',
    },
    {
      id: 'strat',
      name: 'Iris',
      role: 'Strategist',
      emoji: '♟️',
      color: '#ffb347',
      blurb: 'Frames the opportunity, picks the wedge, and defines what winning looks like.',
      skills: ['Positioning', 'Wedge', 'Success metric'],
      tag: 'Strategy',
    },
    {
      id: 'builder',
      name: 'Forge',
      role: 'Builder',
      emoji: '🚀',
      color: '#ff9d6e',
      blurb: 'Turns the concept into a demo-able MVP scope the team can ship overnight.',
      skills: ['MVP scoping', 'Stack pick', 'Demo plan'],
      tag: 'Engineering',
    },
    {
      id: 'pitch',
      name: 'Echo',
      role: 'Pitch Writer',
      emoji: '🎤',
      color: '#ffd07a',
      blurb: 'Packages the story into a punchy pitch judges remember.',
      skills: ['Narrative', 'Deck outline', 'Demo script'],
      tag: 'Story',
    },
  ],
  stages: [
    { id: 'target', title: 'Pick the company', ownerId: 'scout', goal: 'Research a real target company and its context.', produces: 'Company dossier' },
    { id: 'problem', title: 'Find the problem', ownerId: 'scout', goal: 'Surface the sharpest real problem worth solving for them.', produces: 'Problem statement' },
    { id: 'wedge', title: 'Frame the wedge', ownerId: 'strat', goal: 'Position the opportunity and define what winning looks like.', produces: 'Strategy brief' },
    { id: 'mvp', title: 'Scope the MVP', ownerId: 'builder', goal: 'Define a demo-able build the team can ship overnight.', produces: 'MVP plan' },
    { id: 'pitch', title: 'Write the pitch', ownerId: 'pitch', goal: 'Package the story into a judge-ready pitch + demo script.', produces: 'Pitch outline' },
  ],
}

/** Built-in preset: turn a topic into published, on-brand content. */
export const contentMode: ModeConfig = {
  id: 'content',
  name: 'Content Studio',
  emoji: '✍️',
  accent: '#8b5cf6',
  tagline: 'Turn a topic into a published, on-brand piece.',
  builtIn: true,
  agents: [
    { id: 'strategist', name: 'Vera', role: 'Content Strategist', emoji: '🎯', color: '#8b5cf6', blurb: 'Finds the angle and the audience the piece is really for.', skills: ['Angle', 'Audience', 'Outline'], tag: 'Strategy' },
    { id: 'writer', name: 'Milo', role: 'Writer', emoji: '✍️', color: '#a78bfa', blurb: 'Drafts it in a clear, human voice that keeps people reading.', skills: ['Drafting', 'Voice', 'Hooks'], tag: 'Editorial' },
    { id: 'editor', name: 'Sage', role: 'Editor', emoji: '📝', color: '#c4b5fd', blurb: 'Tightens every line and kills the fluff.', skills: ['Line edits', 'Clarity', 'Trim'], tag: 'Editorial' },
    { id: 'distributor', name: 'Nova', role: 'Distribution', emoji: '📣', color: '#7c3aed', blurb: 'Repackages it for each channel so it actually gets seen.', skills: ['Channels', 'Repurposing', 'CTA'], tag: 'Growth' },
  ],
  stages: [
    { id: 'angle', title: 'Find the angle', ownerId: 'strategist', goal: 'Pick the sharpest angle for a specific audience.', produces: 'Content brief' },
    { id: 'draft', title: 'Write the draft', ownerId: 'writer', goal: 'Draft the piece in a clear, engaging voice.', produces: 'First draft' },
    { id: 'edit', title: 'Edit & tighten', ownerId: 'editor', goal: 'Cut fluff and sharpen every line.', produces: 'Edited copy' },
    { id: 'distribute', title: 'Package for channels', ownerId: 'distributor', goal: 'Adapt it into posts for each channel.', produces: 'Distribution pack' },
  ],
}

/** Built-in preset: coordinate a production incident to resolution. */
export const incidentMode: ModeConfig = {
  id: 'incident',
  name: 'Incident War Room',
  emoji: '🚨',
  accent: '#ef4444',
  tagline: 'Triage, mitigate, and close out a production incident.',
  builtIn: true,
  agents: [
    { id: 'ic', name: 'Rhea', role: 'Incident Commander', emoji: '📟', color: '#ef4444', blurb: 'Runs the incident, keeps everyone coordinated and calm.', skills: ['Coordination', 'Comms', 'Decisions'], tag: 'Command' },
    { id: 'debugger', name: 'Cole', role: 'Debugger', emoji: '🔍', color: '#f87171', blurb: 'Traces the failure to its root cause fast.', skills: ['Root cause', 'Logs', 'Repro'], tag: 'Engineering' },
    { id: 'mitigator', name: 'Ivy', role: 'Mitigator', emoji: '🩹', color: '#fb923c', blurb: 'Ships the fastest safe fix to stop the bleeding.', skills: ['Rollback', 'Hotfix', 'Guardrails'], tag: 'Ops' },
    { id: 'scribe', name: 'Wren', role: 'Postmortem Scribe', emoji: '📄', color: '#fca5a5', blurb: 'Captures the timeline and the blameless learnings.', skills: ['Timeline', 'Postmortem', 'Actions'], tag: 'Docs' },
  ],
  stages: [
    { id: 'triage', title: 'Triage', ownerId: 'ic', goal: 'Assess severity, scope, and who is impacted.', produces: 'Incident summary' },
    { id: 'diagnose', title: 'Diagnose', ownerId: 'debugger', goal: 'Find the root cause of the failure.', produces: 'Root-cause analysis' },
    { id: 'mitigate', title: 'Mitigate', ownerId: 'mitigator', goal: 'Ship the fastest safe fix to restore service.', produces: 'Mitigation plan' },
    { id: 'postmortem', title: 'Postmortem', ownerId: 'scribe', goal: 'Write the blameless postmortem and action items.', produces: 'Postmortem doc' },
  ],
}

/** The Auto sentinel — no fixed roster. The hive assembles a team for whatever task you give it. */
export const autoMode: ModeConfig = {
  id: 'auto',
  name: 'Auto',
  emoji: '✨',
  accent: '#6d7cff',
  tagline: 'Type a task — the hive assembles the right team for it.',
  builtIn: true,
  agents: [],
  stages: [],
}

export const builtInModes: ModeConfig[] = [autoMode, normalMode, hackathonMode, contentMode, incidentMode]

export function agentIn(mode: ModeConfig, id: string): Agent | undefined {
  return mode.agents.find((a) => a.id === id)
}
