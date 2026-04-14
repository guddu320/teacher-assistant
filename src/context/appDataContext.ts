import { createContext } from 'react'
import type { ImportCsvResult } from '../lib/csvClassImport'
import type { AppData, ClassRecord, Note, Student, WeekGrid } from '../types/appData'

export type AppDataContextValue = {
  data: AppData | null
  status: 'loading' | 'ready' | 'error'
  update: (fn: (prev: AppData) => AppData) => void
  replace: (next: AppData) => void
  getClassById: (id: string) => ClassRecord | undefined
  getStudentById: (id: string) => Student | undefined
  studentsForClass: (c: ClassRecord) => Student[]
  addNote: (studentId: string, note: Note) => void
  addClassNote: (classId: string, note: Note) => void
  importClassesFromCsv: (csvText: string) => ImportCsvResult
  commitDailyOverride: (dateKey: string, snapshot: WeekGrid) => void
  effectiveBase: (dateKey: string) => WeekGrid | null
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)
