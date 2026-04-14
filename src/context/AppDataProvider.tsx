import { useCallback, useMemo, type ReactNode } from 'react'
import { useFileSystem } from '../hooks/useFileSystem'
import { runClassRosterImport } from '../lib/csvClassImport'
import { effectiveBaseGrid } from '../lib/scheduleMerge'
import type { ClassRecord, Note, WeekGrid } from '../types/appData'
import { AppDataContext } from './appDataContext'

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { data, status, update, replace } = useFileSystem()

  const getClassById = useCallback(
    (id: string) => data?.classes.find((c) => c.id === id),
    [data],
  )

  const getStudentById = useCallback(
    (id: string) => data?.students.find((s) => s.id === id),
    [data],
  )

  const studentsForClass = useCallback(
    (c: ClassRecord) => {
      if (!data) return []
      const set = new Set(c.studentIds)
      return data.students.filter((s) => set.has(s.id))
    },
    [data],
  )

  const addNote = useCallback(
    (studentId: string, note: Note) => {
      update((d) => ({
        ...d,
        students: d.students.map((s) =>
          s.id === studentId ? { ...s, notes: [note, ...s.notes] } : s,
        ),
      }))
    },
    [update],
  )

  const addClassNote = useCallback(
    (classId: string, note: Note) => {
      update((d) => ({
        ...d,
        classes: d.classes.map((c) =>
          c.id === classId ? { ...c, notes: [note, ...c.notes] } : c,
        ),
      }))
    },
    [update],
  )

  const importClassesFromCsv = useCallback(
    (csvText: string) => {
      if (!data) {
        return { ok: false as const, errors: ['Data not loaded yet.'] }
      }
      const result = runClassRosterImport(data, csvText)
      if (!result.ok) return result
      update(() => result.data)
      return result
    },
    [data, update],
  )

  const commitDailyOverride = useCallback(
    (dateKey: string, snapshot: WeekGrid) => {
      update((d) => ({
        ...d,
        schedule: {
          ...d.schedule,
          dailyOverrides: {
            ...d.schedule.dailyOverrides,
            [dateKey]: snapshot,
          },
        },
      }))
    },
    [update],
  )

  const effectiveBase = useCallback(
    (dateKey: string) => {
      if (!data) return null
      return effectiveBaseGrid(
        data.schedule.permanent,
        data.schedule.dailyOverrides,
        dateKey,
      )
    },
    [data],
  )

  const value = useMemo(
    () => ({
      data,
      status,
      update,
      replace,
      getClassById,
      getStudentById,
      studentsForClass,
      addNote,
      addClassNote,
      importClassesFromCsv,
      commitDailyOverride,
      effectiveBase,
    }),
    [
      data,
      status,
      update,
      replace,
      getClassById,
      getStudentById,
      studentsForClass,
      addNote,
      addClassNote,
      importClassesFromCsv,
      commitDailyOverride,
      effectiveBase,
    ],
  )

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}
