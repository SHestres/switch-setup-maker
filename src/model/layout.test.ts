import { describe, expect, it } from 'vitest'

import {
  generateSectionLabels,
  materializeSections,
  nextPortId,
  relabelSections,
  removePortsFromSwitch,
  resolveSectionStarts,
  sectionLabelRange,
  sectionRows,
} from './layout'
import type { SectionSpec } from './layout'
import type { Port, Section, Switch } from './types'

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

// Each example below comes from the ticket and the spec's preset table — an outside
// source of truth, not a recomputation of the implementation.
describe('generateSectionLabels', () => {
  it('alternates down each pair of rows, the top row taking the start (Cisco et al.)', () => {
    const labels = generateSectionLabels(
      { rows: 2, columns: 8, numbering: 'alternating-top-first' },
      1,
    )

    expect(labels).toEqual([
      ['1', '3', '5', '7', '9', '11', '13', '15'],
      ['2', '4', '6', '8', '10', '12', '14', '16'],
    ])
  })

  it('alternates from the bottom row first', () => {
    const labels = generateSectionLabels(
      { rows: 2, columns: 8, numbering: 'alternating-bottom-first' },
      1,
    )

    expect(labels).toEqual([
      ['2', '4', '6', '8', '10', '12', '14', '16'],
      ['1', '3', '5', '7', '9', '11', '13', '15'],
    ])
  })

  it('counts sequentially across each row in turn (patch-panel style)', () => {
    const labels = generateSectionLabels({ rows: 2, columns: 3, numbering: 'sequential' }, 1)

    expect(labels).toEqual([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])
  })

  it('continues the span after each pair of rows', () => {
    const labels = generateSectionLabels(
      { rows: 4, columns: 2, numbering: 'alternating-top-first' },
      1,
    )

    expect(labels).toEqual([
      ['1', '3'],
      ['2', '4'],
      ['5', '7'],
      ['6', '8'],
    ])
  })

  it('continues the span after each pair of rows, bottom first', () => {
    const labels = generateSectionLabels(
      { rows: 4, columns: 2, numbering: 'alternating-bottom-first' },
      1,
    )

    expect(labels).toEqual([
      ['2', '4'],
      ['1', '3'],
      ['6', '8'],
      ['5', '7'],
    ])
  })

  it('treats a trailing unpaired row as the top of its own pair', () => {
    const labels = generateSectionLabels(
      { rows: 3, columns: 2, numbering: 'alternating-top-first' },
      1,
    )

    expect(labels).toEqual([
      ['1', '3'],
      ['2', '4'],
      ['5', '7'],
    ])
  })

  it('honours a custom start (12×1G + 2×SFP: zero-based)', () => {
    const labels = generateSectionLabels(
      { rows: 2, columns: 6, numbering: 'alternating-top-first' },
      0,
    )

    expect(labels).toEqual([
      ['0', '2', '4', '6', '8', '10'],
      ['1', '3', '5', '7', '9', '11'],
    ])
  })
})

// The span is the labels' numeric extent: a bottom-first pair starts on its
// top row, so its first label is not its lowest one.
describe('sectionLabelRange', () => {
  it('spans a top-first alternating section', () => {
    expect(sectionLabelRange({ rows: 2, columns: 8, numbering: 'alternating-top-first' }, 1)).toBe(
      '1–16',
    )
  })

  it('spans a bottom-first alternating section from its lowest to its highest label', () => {
    expect(
      sectionLabelRange({ rows: 2, columns: 8, numbering: 'alternating-bottom-first' }, 1),
    ).toBe('1–16')
  })

  it('spans a pinned bottom-first section from its custom start', () => {
    expect(
      sectionLabelRange({ rows: 2, columns: 4, numbering: 'alternating-bottom-first' }, 5),
    ).toBe('5–12')
  })

  it('spans a sequential section', () => {
    expect(sectionLabelRange({ rows: 2, columns: 3, numbering: 'sequential' }, 7)).toBe('7–12')
  })

  it('shows a single label without a dash', () => {
    expect(sectionLabelRange({ rows: 1, columns: 1, numbering: 'sequential' }, 3)).toBe('3')
  })
})

describe('resolveSectionStarts', () => {
  it('chains auto sections: the first starts at 1, each next after the previous highest', () => {
    const starts = resolveSectionStarts([
      spec({ rows: 2, columns: 8 }),
      spec({ rows: 2, columns: 2, numbering: 'sequential' }),
    ])

    expect(starts).toEqual([1, 17])
  })

  it('pins custom starts and continues after them', () => {
    const starts = resolveSectionStarts([
      spec({ rows: 2, columns: 8 }),
      spec({ rows: 2, columns: 2, numbering: 'sequential', startMode: 'custom', start: 100 }),
      spec({ rows: 1, columns: 2, numbering: 'sequential' }),
    ])

    expect(starts).toEqual([1, 100, 104])
  })

  it('chains from the highest label of a multi-pair section', () => {
    const starts = resolveSectionStarts([
      spec({ rows: 4, columns: 2 }),
      spec({ rows: 1, columns: 1 }),
    ])

    expect(starts).toEqual([1, 9])
  })

  it('keeps a pinned zero-based section at 0 while the following auto section chains', () => {
    const starts = resolveSectionStarts([
      spec({ rows: 2, columns: 6, startMode: 'custom', start: 0 }),
      spec({ rows: 1, columns: 2, numbering: 'sequential', startMode: 'custom', start: 0 }),
      spec({ rows: 1, columns: 1, numbering: 'sequential' }),
    ])

    expect(starts).toEqual([0, 0, 2])
  })
})

describe('materializeSections', () => {
  it('materializes every row×column port with generated labels and readable ids', () => {
    const sections = materializeSections([
      spec({ rows: 2, columns: 2 }),
      spec({ rows: 2, columns: 2, numbering: 'sequential', startMode: 'custom', start: 7 }),
    ])

    expect(sections).toEqual([
      {
        kind: 'rj45',
        speed: '1G',
        rows: 2,
        columns: 2,
        numbering: 'alternating-top-first',
        startMode: 'auto',
        start: 1,
        ports: [
          { id: 'p1', label: '1', kind: 'rj45', speed: '1G' },
          { id: 'p2', label: '3', kind: 'rj45', speed: '1G' },
          { id: 'p3', label: '2', kind: 'rj45', speed: '1G' },
          { id: 'p4', label: '4', kind: 'rj45', speed: '1G' },
        ],
      },
      {
        kind: 'rj45',
        speed: '1G',
        rows: 2,
        columns: 2,
        numbering: 'sequential',
        startMode: 'custom',
        start: 7,
        ports: [
          { id: 'p5', label: '7', kind: 'rj45', speed: '1G' },
          { id: 'p6', label: '8', kind: 'rj45', speed: '1G' },
          { id: 'p7', label: '9', kind: 'rj45', speed: '1G' },
          { id: 'p8', label: '10', kind: 'rj45', speed: '1G' },
        ],
      },
    ])
  })

  it('writes the resolved start onto every section, including auto ones', () => {
    const sections = materializeSections([
      spec({ rows: 2, columns: 8, startMode: 'custom', start: 33 }),
      spec({ rows: 1, columns: 2, numbering: 'sequential' }),
    ])

    expect(sections.map((section) => section.start)).toEqual([33, 49])
  })
})

describe('relabelSections', () => {
  it('regenerates labels for a changed convention without touching port ids', () => {
    const sections = materializeSections([spec({ rows: 2, columns: 2 })])
    const changed = sections.map((section) => ({ ...section, numbering: 'sequential' as const }))

    const relabelled = relabelSections({ sections: changed })

    expect(relabelled[0].ports.map((port) => port.id)).toEqual(['p1', 'p2', 'p3', 'p4'])
    expect(relabelled[0].ports.map((port) => port.label)).toEqual(['1', '2', '3', '4'])
  })

  it('renumbers following auto sections after an earlier custom start moves', () => {
    const sections = materializeSections([
      spec({ rows: 2, columns: 2 }),
      spec({ rows: 1, columns: 1, numbering: 'sequential' }),
    ])
    expect(sections[1].start).toBe(5)

    const pinned = sections.map((section, index) =>
      index === 0 ? { ...section, startMode: 'custom' as const, start: 10 } : section,
    )

    const relabelled = relabelSections({ sections: pinned })

    expect(relabelled[0].ports.map((port) => port.label)).toEqual(['10', '12', '11', '13'])
    expect(relabelled[1].start).toBe(14)
    expect(relabelled[1].ports.map((port) => port.label)).toEqual(['14'])
  })

  it('keeps a later custom section pinned when an earlier section changes', () => {
    const sections = materializeSections([
      spec({ rows: 2, columns: 2 }),
      spec({ rows: 1, columns: 1, numbering: 'sequential', startMode: 'custom', start: 50 }),
    ])
    const changed = sections.map((section, index) =>
      index === 0 ? { ...section, numbering: 'sequential' as const } : section,
    )

    const relabelled = relabelSections({ sections: changed })

    expect(relabelled[0].ports.map((port) => port.label)).toEqual(['1', '2', '3', '4'])
    expect(relabelled[1].start).toBe(50)
    expect(relabelled[1].ports.map((port) => port.label)).toEqual(['50'])
  })
})

describe('sectionRows', () => {
  it('slices the materialized grid into faceplate rows, row by row', () => {
    const [section] = materializeSections([spec({ rows: 2, columns: 2 })])

    expect(sectionRows(section).map((row) => row.ports.map((port) => port.label))).toEqual([
      ['1', '3'],
      ['2', '4'],
    ])
  })
})

describe('removePortsFromSwitch', () => {
  it('drops a section once its last port is gone while the others stay', () => {
    const original = switchWith(
      materializeSections([spec({ rows: 1, columns: 2 }), spec({ rows: 1, columns: 1 })]),
    )

    const updated = removePortsFromSwitch(original, ['p1', 'p2'])

    expect(updated.layout.sections).toHaveLength(1)
    expect(updated.layout.sections[0].ports.map((port) => port.id)).toEqual(['p3'])
  })

  it('keeps sections that still have ports', () => {
    const original = switchWith(materializeSections([spec({ rows: 1, columns: 3 })]))
    const [section] = original.layout.sections

    const updated = removePortsFromSwitch(original, [section.ports[0].id])

    expect(updated.layout.sections).toHaveLength(1)
    expect(updated.layout.sections[0].ports.map((port) => port.id)).toEqual(['p2', 'p3'])
  })
})

describe('nextPortId', () => {
  it('counts one past the highest existing suffix', () => {
    const existing: Port[] = materializeSections([spec({ rows: 2, columns: 2 })])[0].ports
    existing.push({ id: 'p48', label: '48', kind: 'rj45', speed: '1G' })

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
