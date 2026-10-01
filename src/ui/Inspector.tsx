import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'

interface InspectorProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Auto-fit bounds, in CSS px: never shorter than a usable card, never most of the canvas. */
const MIN_AUTO_HEIGHT = 240
const MIN_DRAG_HEIGHT = 170
/** Height used when the content cannot be measured (e.g. jsdom, before first paint). */
const AUTO_HEIGHT_FALLBACK = 320
/** The panel never grows past this share of the viewport. */
const MAX_VIEWPORT_SHARE = 0.7
/** Below this, the handle was clicked, not dragged: auto-fit keeps ownership. */
const RESIZE_THRESHOLD = 4

function maxHeight(): number {
  return window.innerHeight * MAX_VIEWPORT_SHARE
}

/**
 * The full-width bottom panel: never modal, never resizes or re-fits the canvas
 * it overlays. Its height auto-fits the content on open and on every change
 * until the user drags the top edge; a click alone does not take over.
 */
export function Inspector({ title, onClose, children }: InspectorProps) {
  const panelRef = useRef<HTMLElement | null>(null)
  const touchedRef = useRef(false)
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useLayoutEffect(() => {
    if (touchedRef.current) return
    const panel = panelRef.current
    if (!panel) return
    panel.style.height = 'auto'
    const measured = panel.scrollHeight || AUTO_HEIGHT_FALLBACK
    const next = Math.round(Math.min(Math.max(measured, MIN_AUTO_HEIGHT), maxHeight()))
    // Written straight to the DOM while the user has not taken over: the state
    // only comes into play once the handle is dragged.
    panel.style.height = `${next}px`
  })

  const startResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const panel = panelRef.current
    const startHeight = Math.round(
      panel?.getBoundingClientRect().height ||
        Number.parseFloat(panel?.style.height ?? '') ||
        AUTO_HEIGHT_FALLBACK,
    )
    const startY = event.clientY

    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      const moved = startY - moveEvent.clientY
      // A twitch is still a click: only a real drag hands the session over.
      if (!touchedRef.current && Math.abs(moved) < RESIZE_THRESHOLD) return
      touchedRef.current = true
      const next = startHeight + moved
      setHeight(Math.round(Math.min(Math.max(next, MIN_DRAG_HEIGHT), maxHeight())))
    }
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  return (
    <aside
      ref={panelRef}
      aria-label="Switch inspector"
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col border-t border-border bg-card shadow-[0_-10px_26px_rgba(16,24,40,0.07)]"
      style={{ height: height ?? undefined }}
    >
      <div
        role="separator"
        aria-label="Resize panel"
        aria-orientation="horizontal"
        title="Drag to resize"
        className="absolute -top-[3px] left-0 right-0 z-[3] h-[6px] cursor-row-resize"
        onMouseDown={startResize}
      />
      <header className="flex items-center gap-2 border-b border-border px-4 py-2">
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
      <div className="flex min-h-0 flex-1 overflow-auto p-4">{children}</div>
    </aside>
  )
}
