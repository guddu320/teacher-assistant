export const DAYS = 5
export const SLOTS = 9

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

export type NoteType = 'text' | 'image' | 'voice'

export interface Note {
  id: string
  content: string
  timestamp: string
  type: NoteType
  imageUrl?: string
}

export interface Student {
  id: string
  name: string
  notes: Note[]
}

export interface ClassRecord {
  id: string
  name: string
  subject: string
  studentIds: string[]
  notes: Note[]
}

export interface ScheduleCell {
  classId: string | null
}

/** [dayIndex 0–4][slotIndex 0–8] */
export type WeekGrid = ScheduleCell[][]

export interface ScheduleState {
  permanent: WeekGrid
  dailyOverrides: Record<string, WeekGrid>
}

export interface AppData {
  classes: ClassRecord[]
  students: Student[]
  schedule: ScheduleState
}

export function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    Array.isArray(o.classes) &&
    Array.isArray(o.students) &&
    o.schedule !== null &&
    typeof o.schedule === 'object'
  )
}
