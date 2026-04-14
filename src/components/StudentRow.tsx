import { FileText, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Student } from '../types/appData'

export function StudentRow({
  student,
  classId,
}: {
  student: Student
  classId: string
}) {
  const hasNotes = student.notes.length > 0
  return (
    <li>
      <Link
        to={`/class/${classId}/student/${student.id}`}
        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors ${
          hasNotes
            ? 'border-stage-line bg-white shadow-sm hover:border-stage-amber/50'
            : 'border-dashed border-stage-line bg-stage-cream/50 text-stage-muted hover:bg-stage-paper'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <User
            className={`size-5 shrink-0 ${hasNotes ? 'text-stage-amber' : 'opacity-40'}`}
            aria-hidden
          />
          <span
            className={`truncate font-medium ${hasNotes ? 'text-stage-ink' : 'text-stage-muted'}`}
          >
            {student.name}
          </span>
        </span>
        {hasNotes ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-stage-amber-soft px-2 py-0.5 text-xs font-medium text-stage-ink">
            <FileText className="size-3.5" aria-hidden />
            {student.notes.length}
          </span>
        ) : (
          <span className="text-xs">No notes</span>
        )}
      </Link>
    </li>
  )
}
