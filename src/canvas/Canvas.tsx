import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchContentRef, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

import { sameRef } from '@/model/connections'
import type { Connection, PortRef, SetupDocument, Switch, Viewport } from '@/model/types'

import { Faceplate } from './Faceplate'
import { PendingWire } from './PendingWire'
import { WireHint } from './WireHint'
import { WireLayer } from './WireLayer'
import type { Point } from './geometry'
import type { Size } from './placement'
import { portKey } from './portRef'
import type { WireHintState } from './wiring'
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
  /** A switch being built by hand: previewed as a ghost, never draggable, clickable or wireable. */
  draft?: Switch | null
  selectedSwitchId?: string | null
  onMoveSwitch?: (switchId: string, position: { x: number; y: number }) => void
  onViewportChange?: (viewport: Viewport) => void
  onSelectSwitch?: (switchId: string) => void
  onClearSelection?: () => void
  onPortClick?: (ref: PortRef) => void
  /** The selected Connection, by unordered pair; ephemeral UI state. */
  selectedConnection?: Connection | null
  onSelectConnection?: (connection: Connection) => void
  onDeleteConnection?: (connection: Connection) => void
  /** The Port a pending wire starts from, when one is being drawn. */
  pendingPort?: PortRef | null
  /** A connection refusal to show near the offending Port. */
  hint?: WireHintState | null
  /** The rendered container size, so placement can land on the visible centre. */
  onCanvasSizeChange?: (size: Size) => void
}

function sameViewport(a: Viewport, b: Viewport): boolean {
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom
}

/** Every connected port in the setup, as `switch:port` keys, in one pass. */
function connectedPortKeys(connections: SetupDocument['setup']['connections']): Set<string> {
  const keys = new Set<string>()
  for (const { a, b } of connections) {
    keys.add(portKey(a))
    keys.add(portKey(b))
  }
  return keys
}

/**
 * The pannable, zoomable workspace. Pan/zoom is delegated to
 * react-zoom-pan-pinch; switch drag, selection and port clicks are ours.
 * Viewport changes are reported on gesture end, never per frame.
 */
export function Canvas({
  document,
  draft = null,
  selectedSwitchId = null,
  onMoveSwitch,
  onViewportChange,
  onSelectSwitch,
  onClearSelection,
  onPortClick,
  selectedConnection = null,
  onSelectConnection,
  onDeleteConnection,
  pendingPort = null,
  hint = null,
  onCanvasSizeChange,
}: CanvasProps) {
  const viewport = document.ui.viewport
  const switches = document.setup.switches
  const connectedPorts = useMemo(
    () => connectedPortKeys(document.setup.connections),
    [document.setup.connections],
  )
  // The blueprint theme always draws cables above; the stored preference is
  // left untouched for the other themes.
  const cablesAbove = document.ui.theme === 'blueprint' || document.ui.cableLayer === 'above'
  const cablesLayer = (
    <WireLayer
      setup={document.setup}
      selected={selectedConnection}
      onSelectConnection={onSelectConnection}
      onDeleteConnection={onDeleteConnection}
    />
  )

  const rootRef = useRef<HTMLDivElement | null>(null)
  const transformRef = useRef<ReactZoomPanPinchContentRef | null>(null)
  const scaleRef = useRef(viewport.zoom)
  const lastViewportRef = useRef(viewport)
  const transformStateRef = useRef({ x: viewport.x, y: viewport.y, zoom: viewport.zoom })
  const movedRef = useRef(false)
  const suppressClickRef = useRef(false)
  const [drag, setDrag] = useState<DragPosition | null>(null)
  // The pointer in canvas units, tagged with the Port it belongs to, so a stale
  // position from a previous wire is never reused.
  const [pointer, setPointer] = useState<{ ref: PortRef; point: Point } | null>(null)

  // Client coordinates to canvas units, so the pending wire follows the pointer.
  const pointFromEvent = (event: { clientX: number; clientY: number }): Point => {
    const rect = rootRef.current?.getBoundingClientRect()
    const transform = transformStateRef.current
    return {
      x: (event.clientX - (rect?.left ?? 0) - transform.x) / transform.zoom,
      y: (event.clientY - (rect?.top ?? 0) - transform.y) / transform.zoom,
    }
  }

  const handleCanvasMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (pendingPort) setPointer({ ref: pendingPort, point: pointFromEvent(event) })
  }

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
    transformStateRef.current = { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
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
    // Ports own their pointer gestures; a drag only starts on the body, and a
    // port mousedown seeds the pending wire at the click point.
    const portElement = (event.target as Element).closest('.port')
    if (portElement) {
      const portId = portElement.getAttribute('data-port')
      if (portId) {
        setPointer({
          ref: { switch: switch_.id, port: portId },
          point: pointFromEvent(event),
        })
      }
      return
    }
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
      onMouseMove={handleCanvasMouseMove}
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
        // `smooth` (the default) makes one wheel notch zoom by
        // `step * |deltaY|`; 0.0015 lands a standard 100px notch at +0.15
        // (1.0 -> 1.15) instead of the default +1.5 clamp slam.
        wheel={{ step: 0.0015 }}
        panning={{ velocityDisabled: true, excluded: ['button', 'switch', 'wire-hit'] }}
        onTransform={(_ref, state) => {
          scaleRef.current = state.scale
          transformStateRef.current = {
            x: state.positionX,
            y: state.positionY,
            zoom: state.scale,
          }
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
            {/* Cables paint before the switches when behind, after them when above. */}
            {!cablesAbove && cablesLayer}
            {switches.map((switch_) => (
              <Faceplate
                key={switch_.id}
                switch_={switch_}
                x={drag?.id === switch_.id ? drag.x : switch_.x}
                y={drag?.id === switch_.id ? drag.y : switch_.y}
                selected={switch_.id === selectedSwitchId}
                connectedPorts={connectedPorts}
                pendingPortId={pendingPort?.switch === switch_.id ? pendingPort.port : null}
                onMouseDown={(event) => beginDrag(event, switch_)}
                onClick={handleSwitchClick(switch_)}
                onPortClick={onPortClick}
              />
            ))}
            {draft && <Faceplate switch_={draft} x={draft.x} y={draft.y} ghost />}
            {cablesAbove && cablesLayer}
            <PendingWire
              setup={document.setup}
              pending={
                pendingPort
                  ? {
                      from: pendingPort,
                      to: pointer && sameRef(pointer.ref, pendingPort) ? pointer.point : undefined,
                    }
                  : null
              }
            />
            {hint && <WireHint setup={document.setup} hint={hint} />}
          </div>
        </TransformComponent>
      </TransformWrapper>
      {switches.length === 0 && !draft && (
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
