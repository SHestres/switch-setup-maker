import { describe, expect, it } from 'vitest'

import { FACE_HEIGHT, RACK_WIDTH } from './constants'
import { DEFAULT_CANVAS_SIZE, placeNewSwitch, visibleCentre } from './placement'

describe('visibleCentre', () => {
  it('maps the container centre through the viewport transform', () => {
    expect(visibleCentre({ x: 0, y: 0, zoom: 1 }, { width: 1000, height: 600 })).toEqual({
      x: 500,
      y: 300,
    })
    expect(visibleCentre({ x: -400, y: -200, zoom: 2 }, { width: 1000, height: 600 })).toEqual({
      x: 450,
      y: 250,
    })
  })

  it('falls back to the default canvas size when the host reports no size', () => {
    expect(visibleCentre({ x: 0, y: 0, zoom: 1 }, { width: 0, height: 0 })).toEqual({
      x: DEFAULT_CANVAS_SIZE.width / 2,
      y: DEFAULT_CANVAS_SIZE.height / 2,
    })
  })
})

describe('placeNewSwitch', () => {
  it('centres the rack on the visible centre', () => {
    expect(placeNewSwitch({ x: 0, y: 0, zoom: 1 }, { width: 1000, height: 600 }, 0)).toEqual({
      x: 60,
      y: 255.5,
    })
  })

  it('cascades each further switch a little down and to the right', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = { width: 1000, height: 600 }
    expect(placeNewSwitch(viewport, container, 1)).toEqual({ x: 84, y: 279.5 })
    expect(placeNewSwitch(viewport, container, 2)).toEqual({ x: 108, y: 303.5 })
  })

  it('never wraps the cascade back onto an earlier switch', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = { width: 1000, height: 600 }
    const positions = Array.from({ length: 12 }, (_, index) =>
      placeNewSwitch(viewport, container, index),
    )
    const keys = positions.map(({ x, y }) => `${x},${y}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(placeNewSwitch(viewport, container, 6)).not.toEqual(
      placeNewSwitch(viewport, container, 0),
    )
  })

  it('keeps every cascaded switch inside the visible viewport', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = DEFAULT_CANVAS_SIZE
    for (let index = 0; index < 24; index++) {
      const { x, y } = placeNewSwitch(viewport, container, index)
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
    for (let index = 0; index < 24; index++) {
      const { x, y } = placeNewSwitch(viewport, container, index)
      expect(x).toBeGreaterThanOrEqual(left)
      expect(y).toBeGreaterThanOrEqual(top)
      expect(x + RACK_WIDTH).toBeLessThanOrEqual(right)
      expect(y + FACE_HEIGHT).toBeLessThanOrEqual(bottom)
    }
  })
})
