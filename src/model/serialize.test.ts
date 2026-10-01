import { describe, expect, it } from 'vitest'

import { sampleDocument as validDocument } from '@/test/fixtures'

import { parseDocument, parseDocumentText, serializeDocument } from './serialize'

function rejectedDocument(value: unknown): string {
  const result = parseDocument(value)
  if (result.ok) throw new Error('expected the document to be rejected')
  return result.error
}

function port(id: string, label: string, kind = 'rj45', speed = '1G') {
  return { id, label, kind, speed }
}

interface V1Row {
  numbering?: string
  ports: ReturnType<typeof port>[]
}

/** A version 1 document with one switch, for the migration suite. */
function v1Document(rows: V1Row[], numbering = 'odd-top-even-bottom') {
  return {
    version: 1,
    setup: {
      switches: [{ id: 'sw1', name: 'Core', model: '', x: 10, y: 20, layout: { numbering, rows } }],
      connections: [],
    },
  }
}

function migratedSections(rows: V1Row[], numbering?: string) {
  const result = parseDocument(v1Document(rows, numbering))
  if (!result.ok) throw new Error(result.error)
  expect(result.document.version).toBe(2)
  return result.document.setup.switches[0].layout.sections
}

describe('round trip', () => {
  it('serializes and parses back to the same document', () => {
    const document = validDocument()

    const result = parseDocumentText(serializeDocument(document))

    expect(result).toEqual({ ok: true, document })
  })

  it('pretty-prints the JSON', () => {
    expect(serializeDocument(validDocument())).toContain('\n  "version": 2,')
  })

  it('reports unreadable JSON in plain language', () => {
    expect(parseDocumentText('not json {')).toEqual({
      ok: false,
      error: 'The file is not valid JSON.',
    })
  })
})

describe('version', () => {
  it('rejects an unknown version', () => {
    expect(rejectedDocument({ version: 3 })).toContain('3')
  })

  it('rejects a document with no version', () => {
    expect(rejectedDocument({ setup: { switches: [], connections: [] } })).toContain('version')
  })

  it('accepts a bare version and fills in the rest', () => {
    const result = parseDocument({ version: 2 })

    expect(result).toEqual({
      ok: true,
      document: {
        version: 2,
        setup: { switches: [], connections: [] },
        ui: { theme: 'light', cableLayer: 'behind', viewport: { x: 0, y: 0, zoom: 1 } },
      },
    })
  })

  it('migrates a bare version 1 document to an empty version 2 document', () => {
    const result = parseDocument({ version: 1 })

    expect(result).toEqual({
      ok: true,
      document: {
        version: 2,
        setup: { switches: [], connections: [] },
        ui: { theme: 'light', cableLayer: 'behind', viewport: { x: 0, y: 0, zoom: 1 } },
      },
    })
  })
})

describe('migrating version 1', () => {
  it('converts row pairs into an alternating Section, preserving ids and pinning a start-over row', () => {
    const sections = migratedSections([
      { ports: [port('p1', '1'), port('p2', '3')] },
      { ports: [port('p3', '2'), port('p4', '4')] },
      { numbering: 'start-over', ports: [port('p25', '1', 'sfp'), port('p26', '2', 'sfp')] },
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
        ports: [port('p1', '1'), port('p2', '3'), port('p3', '2'), port('p4', '4')],
      },
      {
        kind: 'sfp',
        speed: '1G',
        rows: 1,
        columns: 2,
        numbering: 'sequential',
        startMode: 'custom',
        start: 1,
        ports: [port('p25', '1', 'sfp'), port('p26', '2', 'sfp')],
      },
    ])
  })

  it('maps the zero-based convention to alternating top-first pinned at 0', () => {
    const sections = migratedSections(
      [
        { ports: [port('p1', '0'), port('p2', '2')] },
        { ports: [port('p3', '1'), port('p4', '3')] },
      ],
      'even-top-zero-based',
    )

    expect(sections[0]).toMatchObject({
      numbering: 'alternating-top-first',
      startMode: 'custom',
      start: 0,
    })
    expect(sections[0].ports.map((entry) => entry.label)).toEqual(['0', '2', '1', '3'])
  })

  it('maps a sequential layout into one sequential Section', () => {
    const sections = migratedSections(
      [
        { ports: [port('p1', '1'), port('p2', '2')] },
        { ports: [port('p3', '3'), port('p4', '4')] },
      ],
      'sequential',
    )

    expect(sections).toEqual([
      {
        kind: 'rj45',
        speed: '1G',
        rows: 2,
        columns: 2,
        numbering: 'sequential',
        startMode: 'auto',
        start: 1,
        ports: [port('p1', '1'), port('p2', '2'), port('p3', '3'), port('p4', '4')],
      },
    ])
  })

  it('splits a trailing unpaired row into its own sequential Section, as version 1 counted it', () => {
    const sections = migratedSections([
      { ports: [port('p1', '1'), port('p2', '3')] },
      { ports: [port('p3', '2'), port('p4', '4')] },
      { ports: [port('p5', '5'), port('p6', '6')] },
    ])

    expect(sections).toHaveLength(2)
    expect(sections[0]).toMatchObject({ rows: 2, columns: 2, numbering: 'alternating-top-first' })
    expect(sections[1]).toMatchObject({
      rows: 1,
      columns: 2,
      numbering: 'sequential',
      startMode: 'auto',
      start: 5,
    })
    expect(sections[1].ports.map((entry) => entry.label)).toEqual(['5', '6'])
  })

  it('starts a new Section at a kind or speed change and continues the chain', () => {
    const sections = migratedSections([
      { ports: [port('p1', '1'), port('p2', '3')] },
      { ports: [port('p3', '2'), port('p4', '4')] },
      { ports: [port('p5', '5', 'sfp+', '10G'), port('p6', '6', 'sfp+', '10G')] },
    ])

    expect(sections).toHaveLength(2)
    expect(sections[1]).toMatchObject({
      kind: 'sfp+',
      speed: '10G',
      startMode: 'auto',
      start: 5,
    })
    expect(sections[1].ports.map((entry) => entry.label)).toEqual(['5', '6'])
  })

  it('pads a ragged row to the Section’s widest row with fresh ids', () => {
    const sections = migratedSections([
      { ports: [port('p1', '1'), port('p2', '3'), port('p3', '5')] },
      { ports: [port('p4', '2')] },
    ])

    expect(sections[0].rows).toBe(2)
    expect(sections[0].columns).toBe(3)
    expect(sections[0].ports.map((entry) => entry.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])
    expect(sections[0].ports.map((entry) => entry.label)).toEqual(['1', '3', '5', '2', '4', '6'])
  })

  it('keeps connections and the port ids they point at', () => {
    const result = parseDocument({
      version: 1,
      setup: {
        switches: [
          {
            id: 'sw1',
            name: 'Core',
            model: '',
            x: 0,
            y: 0,
            layout: { numbering: 'sequential', rows: [{ ports: [port('p1', '1')] }] },
          },
          {
            id: 'sw2',
            name: '',
            model: '',
            x: 0,
            y: 0,
            layout: { numbering: 'sequential', rows: [{ ports: [port('p1', '1')] }] },
          },
        ],
        connections: [{ a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p1' } }],
      },
    })
    if (!result.ok) throw new Error(result.error)

    expect(result.document.setup.connections).toEqual([
      { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p1' } },
    ])
    expect(result.document.setup.switches[0].layout.sections[0].ports[0]).toMatchObject({
      id: 'p1',
      label: '1',
    })
  })

  it('rejects a version 1 layout with custom labels in plain language', () => {
    const result = parseDocument(v1Document([{ ports: [port('p1', 'Core 1')] }], 'custom'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('custom')
  })

  it('rejects a version 1 layout with no rows', () => {
    expect(rejectedDocument(v1Document([]))).toContain('rows')
  })

  it('rejects a version 1 row that mixes kinds, which a Section cannot carry', () => {
    const result = parseDocument(
      v1Document([{ ports: [port('p1', '1'), port('p2', '2', 'sfp', '1G')] }]),
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('kind')
  })
})

describe('tolerance', () => {
  it('ignores unknown extra fields and fills missing name, model and ui', () => {
    const result = parseDocument({
      version: 2,
      notes: 'hand-written',
      setup: {
        switches: [
          {
            id: 'sw1',
            x: 0,
            y: 0,
            faceplate: 'ignored',
            layout: {
              sections: [
                {
                  kind: 'rj45',
                  speed: '1G',
                  rows: 1,
                  columns: 1,
                  ports: [port('p1', '1')],
                },
              ],
            },
          },
        ],
        connections: [],
      },
    })
    if (!result.ok) throw new Error(result.error)

    const switch_ = result.document.setup.switches[0]
    expect(switch_).not.toHaveProperty('faceplate')
    expect(switch_.name).toBe('')
    expect(switch_.model).toBe('')
    expect(switch_.layout.sections[0]).toMatchObject({
      numbering: 'alternating-top-first',
      startMode: 'auto',
      start: 1,
    })
    expect(result.document.ui).toEqual({
      theme: 'light',
      cableLayer: 'behind',
      viewport: { x: 0, y: 0, zoom: 1 },
    })
  })

  it('normalises derived labels and auto starts on load', () => {
    const document = validDocument()
    document.setup.switches[0].layout.sections[0].start = 99
    document.setup.switches[0].layout.sections[0].ports[0].label = 'stale'

    const result = parseDocument(document)
    if (!result.ok) throw new Error(result.error)

    const section = result.document.setup.switches[0].layout.sections[0]
    expect(section.start).toBe(1)
    expect(section.ports.map((entry) => entry.label)).toEqual(['1', '3'])
    expect(section.ports.map((entry) => entry.id)).toEqual(['p1', 'p2'])
  })
})

describe('setup invariants', () => {
  it('rejects duplicate switch ids', () => {
    const document = validDocument()
    document.setup.switches[1].id = 'sw1'

    expect(rejectedDocument(document)).toContain('sw1')
  })

  it('rejects duplicate port ids within a switch, across sections', () => {
    const document = validDocument()
    document.setup.switches[0].layout.sections[1].ports[0].id = 'p1'

    expect(rejectedDocument(document)).toContain('p1')
  })

  it('rejects a connection endpoint that does not exist', () => {
    const document = validDocument()
    document.setup.connections[0].b = { switch: 'sw2', port: 'p99' }

    expect(rejectedDocument(document)).toContain('p99')
  })

  it('rejects a self-link', () => {
    const document = validDocument()
    document.setup.connections[0].b = document.setup.connections[0].a

    expect(rejectedDocument(document)).toContain('itself')
  })

  it('rejects the same pair connected twice, whichever way round', () => {
    const document = validDocument()
    document.setup.connections.push({
      a: { switch: 'sw2', port: 'p2' },
      b: { switch: 'sw1', port: 'p1' },
    })

    expect(rejectedDocument(document)).toContain('already')
  })

  it('rejects a port that sits in two connections', () => {
    const document = validDocument()
    document.setup.connections.push({
      a: { switch: 'sw1', port: 'p1' },
      b: { switch: 'sw2', port: 'p1' },
    })

    expect(rejectedDocument(document)).toContain('already')
  })

  it('rejects a section with no ports', () => {
    const document = validDocument()
    document.setup.switches[0].layout.sections[1].ports = []

    expect(rejectedDocument(document)).toContain('port')
  })

  it('rejects a layout with no sections', () => {
    const document = validDocument()
    document.setup.switches[0].layout.sections = []

    expect(rejectedDocument(document)).toContain('section')
  })

  it('rejects a section whose port count does not fill its grid', () => {
    const document = validDocument()
    document.setup.switches[0].layout.sections[0].ports.push({
      id: 'p99',
      label: '99',
      kind: 'rj45',
      speed: '1G',
    })

    expect(rejectedDocument(document)).toContain('ports')
  })

  it('rejects a section with a non-integer or zero dimension', () => {
    const document = validDocument()
    document.setup.switches[0].layout.sections[0].rows = 0

    expect(rejectedDocument(document)).toContain('rows')
  })

  it('rejects a negative custom start', () => {
    const document = validDocument()
    document.setup.switches[0].layout.sections[1].start = -1

    expect(rejectedDocument(document)).toContain('start')
  })

  it('rejects a port whose kind or speed disagrees with its section', () => {
    const document = validDocument()
    document.setup.switches[0].layout.sections[0].ports[0].kind = 'sfp'

    expect(rejectedDocument(document)).toContain('kind')
  })

  it('rejects a port with an unknown kind', () => {
    const document = validDocument()
    // Deliberately invalid data from outside the type system.
    ;(document.setup.switches[0].layout.sections[0].ports[0] as { kind: string }).kind = 'qsfp'

    expect(rejectedDocument(document)).toContain('qsfp')
  })

  it('rejects an unknown numbering convention', () => {
    const document = validDocument()
    // Deliberately invalid data from outside the type system.
    ;(document.setup.switches[0].layout.sections[0] as { numbering: string }).numbering = 'custom'

    expect(rejectedDocument(document)).toContain('custom')
  })

  it('rejects a switch at a non-finite position', () => {
    const document = validDocument()
    document.setup.switches[0].x = Number.POSITIVE_INFINITY

    expect(rejectedDocument(document)).toContain('x')
  })

  it('rejects a non-finite viewport zoom', () => {
    const document = validDocument()
    document.ui.viewport.zoom = Number.NaN

    expect(rejectedDocument(document)).toContain('zoom')
  })
})
