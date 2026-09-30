import { describe, expect, it } from 'vitest'

import type { RowSpec } from './layout'
import { materialiseRows } from './layout'
import { applyLayoutEdit, countSeveredConnections, planLayoutEdit } from './layoutEdit'
import type { Setup, SetupDocument, Switch } from './types'

function spec(count: number, overrides: Partial<RowSpec> = {}): RowSpec {
  return { count, kind: 'rj45', speed: '1G', ...overrides }
}

function switchWith(rows: Switch['layout']['rows']): Switch {
  return {
    id: 'sw1',
    name: '',
    model: '',
    x: 0,
    y: 0,
    layout: { numbering: 'odd-top-even-bottom', rows },
  }
}

function documentWith(setup: Setup): SetupDocument {
  return {
    version: 1,
    setup,
    ui: { theme: 'light', cableLayer: 'behind', viewport: { x: 0, y: 0, zoom: 1 } },
  }
}

describe('planLayoutEdit', () => {
  it('keeps the surviving ports’ ids when a row’s count is lowered, and severs the surplus', () => {
    const original = switchWith(materialiseRows('odd-top-even-bottom', [spec(3), spec(3)]))

    const plan = planLayoutEdit(original, {
      numbering: 'odd-top-even-bottom',
      rows: [
        { source: 0, spec: spec(2) },
        { source: 1, spec: spec(3) },
      ],
    })

    expect(plan.removedPortIds).toEqual(['p3'])
    expect(plan.switch.layout.rows[0].ports.map((port) => port.id)).toEqual(['p1', 'p2'])
    expect(plan.switch.layout.rows.map((row) => row.ports.map((port) => port.label))).toEqual([
      ['1', '3'],
      ['2', '4', '5'],
    ])
  })

  it('mints fresh ids after the switch’s highest id when a count is raised', () => {
    const original = switchWith(materialiseRows('odd-top-even-bottom', [spec(3), spec(3)]))

    const plan = planLayoutEdit(original, {
      numbering: 'odd-top-even-bottom',
      rows: [
        { source: 0, spec: spec(4) },
        { source: 1, spec: spec(3) },
      ],
    })

    expect(plan.removedPortIds).toEqual([])
    expect(plan.switch.layout.rows[0].ports.map((port) => port.id)).toEqual([
      'p1',
      'p2',
      'p3',
      'p7',
    ])
  })

  it('severs a removed row’s ports while the later rows keep their ids', () => {
    const original = switchWith(materialiseRows('odd-top-even-bottom', [spec(2), spec(2), spec(2)]))

    const plan = planLayoutEdit(original, {
      numbering: 'odd-top-even-bottom',
      rows: [
        { source: 0, spec: spec(2) },
        { source: 2, spec: spec(2) },
      ],
    })

    expect(plan.removedPortIds).toEqual(['p3', 'p4'])
    expect(plan.switch.layout.rows[1].ports.map((port) => port.id)).toEqual(['p5', 'p6'])
    expect(plan.switch.layout.rows[1].ports.map((port) => port.label)).toEqual(['2', '4'])
  })

  it('keeps ids through kind, speed and numbering changes, regenerating labels', () => {
    const original = switchWith(materialiseRows('odd-top-even-bottom', [spec(2), spec(2)]))

    const plan = planLayoutEdit(original, {
      numbering: 'sequential',
      rows: [
        { source: 0, spec: spec(2) },
        { source: 1, spec: spec(2, { kind: 'sfp+', speed: '10G', numbering: 'start-over' }) },
      ],
    })

    expect(plan.removedPortIds).toEqual([])
    expect(plan.switch.layout.numbering).toBe('sequential')
    expect(plan.switch.layout.rows[0].ports.map((port) => port.id)).toEqual(['p1', 'p2'])
    expect(plan.switch.layout.rows[1].ports.map((port) => port.id)).toEqual(['p3', 'p4'])
    expect(plan.switch.layout.rows[1].ports[0]).toMatchObject({
      kind: 'sfp+',
      speed: '10G',
      label: '1',
    })
    expect(plan.switch.layout.rows[1].numbering).toBe('start-over')
  })

  it('mints ids for an appended row and records its numbering explicitly', () => {
    const original = switchWith(materialiseRows('odd-top-even-bottom', [spec(2), spec(2)]))

    const plan = planLayoutEdit(original, {
      numbering: 'odd-top-even-bottom',
      rows: [
        { source: 0, spec: spec(2) },
        { source: 1, spec: spec(2) },
        { source: null, spec: spec(2, { kind: 'sfp', speed: '1G', numbering: 'start-over' }) },
      ],
    })

    expect(plan.removedPortIds).toEqual([])
    expect(plan.switch.layout.rows[2].ports.map((port) => port.id)).toEqual(['p5', 'p6'])
    expect(plan.switch.layout.rows[2].ports.map((port) => port.label)).toEqual(['1', '2'])
    expect(plan.switch.layout.rows[2].numbering).toBe('start-over')
  })
})

describe('countSeveredConnections', () => {
  const setup: Setup = {
    switches: [switchWith(materialiseRows('odd-top-even-bottom', [spec(2), spec(2)]))],
    connections: [
      { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p1' } },
      { a: { switch: 'sw1', port: 'p2' }, b: { switch: 'sw2', port: 'p2' } },
      { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw1', port: 'p2' } },
    ],
  }

  it('counts each connection touching a removed port once', () => {
    expect(countSeveredConnections(setup, 'sw1', ['p1', 'p2'])).toBe(3)
    expect(countSeveredConnections(setup, 'sw1', ['p1'])).toBe(2)
  })

  it('ignores ports of other switches and empty removals', () => {
    expect(countSeveredConnections(setup, 'sw1', ['p3'])).toBe(0)
    expect(countSeveredConnections(setup, 'sw2', ['p1'])).toBe(1)
    expect(countSeveredConnections(setup, 'sw1', [])).toBe(0)
  })
})

describe('applyLayoutEdit', () => {
  it('rebuilds the switch and purges every connection that lost its port', () => {
    const core = switchWith(materialiseRows('odd-top-even-bottom', [spec(2), spec(2)]))
    const document = documentWith({
      switches: [core],
      connections: [
        { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw1', port: 'p3' } },
        { a: { switch: 'sw1', port: 'p2' }, b: { switch: 'sw1', port: 'p4' } },
      ],
    })

    const updated = applyLayoutEdit(document, 'sw1', {
      numbering: 'odd-top-even-bottom',
      rows: [
        { source: 0, spec: spec(2) },
        { source: 1, spec: spec(1) },
      ],
    })

    expect(updated.setup.switches[0].layout.rows[1].ports.map((port) => port.id)).toEqual(['p3'])
    expect(updated.setup.connections).toEqual([
      { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw1', port: 'p3' } },
    ])
  })

  it('leaves the document untouched when the switch does not exist', () => {
    const document = documentWith({ switches: [], connections: [] })

    expect(applyLayoutEdit(document, 'sw9', { numbering: 'sequential', rows: [] })).toBe(document)
  })
})
