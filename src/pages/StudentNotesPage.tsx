import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { NoteEditor } from '../components/NoteEditor'
import { NotesList } from '../components/NotesList'
import { useAppData } from '../context/useAppData'
import type { Note } from '../types/appData'

export function StudentNotesPage() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>()
  const { data, status, getClassById, getStudentById, addNote } = useAppData()

  if (status === 'loading' || !data) {
    return (
      <div className="text-stage-muted" role="status">
        Loading…
      </div>
    )
  }

  const cls = classId ? getClassById(classId) : undefined
  const student = studentId ? getStudentById(studentId) : undefined

  if (!cls || !student || !cls.studentIds.includes(student.id)) {
    return <p className="text-stage-muted">Student or class not found.</p>
  }

  const onAdd = (note: Note) => addNote(student.id, note)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: cls.name, to: `/class/${cls.id}` },
          { label: student.name },
        ]}
      />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stage-ink">
          {student.name}
        </h1>
        <p className="mt-1 text-sm text-stage-muted">
          {cls.name} · {cls.subject}
        </p>
      </header>

      <NoteEditor onAdd={onAdd} />

      <NotesList notes={student.notes} />
    </div>
  )
}
