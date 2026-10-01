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

/**
 * The mirrored cascade visits finitely many slots; once this many candidates
 * are occupied the fallback keeps stepping diagonally (past the viewport) so a
 * placement can still never coincide with a switch already on the canvas.
 */
const MAX_CASCADE_SLOTS = 128

/** The canvas point at the center of the visible viewport, in canvas units. */
export function visibleCenter(viewport: Viewport, container: Size): Point {
  const size = usableSize(container)
  return {
    x: (size.width / 2 - viewport.x) / viewport.zoom,
    y: (size.height / 2 - viewport.y) / viewport.zoom,
  }
}

/**
 * Top-left corner for a new switch: the first cascade candidate — centered on
 * the visible canvas, then nudged down and right — that does not coincide with
 * any `occupied` switch. Callers pass the switches currently on the canvas,
 * not their count, so deleting one never hands a later switch an occupied
 * slot. The nudge reflects at the visible viewport's edge instead of wrapping,
 * so placements stay on screen until every slot is taken.
 */
export function placeNewSwitch(
  viewport: Viewport,
  container: Size,
  occupied: readonly Point[] = [],
): Point {
  const taken = new Set(occupied.map(({ x, y }) => `${x},${y}`))
  for (let index = 0; index < MAX_CASCADE_SLOTS; index++) {
    const candidate = cascadeCandidate(viewport, container, index)
    if (!taken.has(`${candidate.x},${candidate.y}`)) return candidate
  }
  return overflowCandidate(viewport, container, taken)
}

/** One mirrored cascade candidate, `cascadeIndex` diagonal steps from center. */
function cascadeCandidate(viewport: Viewport, container: Size, cascadeIndex: number): Point {
  const size = usableSize(container)
  const center = visibleCenter(viewport, size)
  const roomX = Math.max(0, (size.width / viewport.zoom - RACK_WIDTH) / 2)
  const roomY = Math.max(0, (size.height / viewport.zoom - FACE_HEIGHT) / 2)
  return {
    x: center.x - RACK_WIDTH / 2 + cascadeOffset(cascadeIndex, roomX),
    y: center.y - FACE_HEIGHT / 2 + cascadeOffset(cascadeIndex, roomY),
  }
}

/** The diagonal offset grows by `CASCADE_STEP` per add and mirrors at `room`. */
function cascadeOffset(index: number, room: number): number {
  if (room <= 0) return 0
  const cycle = 2 * room
  const offset = (index * CASCADE_STEP) % cycle
  return offset > room ? cycle - offset : offset
}

/**
 * Every mirrored slot is taken: continue the same diagonal without reflecting,
 * one distinct position per step, so two switches still never share a corner.
 */
function overflowCandidate(viewport: Viewport, container: Size, taken: ReadonlySet<string>): Point {
  const center = visibleCenter(viewport, usableSize(container))
  for (let index = MAX_CASCADE_SLOTS; ; index++) {
    const candidate = {
      x: center.x - RACK_WIDTH / 2 + index * CASCADE_STEP,
      y: center.y - FACE_HEIGHT / 2 + index * CASCADE_STEP,
    }
    if (!taken.has(`${candidate.x},${candidate.y}`)) return candidate
  }
}

function usableSize(container: Size): Size {
  return container.width > 0 && container.height > 0 ? container : DEFAULT_CANVAS_SIZE
}
