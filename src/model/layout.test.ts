import { describe, expect, it } from 'vitest'

import {
  generateLabels,
  materialiseRows,
  nextPortId,
  relabelRows,
  removePortsFromSwitch,
} from './layout'
import type { RowSpec } from './layout'
import type { Port, Switch } from './types'

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

function ports(labels: string[]): Port[] {
  return labels.map((label, index) => ({
    id: `p${index + 1}`,
    label,
    kind: 'rj45',
    speed: '1G',
  }))
}

// Each example below comes from the preset table in ticket 06 — an outside source
// of truth, not a recomputation of the implementation.
describe('generateLabels', () => {
  it('pairs odd numbers on top and even numbers on the bottom (Cisco et al.)', () => {
    const labels = generateLabels('odd-top-even-bottom', [spec(5), spec(5)])

    expect(labels).toEqual([
      ['1', '3', '5', '7', '9'],
      ['2', '4', '6', '8', '10'],
    ])
  })

  it('runs sequential rows (patch-panel style)', () => {
    const labels = generateLabels('sequential', [spec(5), spec(5)])

    expect(labels).toEqual([
      ['1', '2', '3', '4', '5'],
      ['6', '7', '8', '9', '10'],
    ])
  })

  it('pairs even numbers on top, odd on the bottom, from zero (Juniper)', () => {
    const labels = generateLabels('even-top-zero-based', [spec(5), spec(5)])

    expect(labels).toEqual([
      ['0', '2', '4', '6', '8'],
      ['1', '3', '5', '7', '9'],
    ])
  })

  it('numbers a 12×1G + 2×SFP switch: the SFP row starts over (1, 2)', () => {
    const labels = generateLabels('odd-top-even-bottom', [
      spec(6),
      spec(6),
      spec(2, { kind: 'sfp', speed: '1G', numbering: 'start-over' }),
    ])

    expect(labels[2]).toEqual(['1', '2'])
  })

  it('numbers a 12×1G + 2×SFP Juniper switch: the SFP row starts over (0, 1)', () => {
    const labels = generateLabels('even-top-zero-based', [
      spec(6),
      spec(6),
      spec(2, { kind: 'sfp', speed: '1G', numbering: 'start-over' }),
    ])

    expect(labels).toEqual([
      ['0', '2', '4', '6', '8', '10'],
      ['1', '3', '5', '7', '9', '11'],
      ['0', '1'],
    ])
  })

  it('numbers a Unifi 48 Port: the single SFP+ row continues (49–52)', () => {
    const labels = generateLabels('odd-top-even-bottom', [
      spec(24),
      spec(24),
      spec(4, { kind: 'sfp+', speed: '10G', numbering: 'continue' }),
    ])

    expect(labels[2]).toEqual(['49', '50', '51', '52'])
  })

  it('numbers a 24×1G + 4×SFP+ switch: the 2×2 SFP+ block continues (25–28)', () => {
    const labels = generateLabels('odd-top-even-bottom', [
      spec(12),
      spec(12),
      spec(2, { kind: 'sfp+', speed: '10G', numbering: 'continue' }),
      spec(2, { kind: 'sfp+', speed: '10G', numbering: 'continue' }),
    ])

    expect(labels[2]).toEqual(['25', '27'])
    expect(labels[3]).toEqual(['26', '28'])
  })
})

describe('materialiseRows', () => {
  it('builds rows of ports with stable sequential ids and generated labels', () => {
    const rows = materialiseRows('odd-top-even-bottom', [spec(2), spec(2)])

    expect(rows).toEqual([
      {
        ports: [
          { id: 'p1', label: '1', kind: 'rj45', speed: '1G' },
          { id: 'p2', label: '3', kind: 'rj45', speed: '1G' },
        ],
      },
      {
        ports: [
          { id: 'p3', label: '2', kind: 'rj45', speed: '1G' },
          { id: 'p4', label: '4', kind: 'rj45', speed: '1G' },
        ],
      },
    ])
  })

  it('carries the rows’ continue/start-over choice into the materialised rows', () => {
    const rows = materialiseRows('odd-top-even-bottom', [
      spec(2),
      spec(2, { numbering: 'start-over' }),
    ])

    expect(rows[0].numbering).toBeUndefined()
    expect(rows[1].numbering).toBe('start-over')
  })
})

describe('relabelRows', () => {
  it('regenerates labels under a new convention without touching port ids', () => {
    const original = switchWith(materialiseRows('odd-top-even-bottom', [spec(3), spec(3)]))
    const relabelled = relabelRows({ ...original.layout, numbering: 'sequential' })

    expect(relabelled[0].ports.map((port) => port.id)).toEqual(['p1', 'p2', 'p3'])
    expect(relabelled[0].ports.map((port) => port.label)).toEqual(['1', '2', '3'])
    expect(relabelled[1].ports.map((port) => port.label)).toEqual(['4', '5', '6'])
  })

  it('leaves custom labels alone', () => {
    const layout = { numbering: 'custom' as const, rows: [{ ports: ports(['Core 1', 'Core 2']) }] }

    expect(relabelRows(layout)).toBe(layout.rows)
  })
})

describe('removePortsFromSwitch', () => {
  it('drops the ports but keeps rows that still have some', () => {
    const original = switchWith(materialiseRows('odd-top-even-bottom', [spec(3), spec(3)]))

    const updated = removePortsFromSwitch(original, ['p1'])

    expect(updated.layout.rows).toHaveLength(2)
    expect(updated.layout.rows[0].ports.map((port) => port.id)).toEqual(['p2', 'p3'])
  })

  it('removes a row once its last port is gone', () => {
    const original = switchWith(materialiseRows('odd-top-even-bottom', [spec(3), spec(1)]))

    const updated = removePortsFromSwitch(original, ['p4'])

    expect(updated.layout.rows).toHaveLength(1)
  })
})

describe('nextPortId', () => {
  it('counts one past the highest existing suffix', () => {
    const existing = ports(['1', '2', '3']).concat({
      id: 'p48',
      label: '48',
      kind: 'rj45',
      speed: '1G',
    })

    expect(nextPortId(existing)).toBe('p49')
  })

  it('starts at p1 when the switch has no ports', () => {
    expect(nextPortId([])).toBe('p1')
  })

  it('ignores ids that do not follow the p<n> shape', () => {
    const existing: Port[] = [{ id: 'uplink', label: 'U1', kind: 'sfp+', speed: '10G' }]

    expect(nextPortId(existing)).toBe('p1')
  })
})
