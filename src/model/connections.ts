import { findPort } from './document'
import { removePortsFromSwitch } from './layout'
import type { Connection, PortRef, Setup } from './types'

export interface ConnectionProblem {
  kind: 'self-link' | 'duplicate' | 'port-in-use'
  /** Ready to show in a hint near the port (ticket 06's copy). */
  message: string
  /** The port the hint should point at, when there is one. */
  port?: PortRef
}

export type ConnectResult = { ok: true; setup: Setup } | { ok: false; problem: ConnectionProblem }

export function sameRef(a: PortRef, b: PortRef): boolean {
  return a.switch === b.switch && a.port === b.port
}

/** Pair identity is unordered: `{a, b}` and `{b, a}` are the same connection. */
export function samePair(connection: Connection, a: PortRef, b: PortRef): boolean {
  return (
    (sameRef(connection.a, a) && sameRef(connection.b, b)) ||
    (sameRef(connection.a, b) && sameRef(connection.b, a))
  )
}

export function isPortConnected(setup: Setup, ref: PortRef): boolean {
  return setup.connections.some(
    (connection) => sameRef(connection.a, ref) || sameRef(connection.b, ref),
  )
}

export function connectionsTouchingSwitch(setup: Setup, switchId: string): Connection[] {
  return setup.connections.filter(
    (connection) => connection.a.switch === switchId || connection.b.switch === switchId,
  )
}

/** The first rule this pair breaks, or `null` when it can be connected. */
export function connectionProblem(setup: Setup, a: PortRef, b: PortRef): ConnectionProblem | null {
  if (sameRef(a, b)) {
    return { kind: 'self-link', message: 'A port cannot connect to itself.', port: a }
  }

  if (setup.connections.some((connection) => samePair(connection, a, b))) {
    return { kind: 'duplicate', message: 'Those ports are already connected.', port: b }
  }

  for (const ref of [a, b]) {
    if (isPortConnected(setup, ref)) {
      return {
        kind: 'port-in-use',
        message: `Port ${findPort(setup, ref)?.label ?? ref.port} is already connected.`,
        port: ref,
      }
    }
  }

  return null
}

export function connect(setup: Setup, a: PortRef, b: PortRef): ConnectResult {
  const problem = connectionProblem(setup, a, b)
  if (problem) return { ok: false, problem }

  return { ok: true, setup: { ...setup, connections: [...setup.connections, { a, b }] } }
}

export function disconnect(setup: Setup, a: PortRef, b: PortRef): Setup {
  return {
    ...setup,
    connections: setup.connections.filter((connection) => !samePair(connection, a, b)),
  }
}

export function removeSwitch(setup: Setup, switchId: string): Setup {
  return {
    switches: setup.switches.filter((switch_) => switch_.id !== switchId),
    connections: setup.connections.filter(
      (connection) => connection.a.switch !== switchId && connection.b.switch !== switchId,
    ),
  }
}

/** Remove ports from a switch and every connection that touched them. */
export function removePorts(setup: Setup, switchId: string, portIds: Iterable<string>): Setup {
  const removed = new Set(portIds)

  return {
    switches: setup.switches.map((switch_) =>
      switch_.id === switchId ? removePortsFromSwitch(switch_, removed) : switch_,
    ),
    connections: setup.connections.filter((connection) => {
      const touches = (ref: PortRef) => ref.switch === switchId && removed.has(ref.port)
      return !touches(connection.a) && !touches(connection.b)
    }),
  }
}
