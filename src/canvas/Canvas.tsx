import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchContentRef, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

import type { PortRef, SetupDocument, Switch, Viewport } from '@/model/types'

import { Faceplate } from './Faceplate'
import type { Size } from './placement'
import './faceplate.css'

export const CANVAS_CONTENT_ID = 'canvas-content'

const DRAG_THRESHOLD = 4
const MIN_ZOOM = 0.3
const MAX_ZOOM = 4

interface DragPosition {
  id: string
  x: number
  y: number
}

export interface CanvasProps {
  document: SetupDocument
  selectedSwitchId?: string | null
  onMoveSwitch?: (switchId: string, position: { x: number; y: number }) => void
  onViewportChange?: (viewport: Viewport) => void
  onSelectSwitch?: (switchId: string) => void
  onClearSelection?: () => void
  onPortClick?: (ref: PortRef) => void
  /** The rendered container size, so placement can land on the visible centre. */
  onCanvasSizeChange?: (size: Size) => void
}

function sameViewport(a: Viewport, b: Viewport): boolean {
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom
}

/**
 * The pannable, zoomable workspace. Pan/zoom is delegated to
 * react-zoom-pan-pinch; switch drag, selection and port clicks are ours.
 * Viewport changes are reported on gesture end, never per frame.
 */
export function Canvas({
  document,
  selectedSwitchId = null,
  onMoveSwitch,
  onViewportChange,
  onSelectSwitch,
  onClearSelection,
  onPortClick,
  onCanvasSizeChange,
}: CanvasProps) {
  const viewport = document.ui.viewport
  const switches = document.setup.switches

  const rootRef = useRef<HTMLDivElement | null>(null)
  const transformRef = useRef<ReactZoomPanPinchContentRef | null>(null)
  const scaleRef = useRef(viewport.zoom)
  const lastViewportRef = useRef(viewport)
  const movedRef = useRef(false)
  const suppressClickRef = useRef(false)
  const [drag, setDrag] = useState<DragPosition | null>(null)

  // Report the rendered size so new switches can be centred on what is visible.
  useEffect(() => {
    const element = rootRef.current
    if (!element || !onCanvasSizeChange) return

    const reportSize = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        onCanvasSizeChange({ width: rect.width, height: rect.height })
      }
    }

    reportSize()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(reportSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [onCanvasSizeChange])

  // Apply viewport changes that come from outside a gesture (import, New setup).
  useEffect(() => {
    const controls = transformRef.current
    if (!controls || sameViewport(viewport, lastViewportRef.current)) return
    lastViewportRef.current = viewport
    scaleRef.current = viewport.zoom
    void controls.setTransform(viewport.x, viewport.y, viewport.zoom, 0)
  }, [viewport])

  const persistViewport = (ref: ReactZoomPanPinchRef) => {
    const next: Viewport = { x: ref.state.positionX, y: ref.state.positionY, zoom: ref.state.scale }
    if (sameViewport(next, lastViewportRef.current)) return
    lastViewportRef.current = next
    onViewportChange?.(next)
  }

  const beginDrag = (event: MouseEvent<HTMLDivElement>, switch_: Switch) => {
    if (event.button !== 0) return
    // Ports own their pointer gestures; a drag only starts on the body.
    if ((event.target as Element).closest('.port')) return
    event.preventDefault()
    event.stopPropagation()
    movedRef.current = false
    suppressClickRef.current = false
    const startX = event.clientX
    const startY = event.clientY
    const originX = switch_.x
    const originY = switch_.y
    let latest: DragPosition | null = null

    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      movedRef.current = true
      const zoom = scaleRef.current || 1
      latest = { id: switch_.id, x: originX + dx / zoom, y: originY + dy / zoom }
      setDrag(latest)
    }

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      if (latest) {
        suppressClickRef.current = true
        setDrag(null)
        onMoveSwitch?.(latest.id, { x: latest.x, y: latest.y })
      }
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  /** Swallow the click that follows a drag, wherever it lands. */
  const consumeDraggedClick = (): boolean => {
    if (!suppressClickRef.current) return false
    suppressClickRef.current = false
    return true
  }

  const handleSwitchClick = (switch_: Switch) => (event: MouseEvent<HTMLDivElement>) => {
    if (consumeDraggedClick()) {
      event.stopPropagation()
      return
    }
    onSelectSwitch?.(switch_.id)
  }

  const handleBackgroundClick = (event: MouseEvent<HTMLDivElement>) => {
    if (consumeDraggedClick()) return
    if ((event.target as Element).closest('[data-switch]')) return
    onClearSelection?.()
  }

  return (
    <div
      ref={rootRef}
      className="canvas-root"
      data-theme={document.ui.theme}
      onClick={handleBackgroundClick}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={viewport.zoom}
        initialPositionX={viewport.x}
        initialPositionY={viewport.y}
        minScale={MIN_ZOOM}
        maxScale={MAX_ZOOM}
        limitToBounds={false}
        centerOnInit={false}
        panning={{ velocityDisabled: true, excluded: ['button', 'switch'] }}
        onTransform={(_ref, state) => {
          scaleRef.current = state.scale
        }}
        onPanningStop={persistViewport}
        onWheelStop={persistViewport}
        onZoomStop={persistViewport}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentProps={{ id: CANVAS_CONTENT_ID }}
        >
          <div className="canvas-stage" data-testid="canvas-stage">
            {switches.map((switch_) => (
              <Faceplate
                key={switch_.id}
                switch_={switch_}
                x={drag?.id === switch_.id ? drag.x : switch_.x}
                y={drag?.id === switch_.id ? drag.y : switch_.y}
                selected={switch_.id === selectedSwitchId}
                onMouseDown={(event) => beginDrag(event, switch_)}
                onClick={handleSwitchClick(switch_)}
                onPortClick={onPortClick}
              />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
      {switches.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-8">
          <div className="max-w-md rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold">No switches yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a switch, then click any two ports to wire them.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
