import { describe, expect, it } from 'vitest'

import type { Port, Row, Switch } from '@/model/types'
import { sampleDocument } from '@/test/fixtures'

import { connectionCurve, portAnchor, wireCurve } from './geometry'

/**
 * Expected coordinates below are worked examples derived by hand from the
 * faceplate's CSS/mirrored constants (portfield centring, bank gaps, row
 * heights), not from re-running the implementation.
 */

function row(kind: Port['kind'], count: number, firstId = 1, speed: Port['speed'] = '1G'): Row {
  return {
    ports: Array.from({ length: count }, (_, index) => ({
      id: `p${firstId + index}`,
      label: String(firstId + index),
      kind,
      speed,
    })),
  }
}

function switchWith(rows: Row[], x = 0, y = 0): Switch {
  return {
    id: 'sw1',
    name: '',
    model: '',
    x,
    y,
    layout: { numbering: 'odd-top-even-bottom', rows },
  }
}

describe('portAnchor', () => {
  it('centres a main-bank port and an uplink-cage port on a simple faceplate', () => {
    // Face "Core": one 2-port main row + one SFP uplink row on the right.
    // Main bank 54 wide, uplink 27, gap 8 -> 89 total; portfield spans x+38..x+802,
    // so the group starts at x + 38 + (764 - 89) / 2 = x + 375.5.
    // Main bank height 33 -> top y + 28; row top +9; tile centre +12.
    // Uplink bank height 22 -> top y + 33.5; tile centre +11.
    const switch_ = switchWith([row('rj45', 2), row('sfp+', 1, 49, '10G')], 120, 360)

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 509, y: 409 })
    expect(portAnchor(switch_, 'p2')).toEqual({ x: 536, y: 409 })
    expect(portAnchor(switch_, 'p49')).toEqual({ x: 571, y: 404.5 })
  })

  it('lays out a dense 48-port faceplate (24+24 main, 4 uplinks right)', () => {
    // The Unifi 48 Port preset: main 648 wide, uplink 108, gap 8 -> exactly 764,
    // so there is no centring slack and the uplink bank starts at x + 694.
    // Main bank height 66 -> top y + 11.5; row 0 top +9, row 1 top +33.
    // Uplink bank height 22 -> top y + 33.5; tile centre +11.
    const switch_ = switchWith(
      [row('rj45', 24), row('rj45', 24, 25), row('sfp+', 4, 49, '10G')],
      100,
      50,
    )

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 151.5, y: 82.5 })
    expect(portAnchor(switch_, 'p24')).toEqual({ x: 772.5, y: 82.5 })
    expect(portAnchor(switch_, 'p25')).toEqual({ x: 151.5, y: 106.5 })
    expect(portAnchor(switch_, 'p48')).toEqual({ x: 772.5, y: 106.5 })
    expect(portAnchor(switch_, 'p49')).toEqual({ x: 807.5, y: 94.5 })
    expect(portAnchor(switch_, 'p52')).toEqual({ x: 888.5, y: 94.5 })
  })

  it('places a leading uplink bank on the left of the main field', () => {
    // Left bank 54, main 54 (no right bank) -> 116 total with one 8 gap;
    // group starts at 38 + (764 - 116) / 2 = 362. Main field starts at 424.
    // Left cages: 22 + 4 + 22 = 48 high, centred in 77 -> top +20.5.
    const switch_ = switchWith([row('sfp', 2, 1), row('sfp', 2, 3), row('rj45', 2, 5)])

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 375.5, y: 31.5 })
    expect(portAnchor(switch_, 'p3')).toEqual({ x: 375.5, y: 57.5 })
    expect(portAnchor(switch_, 'p5')).toEqual({ x: 437.5, y: 49 })
    expect(portAnchor(switch_, 'p6')).toEqual({ x: 464.5, y: 49 })
  })

  it('grows the faceplate and re-centres banks when the rows exceed the chassis height', () => {
    // Four single-port rows: two full 66-high pairs (132) beat the 77 chassis
    // field, so the face grows and the bank starts at the padding (y + 6).
    const switch_ = switchWith(
      [row('rj45', 1, 1), row('rj45', 1, 2), row('rj45', 1, 3), row('rj45', 1, 4)],
      10,
      20,
    )

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 430, y: 47 })
    expect(portAnchor(switch_, 'p2')).toEqual({ x: 430, y: 71 })
    expect(portAnchor(switch_, 'p3')).toEqual({ x: 430, y: 113 })
    expect(portAnchor(switch_, 'p4')).toEqual({ x: 430, y: 137 })
  })

  it('keeps an all-uplink layout on the main field with printed label rows', () => {
    const switch_ = switchWith([row('sfp', 1, 1), row('sfp+', 1, 2, '10G')])

    expect(portAnchor(switch_, 'p1')).toEqual({ x: 420, y: 32.5 })
    expect(portAnchor(switch_, 'p2')).toEqual({ x: 420, y: 56.5 })
  })

  it('returns undefined for a port the switch does not have', () => {
    const switch_ = switchWith([row('rj45', 1)])

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
    expect(wireCurve({ x: 389, y: 409 }, { x: 1073.5, y: 449 })).toBe(
      'M 389 409 C 389 429, 1073.5 429, 1073.5 449',
    )
  })
})

describe('connectionCurve', () => {
  it('draws a restored cross-switch connection between the two port anchors', () => {
    const setup = sampleDocument().setup

    // sw1.p1 = (120 + 389, 360 + 49), sw2.p2 = (640 + 406.5 + 27, 400 + 49).
    expect(connectionCurve(setup, setup.connections[0])).toBe(
      'M 509 409 C 509 429, 1073.5 429, 1073.5 449',
    )
  })

  it('draws a same-switch link with a hanging sag', () => {
    const setup = sampleDocument().setup

    expect(
      connectionCurve(setup, {
        a: { switch: 'sw1', port: 'p1' },
        b: { switch: 'sw1', port: 'p2' },
      }),
    ).toBe('M 509 409 C 509 433, 536 433, 536 409')
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
})
