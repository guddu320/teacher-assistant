import { CalendarDays, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { TimetableGrid } from '../components/TimetableGrid'
import { useAppData } from '../context/useAppData'
import { dateToGridDayIndex, parseLocalDateKey, toLocalDateKey } from '../lib/dateUtils'
import {
  cloneWeekGrid,
  effectiveBaseGrid,
  parseWeekGridJson,
} from '../lib/scheduleMerge'
import type { WeekGrid } from '../types/appData'

function sessionKey(dateKey: string) {
  return `teacher-assistant:session-grid:${dateKey}`
}

export function DashboardPage() {
  const { data, status, effectiveBase, commitDailyOverride } = useAppData()
  const [dateKey, setDateKey] = useState(() => toLocalDateKey(new Date()))
  const [tempMode, setTempMode] = useState(false)
  const [sessionGrid, setSessionGrid] = useState<WeekGrid | null>(null)

  const base = useMemo(() => {
    if (!data) return null
    return effectiveBase(dateKey)
  }, [data, dateKey, effectiveBase])

  const focusDayIndex = useMemo(
    () => dateToGridDayIndex(parseLocalDateKey(dateKey)),
    [dateKey],
  )

  const enableTemp = () => {
    if (!base) return
    const raw = sessionStorage.getItem(sessionKey(dateKey))
    setSessionGrid(raw ? parseWeekGridJson(raw, base) : cloneWeekGrid(base))
    setTempMode(true)
  }

  const disableTemp = () => {
    if (tempMode && sessionGrid && base) {
      const dirty = JSON.stringify(sessionGrid) !== JSON.stringify(base)
      if (
        dirty &&
        !window.confirm('Discard temporary timetable changes for this date?')
      ) {
        return
      }
      sessionStorage.removeItem(sessionKey(dateKey))
    }
    setSessionGrid(null)
    setTempMode(false)
  }

  const handleDateKeyChange = (nextKey: string) => {
    setDateKey(nextKey)
    if (!tempMode || !data) return
    const b = effectiveBaseGrid(
      data.schedule.permanent,
      data.schedule.dailyOverrides,
      nextKey,
    )
    const raw = sessionStorage.getItem(sessionKey(nextKey))
    setSessionGrid(raw ? parseWeekGridJson(raw, b) : cloneWeekGrid(b))
  }

  useEffect(() => {
    if (!tempMode || !sessionGrid) return
    sessionStorage.setItem(sessionKey(dateKey), JSON.stringify(sessionGrid))
  }, [tempMode, sessionGrid, dateKey])

  const onCellChange = (day: number, slot: number, classId: string | null) => {
    setSessionGrid((g) => {
      if (!g) return g
      const next = cloneWeekGrid(g)
      next[day][slot] = { classId }
      return next
    })
  }

  const commit = () => {
    if (!sessionGrid) return
    commitDailyOverride(dateKey, sessionGrid)
    sessionStorage.removeItem(sessionKey(dateKey))
    setTempMode(false)
    setSessionGrid(null)
  }

  const displayGrid =
    tempMode && sessionGrid ? sessionGrid : base

  if (status === 'loading' || !data) {
    return (
      <div className="text-stage-muted" role="status">
        Loading your timetable…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <p className="text-red-700">
        Could not load data. Check that <code className="text-sm">public/data.json</code>{' '}
        exists and try again.
      </p>
    )
  }

  if (!displayGrid) {
    return null
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stage-ink">
            Timetable
          </h1>
          <p className="mt-1 text-sm text-stage-muted">
            Permanent schedule uses master data. Daily overrides apply for the selected date.
            Temporary changes stay in this browser session until you commit or discard.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm text-stage-muted">
          <span className="flex items-center gap-2 font-medium text-stage-ink">
            <CalendarDays className="size-4 text-stage-amber" aria-hidden />
            Date context
          </span>
          <input
            type="date"
            className="rounded-md border border-stage-line bg-white px-3 py-2 text-stage-ink shadow-inner focus:border-stage-amber focus:outline-none focus:ring-2 focus:ring-stage-amber/30"
            value={dateKey}
            onChange={(e) => handleDateKeyChange(e.target.value)}
          />
        </label>
      </div>

      {focusDayIndex < 0 ? (
        <p className="rounded-md border border-dashed border-stage-line bg-stage-amber-soft/40 px-3 py-2 text-sm text-stage-ink">
          Selected date is a weekend — columns still show Mon–Fri; pick a weekday to highlight
          the matching column.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-stage-line bg-stage-paper p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="size-4 rounded border-stage-line text-stage-amber focus:ring-stage-amber/40"
            checked={tempMode}
            onChange={(e) => (e.target.checked ? enableTemp() : disableTemp())}
          />
          <span className="text-sm font-medium text-stage-ink">
            Temporary change (session only)
          </span>
        </label>
        {tempMode ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stage-amber-soft px-3 py-1 text-xs font-medium text-stage-ink">
              Session edits — not saved to master until you commit
            </span>
            <button
              type="button"
              onClick={commit}
              className="inline-flex items-center gap-2 rounded-md bg-stage-ink px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
            >
              <Save className="size-4" aria-hidden />
              Commit to daily override
            </button>
          </div>
        ) : null}
      </div>

      <TimetableGrid
        grid={displayGrid}
        classes={data.classes}
        focusDayIndex={focusDayIndex >= 0 ? focusDayIndex : null}
        tempMode={tempMode}
        onCellChange={onCellChange}
      />
    </div>
  )
}
