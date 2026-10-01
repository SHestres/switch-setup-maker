import { describe, expect, it } from 'vitest'

import type { Port, Section, Switch } from '@/model/types'
import { sampleDocument } from '@/test/fixtures'

import { connectionCurve, portAnchor, wireCurve } from './geometry'

/**
 * Expected coordinates below are worked examples derived by hand from the
 * faceplate's CSS/mirrored constants (portfield centring, section gaps, row
 * heights and per-section vertical centring), not from re-running the
 * implementation.
 */

function section(
  kind: Port['kind'],
  rows: number,
  columns: number,
  firstId: number,
  speed: Port['speed'] = '1G',
  labels?: string[],
): Section {
  return {
    kind,
    speed,
    rows,
    columns,
    numbering: 'sequential',
    startMode: 'custom',
    start: 1,
    ports: Array.from({ length: rows * columns }, (_, index) => ({
      id: `p${firstId + index}`,
      label: labels?.[index] ?? String(firstId + index),
      kind,
      speed,
    })),
  }
}

function switchWith(sections: Section[], x = 0, y = 0): Switch {
  return { id: 'sw1', name: '', model: '', x, y, layout: { sections } }
}

/** The Unifi 48 Port shape: three 2×8 RJ45 sections then 2×2 SFP+ uplinks. */
function denseSwitch(x = 0, y = 0): Switch {
  return switchWith(
    [
      section('rj45', 2, 8, 1),
      section('rj45', 2, 8, 17),
      section('rj45', 2, 8, 33, '2.5G'),
      section('sfp+', 2, 2, 49, '10G'),
    ],
    x,
    y,
  )
}

/** The lowest point of a cubic SVG path, sampled densely (test-side truth). */
function deepestPoint(d: string): { x: number; y: number } {
  const [ax, ay, c1x, c1y, c2x, c2y, bx, by] = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  let best = { x: ax, y: ay }
  for (let step = 0; step <= 1000; step++) {
    const t = step / 1000
    const u = 1 - t
    const x = u * u * u * ax + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * bx
    const y = u * u * u * ay + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * by
    if (y > best.y) best = { x, y }
  }
  return best
}

describe('portAnchor', () => {
  it('lays same-kind Sections left to right 6px apart, each centred vertically', () => {
    // Two 2×2 RJ45 Sections: widths 54 + 54 with one 6px gap = 114.
    // portfield spans x+38..x+802, so the group starts at 38 + (764 - 114) / 2 = 363.
    // Both Sections are 66 high against the 77 chassis field, so top = 6 + 5.5 = 11.5.
    // Row tops +9 and +33; tile centres +12 -> 32.5 and 56.5.
    const switch_ = switchWith([section('rj45', 2, 2, 1), section('rj45', 2, 2, 5)], 10, 20)

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 386.5, y: 52.5 })
    expect(portAnchor(switch_, 'p4')).toEqual({ x: 413.5, y: 76.5 })
    // The second Section starts after 54 + 6 and centres on the same rows.
    expect(portAnchor(switch_, 'p5')).toEqual({ x: 446.5, y: 52.5 })
    expect(portAnchor(switch_, 'p6')).toEqual({ x: 473.5, y: 52.5 })
  })

  it('separates neighbouring Sections of different kinds by 16px', () => {
    // 1×2 RJ45 (54) then 1×1 SFP+ (27) with a 16px gap = 97; the group starts
    // at 38 + (764 - 97) / 2 = 371.5. One-row Sections are 33 high and centre
    // inside the 77 field: top 28, row top 9, tile centre 49.
    const switch_ = switchWith(
      [section('rj45', 1, 2, 1), section('sfp+', 1, 1, 49, '10G')],
      120,
      360,
    )

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 505, y: 409 })
    expect(portAnchor(switch_, 'p2')).toEqual({ x: 532, y: 409 })
    expect(portAnchor(switch_, 'p49')).toEqual({ x: 575, y: 409 })
  })

  it('centres a short Section against a tall neighbour', () => {
    // 4-row RJ45 (132 high) then 2-row SFP+ (66 high): the field grows to 132,
    // the tall Section sits at the top (y + 6) and the short one at
    // 6 + (132 - 66) / 2 = 39. Group: 27 + 16 + 27 = 70 wide, starting at 385.
    const switch_ = switchWith([section('rj45', 4, 1, 1), section('sfp+', 2, 1, 5, '10G')])

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 398.5, y: 27 })
    expect(portAnchor(switch_, 'p4')).toEqual({ x: 398.5, y: 117 })
    expect(portAnchor(switch_, 'p5')).toEqual({ x: 441.5, y: 60 })
    expect(portAnchor(switch_, 'p6')).toEqual({ x: 441.5, y: 84 })
  })

  it('lays out a dense 48-port faceplate (3×2×8 RJ45, 4 SFP+)', () => {
    // Widths 216 + 216 + 216 + 54, gaps 6 + 6 + 16 = 730; the 764 field leaves
    // 17px slack each side, so the group starts at x + 55. All Sections are 66
    // high, top y + 11.5, row centres y + 32.5 / y + 56.5.
    const switch_ = denseSwitch(100, 50)

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 168.5, y: 82.5 })
    expect(portAnchor(switch_, 'p16')).toEqual({ x: 357.5, y: 106.5 })
    expect(portAnchor(switch_, 'p17')).toEqual({ x: 390.5, y: 82.5 })
    expect(portAnchor(switch_, 'p32')).toEqual({ x: 579.5, y: 106.5 })
    expect(portAnchor(switch_, 'p33')).toEqual({ x: 612.5, y: 82.5 })
    expect(portAnchor(switch_, 'p48')).toEqual({ x: 801.5, y: 106.5 })
    expect(portAnchor(switch_, 'p49')).toEqual({ x: 844.5, y: 82.5 })
    expect(portAnchor(switch_, 'p50')).toEqual({ x: 871.5, y: 82.5 })
    expect(portAnchor(switch_, 'p51')).toEqual({ x: 844.5, y: 106.5 })
  })

  it('grows the faceplate when a Section exceeds the chassis height', () => {
    // A single 6-row Section: three 66-high pairs = 198, so the field grows to
    // 198 (face 210) and the Section top sits at y + 6. Row 5's top is
    // 2*66 + 9 + 24 = 165, its tile centre y + 183.
    const switch_ = switchWith([section('rj45', 6, 1, 1)], 10, 20)

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 430, y: 47 })
    expect(portAnchor(switch_, 'p6')).toEqual({ x: 430, y: 203 })
  })

  it('returns undefined for a port the switch does not have', () => {
    const switch_ = switchWith([section('rj45', 1, 1, 1)])

    expect(portAnchor(switch_, 'nope')).toBeUndefined()
  })
})

describe('wireCurve', () => {
  it('runs a vertical-tangent S when the far port is clearly below', () => {
    expect(wireCurve({ x: 0, y: 0 }, { x: 100, y: 100 })).toBe('M 0 0 C 0 50, 100 50, 100 100')
  })

  it('mirrors the S when the far port is clearly above', () => {
    expect(wireCurve({ x: 0, y: 100 }, { x: 100, y: 0 })).toBe('M 0 100 C 0 50, 100 50, 100 0')
  })

  it('sags below two level ports like a hanging cable', () => {
    expect(wireCurve({ x: 0, y: 0 }, { x: 200, y: 0 })).toBe('M 0 0 C 0 100, 200 100, 200 0')
  })

  it('keeps a minimum sag between adjacent level ports', () => {
    expect(wireCurve({ x: 0, y: 0 }, { x: 27, y: 0 })).toBe('M 0 0 C 0 24, 27 24, 27 0')
  })

  it('caps the control offset on very tall or wide spans', () => {
    expect(wireCurve({ x: 0, y: 0 }, { x: 1000, y: 1000 })).toBe(
      'M 0 0 C 0 120, 1000 880, 1000 1000',
    )
  })

  it('draws a straight vertical line for aligned ports', () => {
    expect(wireCurve({ x: 0, y: 0 }, { x: 0, y: 100 })).toBe('M 0 0 C 0 50, 0 50, 0 100')
  })

  it('formats half-unit coordinates without floating-point noise', () => {
    expect(wireCurve({ x: 385, y: 409 }, { x: 1073.5, y: 449 })).toBe(
      'M 385 409 C 385 429, 1073.5 429, 1073.5 449',
    )
  })
})

describe('connectionCurve', () => {
  it('draws a restored cross-switch connection between the two port anchors', () => {
    const setup = sampleDocument().setup

    // sw1.p1 = (120 + 385, 360 + 49), sw2.p2 = (640 + 433.5, 400 + 49).
    expect(connectionCurve(setup, setup.connections[0])).toBe(
      'M 505 409 C 505 429, 1073.5 429, 1073.5 449',
    )
  })

  it('draws a same-switch link that dips clear of the faceplate it passes under', () => {
    const setup = sampleDocument().setup

    // sw1 "Core" face: 89 high, bottom at 360 + 89 = 449. The cable's lowest
    // point (0.75 of the control bow below the level anchors at y 409) must
    // clear that bottom by 8: lowest 457 -> bow (457 - 409) / 0.75 = 64.
    expect(
      connectionCurve(setup, {
        a: { switch: 'sw1', port: 'p1' },
        b: { switch: 'sw1', port: 'p2' },
      }),
    ).toBe('M 505 409 C 505 473, 532 473, 532 409')
  })

  it('keeps adjacent SFP+ uplinks clickable under a dense 48-port face', () => {
    // The Unifi 48 Port shape: the SFP+ Section's p49/p50 anchors sit at
    // (844.5, 82.5) and (871.5, 82.5) on a switch at (100, 50); their dip
    // must reach 139 + 8: bow (147 - 82.5) / 0.75 = 86.
    const setup = { switches: [denseSwitch(100, 50)], connections: [] }

    expect(
      connectionCurve(setup, {
        a: { switch: 'sw1', port: 'p49' },
        b: { switch: 'sw1', port: 'p50' },
      }),
    ).toBe('M 844.5 82.5 C 844.5 168.5, 871.5 168.5, 871.5 82.5')
  })

  it('dips a level cross-switch cable below both overlapping faceplates', () => {
    const setup = sampleDocument().setup
    setup.switches[1].x = 160
    setup.switches[1].y = 360

    // sw2.p1 = (160 + 406.5, 360 + 49); both 89-high faces (bottom 449)
    // cover the level span, so the dip must reach 457: bow 64.
    expect(
      connectionCurve(setup, {
        a: { switch: 'sw1', port: 'p1' },
        b: { switch: 'sw2', port: 'p1' },
      }),
    ).toBe('M 505 409 C 505 473, 566.5 473, 566.5 409')
  })

  it('leaves a level cross-switch cable alone when its dip already clears both faces', () => {
    const setup = sampleDocument().setup
    setup.switches[1].y = 360

    // 541.5 apart on the same level: the base span sag already reaches
    // 409 + 0.75 * 120 = 499, well clear of the 449 faces, so the style stays.
    expect(
      connectionCurve(setup, {
        a: { switch: 'sw1', port: 'p1' },
        b: { switch: 'sw2', port: 'p1' },
      }),
    ).toBe('M 505 409 C 505 529, 1046.5 529, 1046.5 409')
  })

  it('keeps every adjacent pair on a dense face clear of the chassis', () => {
    // Unifi 48 Port density. Face height 89 (bottom 50 + 89 = 139); every
    // wired neighbour's deepest point must clear it by 8.
    const setup = { switches: [denseSwitch(100, 50)], connections: [] }
    const pairs: Array<[number, number]> = []
    for (let port = 1; port < 16; port++) pairs.push([port, port + 1])
    for (let port = 17; port < 32; port++) pairs.push([port, port + 1])
    for (let port = 33; port < 48; port++) pairs.push([port, port + 1])
    pairs.push([49, 50], [50, 51], [51, 52], [16, 17], [32, 33], [1, 49], [48, 52])

    for (const [from, to] of pairs) {
      const d = connectionCurve(setup, {
        a: { switch: 'sw1', port: `p${from}` },
        b: { switch: 'sw1', port: `p${to}` },
      })
      expect(d, `p${from}-p${to} should be drawn`).toBeDefined()
      const deepest = deepestPoint(d as string)
      expect(deepest.y, `p${from}-p${to} deepest point must clear the face`).toBeGreaterThanOrEqual(
        146.99,
      )
      expect(deepest.x, `p${from}-p${to} deepest point stays under its face`).toBeGreaterThan(100)
      expect(deepest.x, `p${from}-p${to} deepest point stays under its face`).toBeLessThan(980)
    }
  })

  it('draws nothing when a referenced switch or port no longer exists', () => {
    const setup = sampleDocument().setup

    expect(
      connectionCurve(setup, {
        a: { switch: 'sw1', port: 'p1' },
        b: { switch: 'gone', port: 'p1' },
      }),
    ).toBeUndefined()
    expect(
      connectionCurve(setup, {
        a: { switch: 'sw1', port: 'gone' },
        b: { switch: 'sw2', port: 'p2' },
      }),
    ).toBeUndefined()
  })

  it('follows a switch mid-drag when given its live position', () => {
    const setup = sampleDocument().setup
    const connection = setup.connections[0]

    // Core's p1 anchor sits at (505, 409). Moving the switch 100 down puts it
    // at (505, 509); Edge's p2 at (1073.5, 449) is now clearly above, so the
    // exit flips to a mirrored S while the other end stays put.
    expect(connectionCurve(setup, connection, { id: 'sw1', x: 120, y: 460 })).toBe(
      'M 505 509 C 505 479, 1073.5 479, 1073.5 449',
    )
    expect(connectionCurve(setup, connection)).toBe('M 505 409 C 505 429, 1073.5 429, 1073.5 449')
  })
})
