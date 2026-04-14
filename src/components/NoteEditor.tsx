import { ImagePlus, Mic, MicOff, StickyNote } from 'lucide-react'
import { useId, useState } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import type { Note, NoteType } from '../types/appData'

const MAX_DATA_URL_BYTES = 450_000

function newId(): string {
  return crypto.randomUUID()
}

type NoteEditorProps = {
  onAdd: (note: Note) => void
}

export function NoteEditor({ onAdd }: NoteEditorProps) {
  const baseId = useId()
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('text')
  const [fileHint, setFileHint] = useState<string | null>(null)
  const [interim, setInterim] = useState('')
  const { supported, listening, error, start, stop, state } = useSpeechRecognition()

  const handleFile = (file: File | null) => {
    setFileHint(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFileHint('Please choose an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r !== 'string') return
      if (r.length > MAX_DATA_URL_BYTES) {
        setFileHint('Image is large; paste a URL instead or use a smaller file.')
        return
      }
      setImageUrl(r)
      setNoteType('image')
    }
    reader.readAsDataURL(file)
  }

  const toggleRecord = () => {
    if (listening) {
      stop()
      setInterim('')
      return
    }
    setNoteType('voice')
    setInterim('')
    start({
      onFinal: (text) => {
        setContent((c) => (c ? `${c}\n${text}` : text))
        setInterim('')
      },
      onInterim: (text) => setInterim(text),
    })
  }

  const submit = () => {
    const trimmed = content.trim()
    if (!trimmed && !imageUrl.trim()) return
    const note: Note = {
      id: newId(),
      content: trimmed || '(image)',
      timestamp: new Date().toISOString(),
      type: noteType,
    }
    const url = imageUrl.trim()
    if (url) note.imageUrl = url
    onAdd(note)
    setContent('')
    setImageUrl('')
    setNoteType('text')
    setFileHint(null)
    stop()
  }

  return (
    <section className="rounded-lg border border-stage-line bg-stage-paper p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stage-ink">
        <StickyNote className="size-5 text-stage-amber" aria-hidden />
        New note
      </h2>
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stage-muted" htmlFor={`${baseId}-content`}>
            Text
          </label>
          <textarea
            id={`${baseId}-content`}
            className="min-h-[120px] w-full rounded-md border border-stage-line bg-white px-3 py-2 text-stage-ink shadow-inner focus:border-stage-amber focus:outline-none focus:ring-2 focus:ring-stage-amber/30"
            placeholder="Observation, follow-up, or paste from voice…"
            value={listening ? `${content}${interim ? (content ? '\n' : '') + interim : ''}` : content}
            onChange={(e) => setContent(e.target.value)}
            readOnly={listening}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleRecord}
            disabled={!supported}
            className="inline-flex items-center gap-2 rounded-md border border-stage-line bg-white px-3 py-2 text-sm font-medium text-stage-ink shadow-sm hover:bg-stage-cream disabled:cursor-not-allowed disabled:opacity-50"
          >
            {listening ? (
              <>
                <MicOff className="size-4 text-red-600" aria-hidden />
                Stop recording
              </>
            ) : (
              <>
                <Mic className="size-4 text-stage-amber" aria-hidden />
                Record note
              </>
            )}
          </button>
          {!supported ? (
            <span className="text-xs text-stage-muted">
              Voice input is not available in this browser.
            </span>
          ) : null}
          {error ? <span className="text-xs text-red-700">{error}</span> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stage-muted" htmlFor={`${baseId}-url`}>
            Image URL (optional)
          </label>
          <input
            id={`${baseId}-url`}
            type="url"
            className="w-full rounded-md border border-stage-line bg-white px-3 py-2 text-sm text-stage-ink shadow-inner focus:border-stage-amber focus:outline-none focus:ring-2 focus:ring-stage-amber/30"
            placeholder="https://…"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value)
              if (e.target.value) setNoteType('image')
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stage-muted" htmlFor={`${baseId}-file`}>
            Or upload image (stored as data URL in local data)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stage-line bg-white px-3 py-2 text-sm font-medium text-stage-ink shadow-sm hover:bg-stage-cream">
              <ImagePlus className="size-4 text-stage-amber" aria-hidden />
              Choose file
              <input
                id={`${baseId}-file`}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {fileHint ? <span className="text-xs text-amber-800">{fileHint}</span> : null}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-stage-amber px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
          >
            Add note
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-stage-muted" aria-live="polite">
        {state.listening ? 'Listening… speak clearly toward the microphone.' : ''}
      </p>
    </section>
  )
}
