import { describe, expect, it } from 'vitest'

import { materializeSections } from './layout'
import type { SectionSpec } from './layout'
import { applyLayoutEdit, countSeveredConnections, planLayoutEdit } from './layoutEdit'
import type { LayoutEdit } from './layoutEdit'
import type { Section, Setup, SetupDocument, Switch } from './types'

function spec(overrides: Partial<SectionSpec> = {}): SectionSpec {
  return {
    rows: 2,
    columns: 2,
    kind: 'rj45',
    speed: '1G',
    numbering: 'alternating-top-first',
    startMode: 'auto',
    ...overrides,
  }
}

function switchWith(sections: Section[]): Switch {
  return { id: 'sw1', name: '', model: '', x: 0, y: 0, layout: { sections } }
}

function edit(overrides: Partial<LayoutEdit> = {}): LayoutEdit {
  return { sections: [], ...overrides }
}

function documentWith(setup: Setup): SetupDocument {
  return {
    version: 2,
    setup,
    ui: { theme: 'light', cableLayer: 'behind', viewport: { x: 0, y: 0, zoom: 1 } },
  }
}

describe('planLayoutEdit', () => {
  it('keeps the surviving ports’ ids when columns shrink, and severs the surplus', () => {
    const original = switchWith(materializeSections([spec({ rows: 2, columns: 3 })]))

    const plan = planLayoutEdit(
      original,
      edit({ sections: [{ source: 0, spec: spec({ rows: 2, columns: 2 }) }] }),
    )

    // Column 3 disappears from every row: (0,2) and (1,2) are severed.
    expect(plan.removedPortIds).toEqual(['p3', 'p6'])
    expect(plan.switch.layout.sections[0].ports.map((port) => port.id)).toEqual([
      'p1',
      'p2',
      'p4',
      'p5',
    ])
    expect(plan.switch.layout.sections[0].ports.map((port) => port.label)).toEqual([
      '1',
      '3',
      '2',
      '4',
    ])
  })

  it('mints fresh ids after the switch’s highest id when columns grow', () => {
    const original = switchWith(materializeSections([spec({ rows: 2, columns: 3 })]))

    const plan = planLayoutEdit(
      original,
      edit({ sections: [{ source: 0, spec: spec({ rows: 2, columns: 4 }) }] }),
    )

    expect(plan.removedPortIds).toEqual([])
    // Column 4 is new in every row, so p7 and p8 mint after the highest existing id.
    expect(plan.switch.layout.sections[0].ports.map((port) => port.id)).toEqual([
      'p1',
      'p2',
      'p3',
      'p7',
      'p4',
      'p5',
      'p6',
      'p8',
    ])
    expect(plan.switch.layout.sections[0].ports.map((port) => port.label)).toEqual([
      '1',
      '3',
      '5',
      '7',
      '2',
      '4',
      '6',
      '8',
    ])
  })

  it('keeps surviving positions when columns shrink and rows grow at once', () => {
    const original = switchWith(materializeSections([spec({ rows: 2, columns: 3 })]))

    const plan = planLayoutEdit(
      original,
      edit({ sections: [{ source: 0, spec: spec({ rows: 3, columns: 2 }) }] }),
    )

    expect(plan.removedPortIds).toEqual(['p3', 'p6'])
    // (row, column) survives; the fresh bottom row mints after the highest id.
    expect(plan.switch.layout.sections[0].ports.map((port) => port.id)).toEqual([
      'p1',
      'p2',
      'p4',
      'p5',
      'p7',
      'p8',
    ])
  })

  it('severs a removed section’s ports while later sections keep their ids', () => {
    const original = switchWith(materializeSections([spec(), spec()]))

    const plan = planLayoutEdit(original, edit({ sections: [{ source: 1, spec: spec() }] }))

    expect(plan.removedPortIds).toEqual(['p1', 'p2', 'p3', 'p4'])
    expect(plan.switch.layout.sections[0].ports.map((port) => port.id)).toEqual([
      'p5',
      'p6',
      'p7',
      'p8',
    ])
    expect(plan.switch.layout.sections[0].ports.map((port) => port.label)).toEqual([
      '1',
      '3',
      '2',
      '4',
    ])
  })

  it('keeps ids through kind, speed and numbering changes, regenerating labels', () => {
    const original = switchWith(materializeSections([spec()]))

    const plan = planLayoutEdit(
      original,
      edit({
        sections: [
          {
            source: 0,
            spec: spec({ numbering: 'sequential', kind: 'sfp', speed: '10G' }),
          },
        ],
      }),
    )

    expect(plan.removedPortIds).toEqual([])
    expect(plan.switch.layout.sections[0].ports.map((port) => port.id)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ])
    expect(plan.switch.layout.sections[0].ports[0]).toMatchObject({
      kind: 'sfp',
      speed: '10G',
      label: '1',
    })
    expect(plan.switch.layout.sections[0].numbering).toBe('sequential')
  })

  it('mints ids for an appended section and records its start mode', () => {
    const original = switchWith(materializeSections([spec()]))

    const plan = planLayoutEdit(
      original,
      edit({
        sections: [
          { source: 0, spec: spec() },
          { source: null, spec: spec({ numbering: 'sequential', startMode: 'custom', start: 49 }) },
        ],
      }),
    )

    expect(plan.removedPortIds).toEqual([])
    expect(plan.switch.layout.sections[1].ports.map((port) => port.id)).toEqual([
      'p5',
      'p6',
      'p7',
      'p8',
    ])
    expect(plan.switch.layout.sections[1].ports.map((port) => port.label)).toEqual([
      '49',
      '50',
      '51',
      '52',
    ])
    expect(plan.switch.layout.sections[1].start).toBe(49)
  })

  it('renumbers following auto sections when an earlier section is resized', () => {
    const original = switchWith(
      materializeSections([spec(), spec({ rows: 1, columns: 1, numbering: 'sequential' })]),
    )
    expect(original.layout.sections[1].start).toBe(5)

    const plan = planLayoutEdit(
      original,
      edit({
        sections: [
          { source: 0, spec: spec({ rows: 2, columns: 3 }) },
          { source: 1, spec: spec({ rows: 1, columns: 1, numbering: 'sequential' }) },
        ],
      }),
    )

    expect(plan.switch.layout.sections[0].start).toBe(1)
    expect(plan.switch.layout.sections[1].start).toBe(7)
    expect(plan.switch.layout.sections[1].ports[0].label).toBe('7')
  })

  it('keeps a pinned custom section while an earlier auto section is resized', () => {
    const original = switchWith(
      materializeSections([
        spec(),
        spec({ rows: 1, columns: 1, numbering: 'sequential', startMode: 'custom', start: 50 }),
      ]),
    )

    const plan = planLayoutEdit(
      original,
      edit({
        sections: [
          { source: 0, spec: spec({ rows: 1, columns: 1 }) },
          {
            source: 1,
            spec: spec({
              rows: 1,
              columns: 1,
              numbering: 'sequential',
              startMode: 'custom',
              start: 50,
            }),
          },
        ],
      }),
    )

    expect(plan.switch.layout.sections[0].start).toBe(1)
    expect(plan.switch.layout.sections[1].start).toBe(50)
    expect(plan.switch.layout.sections[1].ports[0].label).toBe('50')
  })
})

describe('countSeveredConnections', () => {
  const setup: Setup = {
    switches: [switchWith(materializeSections([spec()]))],
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
    const core = switchWith(materializeSections([spec({ rows: 1, columns: 3 })]))
    const document = documentWith({
      switches: [core],
      connections: [
        { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p1' } },
        { a: { switch: 'sw1', port: 'p3' }, b: { switch: 'sw2', port: 'p2' } },
      ],
    })

    const updated = applyLayoutEdit(
      document,
      'sw1',
      edit({ sections: [{ source: 0, spec: spec({ rows: 1, columns: 2 }) }] }),
    )

    expect(updated.setup.switches[0].layout.sections[0].ports.map((port) => port.id)).toEqual([
      'p1',
      'p2',
    ])
    expect(updated.setup.connections).toEqual([
      { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p1' } },
    ])
  })

  it('leaves the document untouched when the switch does not exist', () => {
    const document = documentWith({ switches: [], connections: [] })
    const request = edit({ sections: [{ source: null, spec: spec() }] })

    expect(applyLayoutEdit(document, 'sw9', request)).toBe(document)
  })
})
