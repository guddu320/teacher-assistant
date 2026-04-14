/** Local calendar date key YYYY-MM-DD (no UTC shift for "today"). */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD as local midnight. */
export function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** JS getDay(): 0 Sun … 6 Sat → grid day 0 Mon … 4 Fri, or -1 for weekend. */
export function dateToGridDayIndex(d: Date): number {
  const js = d.getDay()
  if (js === 0 || js === 6) return -1
  return js - 1
}

export function gridDayIndexToLabel(dayIndex: number): string {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  return labels[dayIndex] ?? ''
}
