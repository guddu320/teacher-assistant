import { BookOpen } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b border-stage-line bg-stage-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-stage-ink hover:text-stage-amber"
          >
            <BookOpen className="size-6 text-stage-amber" aria-hidden />
            <span className="font-semibold tracking-tight">Teacher Assistant</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/classes"
              className="text-stage-muted hover:text-stage-amber hover:underline"
            >
              Manage classes
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
