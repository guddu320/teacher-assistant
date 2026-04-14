import { Download, FileUp, Users } from 'lucide-react'
import { useCallback, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { useAppData } from '../context/useAppData'

const SAMPLE_CSV = `ClassName,StudentID,StudentName
Algebra I,s-100,Avery Chen
Algebra I,s-101,Jordan Lee
Biology,s-101,Jordan Lee
Biology,s-102,Riley Patel
`

export function ManageClassesPage() {
  const { data, status, importClassesFromCsv } = useAppData()
  const fileInputId = useId()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[] | null>(null)

  const onFile = useCallback(
    (file: File | null) => {
      setFeedback(null)
      setErrors(null)
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : ''
        const result = importClassesFromCsv(text)
        if (!result.ok) {
          setErrors(result.errors)
          return
        }
        const { stats } = result
        setFeedback(
          `Import complete. Classes created: ${stats.classesCreated}, updated: ${stats.classesUpdated}. New students: ${stats.studentsNew}, names updated: ${stats.studentsRenamed}.`,
        )
      }
      reader.onerror = () => setErrors(['Could not read the file.'])
      reader.readAsText(file, 'UTF-8')
    },
    [importClassesFromCsv],
  )

  const sampleHref = useMemo(
    () => `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`,
    [],
  )

  if (status === 'loading' || !data) {
    return (
      <div className="text-stage-muted" role="status">
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Manage classes' },
        ]}
      />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stage-ink">
          Manage classes
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-stage-muted">
          Import rosters from a CSV file. Required columns (exact names):{' '}
          <strong>ClassName</strong>, <strong>StudentID</strong>,{' '}
          <strong>StudentName</strong>. One row per student; repeat the class name for each
          member. Existing classes are matched by name (case-sensitive); their rosters are
          replaced from the file. New class names create new classes. Students are matched by{' '}
          <strong>StudentID</strong>; existing notes are kept. The weekly timetable is not
          changed—add new classes to <code className="text-xs">schedule.permanent</code> in
          stored data if needed.
        </p>
      </header>

      <section className="rounded-lg border border-stage-line bg-stage-paper p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stage-muted">
          Import CSV
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={fileInputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stage-line bg-white px-3 py-2 text-sm font-medium text-stage-ink shadow-sm hover:bg-stage-cream"
          >
            <FileUp className="size-4 text-stage-amber" aria-hidden />
            Choose CSV file <input
              id={fileInputId}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <a
            href={sampleHref}
            download="class-roster-sample.csv"
            className="inline-flex items-center gap-2 rounded-md border border-stage-line bg-white px-3 py-2 text-sm font-medium text-stage-ink shadow-sm hover:bg-stage-cream"
          >
            <Download className="size-4 text-stage-amber" aria-hidden />
            Download sample CSV
          </a>
        </div>
        {errors ? (
          <ul className="mt-3 list-inside list-disc text-sm text-red-700">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}
        {feedback ? (
          <p className="mt-3 text-sm text-stage-ink" role="status">
            {feedback}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stage-muted">
          <Users className="size-4" aria-hidden />
          Current classes ({data.classes.length})
        </h2>
        {data.classes.length === 0 ? (
          <p className="text-sm text-stage-muted">No classes yet. Import a CSV to add some.</p>
        ) : (
          <ul className="divide-y divide-stage-line rounded-lg border border-stage-line bg-white">
            {data.classes.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <Link
                    to={`/class/${c.id}`}
                    className="font-medium text-stage-ink hover:text-stage-amber"
                  >
                    {c.name}
                  </Link>
                  {c.subject ? (
                    <span className="text-stage-muted"> · {c.subject}</span>
                  ) : null}
                </div>
                <span className="text-stage-muted">{c.studentIds.length} students</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
