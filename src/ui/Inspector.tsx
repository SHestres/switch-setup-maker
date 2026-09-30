import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface InspectorProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** The right-side overlay panel: never modal, never resizes or re-fits the canvas it covers. */
export function Inspector({ title, onClose, children }: InspectorProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <aside
      aria-label="Switch inspector"
      className="absolute inset-y-0 right-0 z-10 flex w-[400px] max-w-full flex-col border-l border-border bg-card shadow-xl"
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="mr-auto text-sm font-semibold">{title}</h2>
        <button
          type="button"
          aria-label="Close inspector"
          className="rounded-md px-2 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  )
}
