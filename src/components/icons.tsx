// Icon set — Font Awesome Solid (the free "fill" style by Dave Gandy).
// Wrapped to mirror the lucide API (size/className/style) so usage stays unchanged.
import type { CSSProperties } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { config, type IconDefinition } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import {
  faBars,
  faHexagonNodes,
  faBolt,
  faWandMagicSparkles,
  faMicrochip,
  faDownload,
  faTrash,
  faClock,
  faChevronDown,
  faArrowRight,
  faFileLines,
  faTowerBroadcast,
  faPlay,
  faArrowRotateLeft,
  faSpinner,
  faGlobe,
  faUsers,
  faCodeBranch,
  faPaperPlane,
  faAnglesLeft,
  faAnglesRight,
  faPlus,
  faClockRotateLeft,
  faGear,
  faPencil,
  faKey,
  faArrowUpRightFromSquare,
  faCheck,
  faCopy,
  faFileCode,
  faFilePdf,
  faFileZipper,
  faXmark,
  faListCheck,
} from '@fortawesome/free-solid-svg-icons'

config.autoAddCss = false

interface IconProps {
  size?: number
  className?: string
  style?: CSSProperties
  strokeWidth?: number // accepted for API parity with lucide; ignored (solid icons have no stroke)
}

const make = (icon: IconDefinition) =>
  function Icon({ size = 16, className, style }: IconProps) {
    return <FontAwesomeIcon icon={icon} className={className} style={{ fontSize: size, ...style }} />
  }

export const Menu = make(faBars)
export const Hexagon = make(faHexagonNodes)
export const Zap = make(faBolt)
export const Sparkles = make(faWandMagicSparkles)
export const Cpu = make(faMicrochip)
export const Download = make(faDownload)
export const Trash2 = make(faTrash)
export const Clock = make(faClock)
export const ChevronDown = make(faChevronDown)
export const ArrowRight = make(faArrowRight)
export const FileText = make(faFileLines)
export const Radio = make(faTowerBroadcast)
export const Play = make(faPlay)
export const RotateCcw = make(faArrowRotateLeft)
export const Loader2 = make(faSpinner)
export const Globe = make(faGlobe)
export const Users = make(faUsers)
export const GitBranch = make(faCodeBranch)
export const SendHorizonal = make(faPaperPlane)
export const PanelLeftClose = make(faAnglesLeft)
export const PanelLeft = make(faAnglesRight)
export const Plus = make(faPlus)
export const History = make(faClockRotateLeft)
export const Settings = make(faGear)
export const Pencil = make(faPencil)
export const KeyRound = make(faKey)
export const ExternalLink = make(faArrowUpRightFromSquare)
export const Check = make(faCheck)
export const ClipboardCopy = make(faCopy)
export const FileCode2 = make(faFileCode)
export const FileDown = make(faFilePdf)
export const FolderDown = make(faFileZipper)
export const X = make(faXmark)
export const ListChecks = make(faListCheck)
