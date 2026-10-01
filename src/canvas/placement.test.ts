import { describe, expect, it } from 'vitest'

import { FACE_HEIGHT, RACK_WIDTH } from './constants'
import { DEFAULT_CANVAS_SIZE, placeNewSwitch, visibleCenter } from './placement'
import type { Point } from './geometry'

describe('visibleCenter', () => {
  it('maps the container center through the viewport transform', () => {
    expect(visibleCenter({ x: 0, y: 0, zoom: 1 }, { width: 1000, height: 600 })).toEqual({
      x: 500,
      y: 300,
    })
    expect(visibleCenter({ x: -400, y: -200, zoom: 2 }, { width: 1000, height: 600 })).toEqual({
      x: 450,
      y: 250,
    })
  })

  it('falls back to the default canvas size when the host reports no size', () => {
    expect(visibleCenter({ x: 0, y: 0, zoom: 1 }, { width: 0, height: 0 })).toEqual({
      x: DEFAULT_CANVAS_SIZE.width / 2,
      y: DEFAULT_CANVAS_SIZE.height / 2,
    })
  })
})

describe('placeNewSwitch', () => {
  it('centers the rack on the visible center', () => {
    expect(placeNewSwitch({ x: 0, y: 0, zoom: 1 }, { width: 1000, height: 600 })).toEqual({
      x: 60,
      y: 255.5,
    })
  })

  it('cascades each further switch a little down and to the right', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = { width: 1000, height: 600 }
    const first = placeNewSwitch(viewport, container)
    const second = placeNewSwitch(viewport, container, [first])
    const third = placeNewSwitch(viewport, container, [first, second])
    expect(second).toEqual({ x: 84, y: 279.5 })
    expect(third).toEqual({ x: 108, y: 303.5 })
  })

  it('skips cascade slots occupied by a survivor after a deletion', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = { width: 1000, height: 600 }
    const first = placeNewSwitch(viewport, container)
    const second = placeNewSwitch(viewport, container, [first])
    // The first switch was deleted, leaving the second in the cascade.
    const next = placeNewSwitch(viewport, container, [second])
    expect(next).not.toEqual(second)
    expect(placeNewSwitch(viewport, container, [first, second])).not.toEqual(first)
  })

  it('never reuses the slot of a switch dragged onto the center', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = { width: 1000, height: 600 }
    const dragged = { x: 60, y: 255.5 }

    const placed = placeNewSwitch(viewport, container, [dragged])

    expect(placed).not.toEqual(dragged)
  })

  it('never returns a position it already returned', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = { width: 1000, height: 600 }
    const positions: Point[] = []
    for (let index = 0; index < 12; index++) {
      positions.push(placeNewSwitch(viewport, container, positions))
    }
    const keys = positions.map(({ x, y }) => `${x},${y}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('keeps every cascaded switch inside the visible viewport', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = DEFAULT_CANVAS_SIZE
    const positions: Point[] = []
    for (let index = 0; index < 24; index++) {
      positions.push(placeNewSwitch(viewport, container, positions))
    }
    for (const { x, y } of positions) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x + RACK_WIDTH).toBeLessThanOrEqual(container.width)
      expect(y + FACE_HEIGHT).toBeLessThanOrEqual(container.height)
    }
  })

  it('keeps every cascaded switch inside a panned and zoomed viewport', () => {
    const viewport = { x: -160, y: -90, zoom: 0.5 }
    const container = { width: 1200, height: 800 }
    const left = -viewport.x / viewport.zoom
    const top = -viewport.y / viewport.zoom
    const right = left + container.width / viewport.zoom
    const bottom = top + container.height / viewport.zoom
    const positions: Point[] = []
    for (let index = 0; index < 24; index++) {
      positions.push(placeNewSwitch(viewport, container, positions))
    }
    for (const { x, y } of positions) {
      expect(x).toBeGreaterThanOrEqual(left)
      expect(y).toBeGreaterThanOrEqual(top)
      expect(x + RACK_WIDTH).toBeLessThanOrEqual(right)
      expect(y + FACE_HEIGHT).toBeLessThanOrEqual(bottom)
    }
  })
})
