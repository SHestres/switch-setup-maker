import { describe, expect, it } from 'vitest'

import { CASCADE_WRAP, DEFAULT_CANVAS_SIZE, placeNewSwitch, visibleCentre } from './placement'

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

  it('wraps the cascade so it stays small', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    const container = { width: 1000, height: 600 }
    expect(placeNewSwitch(viewport, container, CASCADE_WRAP)).toEqual(
      placeNewSwitch(viewport, container, 0),
    )
  })
})
