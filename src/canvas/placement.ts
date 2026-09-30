import type { Viewport } from '@/model/types'

import { FACE_HEIGHT, RACK_WIDTH } from './constants'

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

/** Container size used before layout exists (first paint, jsdom). */
export const DEFAULT_CANVAS_SIZE: Size = { width: 1200, height: 800 }

/** Diagonal step between cascaded placements, in canvas units. */
export const CASCADE_STEP = 24

/** Cascade positions before wrapping back to the visible centre. */
export const CASCADE_WRAP = 6

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
 * and right once per earlier placement so new switches never stack exactly.
 */
export function placeNewSwitch(viewport: Viewport, container: Size, cascadeIndex = 0): Point {
  const centre = visibleCentre(viewport, container)
  const step = (cascadeIndex % CASCADE_WRAP) * CASCADE_STEP
  return {
    x: centre.x - RACK_WIDTH / 2 + step,
    y: centre.y - FACE_HEIGHT / 2 + step,
  }
}

function usableSize(container: Size): Size {
  return container.width > 0 && container.height > 0 ? container : DEFAULT_CANVAS_SIZE
}
