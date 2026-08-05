import type { ModeConfig, RunRecord } from '../types'
import { builtInModes } from '../data/modes'

const MODES_KEY = 'hive.modes.v1'
const KEY_KEY = 'hive.geminiKey.v1'
const ACTIVE_KEY = 'hive.activeMode.v1'
const HISTORY_KEY = 'hive.history.v1'
const WEB_KEY = 'hive.webAccess.v1'
const HISTORY_CAP = 40

/** Load modes: built-ins always present + any user-created custom modes. */
export function loadModes(): ModeConfig[] {
  try {
    const raw = localStorage.getItem(MODES_KEY)
    const custom: ModeConfig[] = raw ? JSON.parse(raw) : []
    // built-ins are canonical (never overwritten by storage); custom appended
    const customOnly = custom.filter((m) => !m.builtIn)
    return [...builtInModes, ...customOnly]
  } catch {
    return [...builtInModes]
  }
}

/** Persist only the custom (non-built-in) modes. */
export function saveModes(modes: ModeConfig[]) {
  try {
    const custom = modes.filter((m) => !m.builtIn)
    localStorage.setItem(MODES_KEY, JSON.stringify(custom))
  } catch {
    /* storage unavailable */
  }
}

export function loadApiKey(): string {
  try {
    return localStorage.getItem(KEY_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveApiKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_KEY, key)
    else localStorage.removeItem(KEY_KEY)
  } catch {
    /* storage unavailable */
  }
}

export function loadActiveModeId(): string {
  try {
    return localStorage.getItem(ACTIVE_KEY) ?? 'auto'
  } catch {
    return 'auto'
  }
}

export function saveActiveModeId(id: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, id)
  } catch {
    /* storage unavailable */
  }
}

/** Live web access defaults ON (opt-out), so grounded runs work out of the box. */
export function loadWebAccess(): boolean {
  try {
    return localStorage.getItem(WEB_KEY) !== '0'
  } catch {
    return true
  }
}

export function saveWebAccess(on: boolean) {
  try {
    localStorage.setItem(WEB_KEY, on ? '1' : '0')
  } catch {
    /* storage unavailable */
  }
}

export function loadHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as RunRecord[]) : []
  } catch {
    return []
  }
}

export function saveHistory(history: RunRecord[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_CAP)))
  } catch {
    /* storage unavailable */
  }
}
