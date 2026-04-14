import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { NoteEditor } from '../components/NoteEditor'
import { NotesList } from '../components/NotesList'
import { StudentRow } from '../components/StudentRow'
import { useAppData } from '../context/useAppData'
import type { Note } from '../types/appData'

export function ClassPage() {
  const { classId } = useParams<{ classId: string }>()
  const { data, status, getClassById, studentsForClass, addClassNote } = useAppData()

  if (status === 'loading' || !data) {
    return (
      <div className="text-stage-muted" role="status">
        Loading…
      </div>
    )
  }

  const cls = classId ? getClassById(classId) : undefined
  if (!cls) {
    return <p className="text-stage-muted">Class not found.</p>
  }

  const roster = studentsForClass(cls)
  const onAddClassNote = (note: Note) => addClassNote(cls.id, note)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: cls.name },
        ]}
      />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stage-ink">{cls.name}</h1>
        <p className="mt-1 text-stage-muted">{cls.subject}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stage-muted">
            Student roster
          </h2>
          <ul className="space-y-2">
            {roster.map((s) => (
              <StudentRow key={s.id} student={s} classId={cls.id} />
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <NoteEditor onAdd={onAddClassNote} />
          <NotesList
            notes={cls.notes}
            heading="Class notes"
            emptyMessage="No class-level notes yet."
          />
        </div>
      </div>
    </div>
  )
}
