// Icon set — Lucide (thin outline, modern). One import barrel so components can
// swap freely. Plus semantic pickers that turn a mode/agent into a real icon
// (no more emoji doing icon duty).
export {
  Menu,
  Hexagon,
  Zap,
  Sparkles,
  Cpu,
  Download,
  Trash2,
  Clock,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Radio,
  Play,
  RotateCcw,
  Loader2,
  Globe,
  Users,
  GitBranch,
  SendHorizonal,
  PanelLeftClose,
  PanelLeft,
  Plus,
  History,
  Settings,
  Pencil,
  KeyRound,
  ExternalLink,
  Check,
  ClipboardCopy,
  FileCode2,
  FileDown,
  FolderDown,
  X,
  ListChecks,
  Circle,
  Eye,
  ImagePlus,
  LogIn,
  LogOut,
  UserRound,
} from 'lucide-react'

import {
  type LucideIcon,
  Hexagon as HexIcon,
  Sparkles as SparkIcon,
  Compass,
  Zap as ZapIcon,
  PenTool,
  Siren,
  Code2,
  Microscope,
  Palette,
  ShieldCheck,
  Target,
  Megaphone,
  Wrench,
  FileText as FileIcon,
  Rocket,
  Brain,
} from 'lucide-react'
import type { Agent, ModeConfig } from '../types'

/** A real icon for a mode (built-ins mapped; custom → hexagon). */
export function modeIconOf(m: ModeConfig): LucideIcon {
  switch (m.id) {
    case 'auto':
      return SparkIcon
    case 'normal':
      return Compass
    case 'hackathon':
      return ZapIcon
    case 'content':
      return PenTool
    case 'incident':
      return Siren
  }
  return HexIcon
}

/** Mode icon when you only have the id (e.g. saved history records). */
export function modeIconById(id: string): LucideIcon {
  return modeIconOf({ id } as ModeConfig)
}

/** A real icon inferred from a coworker's role/tag — works for generated teams too. */
export function agentIconOf(a: Agent): LucideIcon {
  const s = `${a.tag ?? ''} ${a.role} ${a.id} ${a.name}`.toLowerCase()
  if (/eng|dev|build|code|architect|program|forge|backend|frontend/.test(s)) return Code2
  if (/research|scout|analy|data|insight|discover|market read/.test(s)) return Microscope
  if (/design|ux|ui|creativ|art|brand/.test(s)) return Palette
  if (/qa|qual|review|test|guard|audit/.test(s)) return ShieldCheck
  if (/strateg|product|plan|lead|manage|command|coordinat|pm/.test(s)) return Target
  if (/writ|content|edit|story|copy|pitch|narrat|script|comms/.test(s)) return PenTool
  if (/market|growth|distrib|sales|reach|advocate/.test(s)) return Megaphone
  if (/incident|ops|support|mitigat|reliab|infra/.test(s)) return Wrench
  if (/doc|scribe|postmortem|record|note/.test(s)) return FileIcon
  if (/launch|mvp|ship|demo|deliver/.test(s)) return Rocket
  return Brain
}
