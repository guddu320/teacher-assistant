import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DAY_LABELS, SLOTS, type ClassRecord, type WeekGrid } from '../types/appData'

type TimetableGridProps = {
  grid: WeekGrid
  classes: ClassRecord[]
  focusDayIndex: number | null
  tempMode: boolean
  onCellChange: (day: number, slot: number, classId: string | null) => void
}

export function TimetableGrid({
  grid,
  classes,
  focusDayIndex,
  tempMode,
  onCellChange,
}: TimetableGridProps) {
  const classMap = new Map(classes.map((c) => [c.id, c]))

  return (
    <div className="overflow-x-auto rounded-lg border border-stage-line bg-stage-paper shadow-sm">
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 border-b border-stage-line bg-stage-paper px-3 py-2 text-xs font-medium uppercase tracking-wide text-stage-muted">
              Slot
            </th>
            {DAY_LABELS.map((label, day) => (
              <th
                key={label}
                className={`border-b border-stage-line px-2 py-2 text-xs font-medium uppercase tracking-wide ${
                  focusDayIndex === day
                    ? 'bg-stage-amber-soft text-stage-ink'
                    : 'bg-stage-paper text-stage-muted'
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SLOTS }, (_, slot) => (
            <tr key={slot} className="border-b border-stage-line last:border-b-0">
              <th className="sticky left-0 z-10 border-r border-stage-line bg-stage-cream px-3 py-2 text-xs font-medium text-stage-muted">
                {slot + 1}
              </th>
              {DAY_LABELS.map((_, day) => {
                const cell = grid[day]?.[slot]
                const id = cell?.classId ?? null
                const cls = id ? classMap.get(id) : null
                const free = !id
                const focus = focusDayIndex === day

                return (
                  <td
                    key={`${day}-${slot}`}
                    className={`align-top p-1 ${
                      focus ? 'bg-stage-amber-soft/40' : 'bg-stage-cream/80'
                    }`}
                  >
                    {tempMode ? (
                      <>
                        <label className="sr-only" htmlFor={`c-${day}-${slot}`}>
                          Class for {DAY_LABELS[day]} slot {slot + 1}
                        </label>
                        <select
                          id={`c-${day}-${slot}`}
                          className="w-full rounded-md border border-stage-line bg-white px-2 py-2 text-stage-ink shadow-inner focus:border-stage-amber focus:outline-none focus:ring-2 focus:ring-stage-amber/30"
                          value={id ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            onCellChange(day, slot, v === '' ? null : v)
                          }}
                        >
                          <option value="">Free period</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <div
                        className={`min-h-[3rem] rounded-md border px-2 py-2 ${
                          free
                            ? 'border-dashed border-stage-line bg-stage-cream text-stage-muted'
                            : 'border-stage-line bg-white text-stage-ink shadow-sm'
                        }`}
                      >
                        {free ? (
                          <span className="text-xs font-medium uppercase tracking-wide">
                            Free
                          </span>
                        ) : cls ? (
                          <div className="flex flex-col gap-1">
                            <Link
                              to={`/class/${cls.id}`}
                              className="font-medium text-stage-ink hover:text-stage-amber"
                            >
                              {cls.name}
                            </Link>
                            <span className="text-xs text-stage-muted">{cls.subject}</span>
                            <Link
                              to={`/class/${cls.id}`}
                              className="inline-flex items-center gap-1 text-xs text-stage-amber hover:underline"
                            >
                              Roster
                              <ExternalLink className="size-3" aria-hidden />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-700">Unknown class</span>
                        )}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
