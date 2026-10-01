import { describe, expect, it } from 'vitest'

import {
  connect,
  connectionsTouchingSwitch,
  disconnect,
  isPortConnected,
  removePorts,
  removeSwitch,
} from './connections'
import type { Setup, Switch } from './types'

function makeSwitch(id: string, portIds: string[]): Switch {
  return {
    id,
    name: id,
    model: '',
    x: 0,
    y: 0,
    layout: {
      sections: [
        {
          kind: 'rj45',
          speed: '1G',
          rows: 1,
          columns: portIds.length,
          numbering: 'sequential',
          startMode: 'custom',
          start: 1,
          ports: portIds.map((portId) => ({
            id: portId,
            label: portId.replace('p', ''),
            kind: 'rj45',
            speed: '1G',
          })),
        },
      ],
    },
  }
}

function makeSetup(): Setup {
  return {
    switches: [makeSwitch('sw1', ['p1', 'p2', 'p24']), makeSwitch('sw2', ['p1', 'p2'])],
    connections: [],
  }
}

describe('connect', () => {
  it('links two ports as an undirected pair', () => {
    const setup = makeSetup()

    const result = connect(setup, { switch: 'sw1', port: 'p1' }, { switch: 'sw2', port: 'p1' })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.setup.connections).toEqual([
      { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p1' } },
    ])
    expect(setup.connections).toEqual([])
  })

  it('allows two different ports on the same switch (loops are modelled later)', () => {
    const setup = makeSetup()

    const result = connect(setup, { switch: 'sw1', port: 'p1' }, { switch: 'sw1', port: 'p2' })

    expect(result.ok).toBe(true)
  })

  it('refuses a port linking to itself', () => {
    const result = connect(
      makeSetup(),
      { switch: 'sw1', port: 'p1' },
      { switch: 'sw1', port: 'p1' },
    )

    expect(result).toEqual({
      ok: false,
      problem: {
        kind: 'self-link',
        message: 'A port cannot connect to itself.',
        port: { switch: 'sw1', port: 'p1' },
      },
    })
  })

  it('refuses a pair that is already connected, whichever way round it is offered', () => {
    const first = connect(makeSetup(), { switch: 'sw1', port: 'p1' }, { switch: 'sw2', port: 'p1' })
    if (!first.ok) throw new Error('fixture failed to connect')

    const result = connect(
      first.setup,
      { switch: 'sw2', port: 'p1' },
      { switch: 'sw1', port: 'p1' },
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.problem.kind).toBe('duplicate')
  })

  it('refuses a port that is already in a connection, naming it', () => {
    const first = connect(
      makeSetup(),
      { switch: 'sw1', port: 'p24' },
      { switch: 'sw2', port: 'p1' },
    )
    if (!first.ok) throw new Error('fixture failed to connect')

    const result = connect(
      first.setup,
      { switch: 'sw1', port: 'p24' },
      { switch: 'sw2', port: 'p2' },
    )

    expect(result).toEqual({
      ok: false,
      problem: {
        kind: 'port-in-use',
        message: 'Port 24 is already connected.',
        port: { switch: 'sw1', port: 'p24' },
      },
    })
  })
})

describe('disconnect', () => {
  function setupWithLink(): Setup {
    const result = connect(
      makeSetup(),
      { switch: 'sw1', port: 'p1' },
      { switch: 'sw2', port: 'p1' },
    )
    if (!result.ok) throw new Error('fixture failed to connect')
    return result.setup
  }

  it('removes the pair whichever way round it is offered', () => {
    const updated = disconnect(
      setupWithLink(),
      { switch: 'sw2', port: 'p1' },
      { switch: 'sw1', port: 'p1' },
    )

    expect(updated.connections).toEqual([])
  })

  it('is a no-op when the pair is not connected', () => {
    const setup = setupWithLink()

    expect(disconnect(setup, { switch: 'sw1', port: 'p2' }, { switch: 'sw2', port: 'p2' })).toEqual(
      setup,
    )
  })
})

describe('connection queries', () => {
  it('reports whether a port is connected', () => {
    const result = connect(
      makeSetup(),
      { switch: 'sw1', port: 'p1' },
      { switch: 'sw2', port: 'p1' },
    )
    if (!result.ok) throw new Error('fixture failed to connect')

    expect(isPortConnected(result.setup, { switch: 'sw1', port: 'p1' })).toBe(true)
    expect(isPortConnected(result.setup, { switch: 'sw1', port: 'p2' })).toBe(false)
  })

  it('finds every connection touching a switch', () => {
    let setup = makeSetup()
    const first = connect(setup, { switch: 'sw1', port: 'p1' }, { switch: 'sw2', port: 'p1' })
    if (!first.ok) throw new Error('fixture failed to connect')
    const second = connect(
      first.setup,
      { switch: 'sw1', port: 'p2' },
      { switch: 'sw1', port: 'p24' },
    )
    if (!second.ok) throw new Error('fixture failed to connect')
    setup = second.setup

    expect(connectionsTouchingSwitch(setup, 'sw1')).toHaveLength(2)
    expect(connectionsTouchingSwitch(setup, 'sw2')).toHaveLength(1)
  })
})

describe('deleting switches and ports', () => {
  it('deleting a switch removes every connection touching it', () => {
    const first = connect(makeSetup(), { switch: 'sw1', port: 'p1' }, { switch: 'sw2', port: 'p1' })
    if (!first.ok) throw new Error('fixture failed to connect')

    const updated = removeSwitch(first.setup, 'sw2')

    expect(updated.switches.map((switch_) => switch_.id)).toEqual(['sw1'])
    expect(updated.connections).toEqual([])
  })

  it('deleting ports removes their connections and drops emptied sections', () => {
    const result = connect(
      makeSetup(),
      { switch: 'sw1', port: 'p24' },
      { switch: 'sw2', port: 'p1' },
    )
    if (!result.ok) throw new Error('fixture failed to connect')

    const updated = removePorts(result.setup, 'sw1', ['p24'])

    expect(updated.switches[0].layout.sections[0].ports.map((port) => port.id)).toEqual([
      'p1',
      'p2',
    ])
    expect(updated.connections).toEqual([])
  })
})
