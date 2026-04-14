import { Image as ImageIcon } from 'lucide-react'
import type { Note } from '../types/appData'

export function NotesList({
  notes,
  emptyMessage = 'No notes yet.',
  heading = 'Notes',
}: {
  notes: Note[]
  emptyMessage?: string
  heading?: string
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-stage-ink">{heading}</h2>
      {notes.length === 0 ? (
        <p className="text-sm text-stage-muted">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-stage-line bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-stage-muted">
                <time dateTime={n.timestamp}>
                  {new Date(n.timestamp).toLocaleString()}
                </time>
                <span className="rounded-full bg-stage-cream px-2 py-0.5 font-medium text-stage-ink">
                  {n.type}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-stage-ink">{n.content}</p>
              {n.imageUrl ? (
                <div className="mt-3">
                  <p className="mb-1 flex items-center gap-1 text-xs font-medium text-stage-muted">
                    <ImageIcon className="size-3.5" aria-hidden />
                    Image
                  </p>
                  <a
                    href={n.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-stage-amber hover:underline"
                  >
                    Open link
                  </a>
                  <img
                    src={n.imageUrl}
                    alt=""
                    className="mt-2 max-h-48 rounded-md border border-stage-line object-contain"
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
