import type { Viewport } from '@/model/types'

import { FACE_HEIGHT, RACK_WIDTH } from './constants'
import type { Point } from './geometry'

export interface Size {
  width: number
  height: number
}

/** Container size used before layout exists (first paint, jsdom). */
export const DEFAULT_CANVAS_SIZE: Size = { width: 1200, height: 800 }

/** Diagonal step between cascaded placements, in canvas units. */
export const CASCADE_STEP = 24

/** The canvas point at the centre of the visible viewport, in canvas units. */
export function visibleCentre(viewport: Viewport, container: Size): Point {
  const size = usableSize(container)
  return {
    x: (size.width / 2 - viewport.x) / viewport.zoom,
    y: (size.height / 2 - viewport.y) / viewport.zoom,
  }
}

/**
 * Top-left corner for a new switch: centred on the visible canvas, nudged down
 * and right once per earlier placement. The nudge reflects at the visible
 * viewport's edge instead of wrapping, so placements never leave the viewport
 * and never land exactly on an earlier one.
 */
export function placeNewSwitch(viewport: Viewport, container: Size, cascadeIndex = 0): Point {
  const size = usableSize(container)
  const centre = visibleCentre(viewport, size)
  const roomX = Math.max(0, (size.width / viewport.zoom - RACK_WIDTH) / 2)
  const roomY = Math.max(0, (size.height / viewport.zoom - FACE_HEIGHT) / 2)
  return {
    x: centre.x - RACK_WIDTH / 2 + cascadeOffset(cascadeIndex, roomX),
    y: centre.y - FACE_HEIGHT / 2 + cascadeOffset(cascadeIndex, roomY),
  }
}

/** The diagonal offset grows by `CASCADE_STEP` per add and mirrors at `room`. */
function cascadeOffset(index: number, room: number): number {
  if (room <= 0) return 0
  const cycle = 2 * room
  const offset = (index * CASCADE_STEP) % cycle
  return offset > room ? cycle - offset : offset
}

function usableSize(container: Size): Size {
  return container.width > 0 && container.height > 0 ? container : DEFAULT_CANVAS_SIZE
}
