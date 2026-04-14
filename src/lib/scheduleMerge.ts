import {
  DAYS,
  SLOTS,
  type ScheduleCell,
  type WeekGrid,
} from '../types/appData'

export function createEmptyWeekGrid(): WeekGrid {
  return Array.from({ length: DAYS }, () =>
    Array.from({ length: SLOTS }, (): ScheduleCell => ({ classId: null })),
  )
}

/** Override wins for every cell when `overlay` is defined. */
export function mergeGrids(base: WeekGrid, overlay: WeekGrid | null | undefined): WeekGrid {
  if (!overlay) return base
  const out: WeekGrid = []
  for (let d = 0; d < DAYS; d++) {
    const row: ScheduleCell[] = []
    for (let s = 0; s < SLOTS; s++) {
      const o = overlay[d]?.[s]
      row.push(o ? { classId: o.classId } : { ...base[d][s] })
    }
    out.push(row)
  }
  return out
}

/** Base grid for a calendar day: full snapshot override if present, else permanent. */
export function effectiveBaseGrid(
  permanent: WeekGrid,
  dailyOverrides: Record<string, WeekGrid>,
  dateKey: string,
): WeekGrid {
  return dailyOverrides[dateKey] ?? permanent
}

export function cloneWeekGrid(grid: WeekGrid): WeekGrid {
  return grid.map((row) => row.map((c) => ({ ...c })))
}

/** Restore session-stored grid JSON; falls back to `fallback` if invalid. */
export function parseWeekGridJson(raw: string, fallback: WeekGrid): WeekGrid {
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data) || data.length !== DAYS) return cloneWeekGrid(fallback)
    const out = cloneWeekGrid(fallback)
    for (let d = 0; d < DAYS; d++) {
      const row = data[d]
      if (!Array.isArray(row)) continue
      for (let s = 0; s < SLOTS; s++) {
        const cell = row[s]
        if (cell && typeof cell === 'object' && 'classId' in cell) {
          const id = (cell as { classId: unknown }).classId
          out[d][s] = {
            classId: id === null || typeof id === 'string' ? id : null,
          }
        }
      }
    }
    return out
  } catch {
    return cloneWeekGrid(fallback)
  }
}
