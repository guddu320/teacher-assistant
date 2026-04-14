import { useCallback, useEffect, useRef, useState } from 'react'
import { createEmptyWeekGrid } from '../lib/scheduleMerge'
import {
  DAYS,
  SLOTS,
  type AppData,
  type ClassRecord,
  type Note,
  type ScheduleState,
  type Student,
  type WeekGrid,
  isAppData,
} from '../types/appData'

export const STORAGE_KEY = 'teacher-assistant:data'

const SAVE_DEBOUNCE_MS = 300

function normalizeWeekGrid(grid: unknown): WeekGrid {
  const empty = createEmptyWeekGrid()
  if (!Array.isArray(grid)) return empty
  for (let d = 0; d < DAYS; d++) {
    const row = grid[d]
    if (!Array.isArray(row)) continue
    for (let s = 0; s < SLOTS; s++) {
      const cell = row[s]
      if (cell && typeof cell === 'object' && 'classId' in cell) {
        const id = (cell as { classId: unknown }).classId
        empty[d][s] = {
          classId: id === null || typeof id === 'string' ? id : null,
        }
      }
    }
  }
  return empty
}

function normalizeSchedule(raw: unknown): ScheduleState {
  const perm =
    raw &&
    typeof raw === 'object' &&
    'permanent' in raw &&
    (raw as ScheduleState).permanent
      ? normalizeWeekGrid((raw as ScheduleState).permanent)
      : createEmptyWeekGrid()
  const overrides: Record<string, WeekGrid> = {}
  if (raw && typeof raw === 'object' && 'dailyOverrides' in raw) {
    const dO = (raw as ScheduleState).dailyOverrides
    if (dO && typeof dO === 'object') {
      for (const k of Object.keys(dO)) {
        overrides[k] = normalizeWeekGrid(dO[k])
      }
    }
  }
  return { permanent: perm, dailyOverrides: overrides }
}

function normalizeNotes(raw: unknown): Note[] {
  const notes = Array.isArray(raw) ? raw : []
  return notes.filter(
    (n): n is Note =>
      !!n &&
      typeof n === 'object' &&
      typeof (n as { id: unknown }).id === 'string' &&
      typeof (n as { content: unknown }).content === 'string' &&
      typeof (n as { timestamp: unknown }).timestamp === 'string' &&
      typeof (n as { type: unknown }).type === 'string',
  )
}

function normalizeStudent(s: unknown): Student | null {
  if (!s || typeof s !== 'object') return null
  const o = s as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
  return {
    id: o.id,
    name: o.name,
    notes: normalizeNotes(o.notes),
  }
}

function normalizeClass(c: unknown): ClassRecord | null {
  if (!c || typeof c !== 'object') return null
  const o = c as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string' || typeof o.subject !== 'string')
    return null
  const studentIds = Array.isArray(o.studentIds)
    ? o.studentIds.filter((id): id is string => typeof id === 'string')
    : []
  return {
    id: o.id,
    name: o.name,
    subject: o.subject,
    studentIds,
    notes: normalizeNotes(o.notes),
  }
}

export function normalizeAppData(raw: AppData): AppData {
  const classes = raw.classes.map(normalizeClass).filter(Boolean) as ClassRecord[]
  const students = raw.students.map(normalizeStudent).filter(Boolean) as Student[]
  const schedule = normalizeSchedule(raw.schedule)
  return { classes, students, schedule }
}

async function loadInitial(): Promise<AppData> {
  const fromLs = localStorage.getItem(STORAGE_KEY)
  if (fromLs) {
    try {
      const parsed: unknown = JSON.parse(fromLs)
      if (isAppData(parsed)) return normalizeAppData(parsed)
    } catch {
      /* fall through */
    }
  }
  const res = await fetch('/data.json')
  if (!res.ok) throw new Error(`Failed to load seed: ${res.status}`)
  const seed: unknown = await res.json()
  if (!isAppData(seed)) throw new Error('Invalid seed data.json')
  const normalized = normalizeAppData(seed)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export type FileSystemStatus = 'loading' | 'ready' | 'error'

export function useFileSystem() {
  const [data, setData] = useState<AppData | null>(null)
  const [status, setStatus] = useState<FileSystemStatus>('loading')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((next: AppData) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      timerRef.current = null
    }, SAVE_DEBOUNCE_MS)
  }, [])

  const saveImmediate = useCallback((next: AppData) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const update = useCallback(
    (fn: (prev: AppData) => AppData) => {
      setData((prev) => {
        if (!prev) return prev
        const next = normalizeAppData(fn(prev))
        persist(next)
        return next
      })
    },
    [persist],
  )

  const replace = useCallback(
    (next: AppData) => {
      const n = normalizeAppData(next)
      setData(n)
      persist(n)
    },
    [persist],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const initial = await loadInitial()
        if (!cancelled) {
          setData(initial)
          setStatus('ready')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { data, status, update, replace, saveImmediate }
}
