import { useCallback, useEffect, useRef, useState } from 'react'

/** Minimal DOM typings for Web Speech API (constructor names vary by browser). */
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly 0: { readonly transcript: string }
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: ArrayLike<SpeechRecognitionResultLike> & { length: number }
}

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: Event & { error?: string }) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type SpeechRecognitionState = {
  supported: boolean
  listening: boolean
  error: string | null
}

export function useSpeechRecognition(lang = 'en-US') {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const [supported] = useState(() => getRecognitionCtor() !== null)

  const stop = useCallback(() => {
    const r = recRef.current
    if (r) {
      try {
        r.stop()
      } catch {
        /* ignore */
      }
      recRef.current = null
    }
    setListening(false)
  }, [])

  useEffect(() => () => stop(), [stop])

  const start = useCallback(
    (handlers: {
      onFinal: (text: string) => void
      onInterim?: (text: string) => void
    }) => {
      const Ctor = getRecognitionCtor()
      if (!Ctor) {
        setError('Speech recognition is not supported in this browser.')
        return
      }
      setError(null)
      stop()
      const rec = new Ctor()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = lang
      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i]
          const chunk = r[0]?.transcript ?? ''
          if (r.isFinal && chunk.trim()) {
            handlers.onFinal(chunk.trim())
          } else {
            interim += chunk
          }
        }
        const t = interim.trim()
        if (t && handlers.onInterim) handlers.onInterim(t)
      }
      rec.onerror = (ev: Event & { error?: string }) => {
        setError(ev.error || 'Recognition error')
        setListening(false)
        recRef.current = null
      }
      rec.onend = () => {
        setListening(false)
        recRef.current = null
      }
      recRef.current = rec
      try {
        rec.start()
        setListening(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not start microphone')
        recRef.current = null
      }
    },
    [lang, stop],
  )

  return {
    supported,
    listening,
    error,
    start,
    stop,
    state: { supported, listening, error } satisfies SpeechRecognitionState,
  }
}
