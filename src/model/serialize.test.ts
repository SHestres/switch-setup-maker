import { describe, expect, it } from 'vitest'

import { sampleDocument as validDocument } from '@/test/fixtures'

import { parseDocument, parseDocumentText, serializeDocument } from './serialize'

function rejectedDocument(value: unknown): string {
  const result = parseDocument(value)
  if (result.ok) throw new Error('expected the document to be rejected')
  return result.error
}

describe('round trip', () => {
  it('serializes and parses back to the same document', () => {
    const document = validDocument()

    const result = parseDocumentText(serializeDocument(document))

    expect(result).toEqual({ ok: true, document })
  })

  it('pretty-prints the JSON', () => {
    expect(serializeDocument(validDocument())).toContain('\n  "version": 1,')
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
    expect(rejectedDocument({ version: 2 })).toContain('2')
  })

  it('rejects a document with no version', () => {
    expect(rejectedDocument({ setup: { switches: [], connections: [] } })).toContain('version')
  })

  it('accepts a bare version and fills in the rest', () => {
    const result = parseDocument({ version: 1 })

    expect(result).toEqual({
      ok: true,
      document: {
        version: 1,
        setup: { switches: [], connections: [] },
        ui: { theme: 'light', cableLayer: 'behind', viewport: { x: 0, y: 0, zoom: 1 } },
      },
    })
  })
})

describe('tolerance', () => {
  it('ignores unknown extra fields and fills missing name, model, numbering and ui', () => {
    const result = parseDocument({
      version: 1,
      notes: 'hand-written',
      setup: {
        switches: [
          {
            id: 'sw1',
            x: 0,
            y: 0,
            faceplate: 'ignored',
            layout: {
              rows: [{ ports: [{ id: 'p1', label: '1', kind: 'rj45', speed: '1G' }] }],
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
    expect(switch_.layout.numbering).toBe('odd-top-even-bottom')
    expect(result.document.ui).toEqual({
      theme: 'light',
      cableLayer: 'behind',
      viewport: { x: 0, y: 0, zoom: 1 },
    })
  })
})

describe('setup invariants', () => {
  it('rejects duplicate switch ids', () => {
    const document = validDocument()
    document.setup.switches[1].id = 'sw1'

    expect(rejectedDocument(document)).toContain('sw1')
  })

  it('rejects duplicate port ids within a switch', () => {
    const document = validDocument()
    document.setup.switches[0].layout.rows[1].ports[0].id = 'p1'

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

  it('rejects a row with no ports', () => {
    const document = validDocument()
    document.setup.switches[0].layout.rows[1].ports = []

    expect(rejectedDocument(document)).toContain('row')
  })

  it('rejects a layout with no rows', () => {
    const document = validDocument()
    document.setup.switches[0].layout.rows = []

    expect(rejectedDocument(document)).toContain('row')
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

  it('rejects a port with an unknown kind', () => {
    const document = validDocument()
    // Deliberately invalid data from outside the type system.
    ;(document.setup.switches[0].layout.rows[0].ports[0] as { kind: string }).kind = 'qsfp'

    expect(rejectedDocument(document)).toContain('qsfp')
  })
})
