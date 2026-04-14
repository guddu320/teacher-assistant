import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export type Crumb = { label: string; to?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-1 text-sm text-stage-muted"
      aria-label="Breadcrumb"
    >
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1">
          {i > 0 ? (
            <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden />
          ) : null}
          {c.to ? (
            <Link
              to={c.to}
              className="text-stage-ink underline decoration-stage-line underline-offset-4 hover:decoration-stage-amber"
            >
              {c.label}
            </Link>
          ) : (
            <span className="font-medium text-stage-ink">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
