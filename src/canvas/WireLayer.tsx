import type { Connection, PortRef, Setup } from '@/model/types'

import { connectionCurve, pointForPort, wireCurve } from './geometry'
import type { PendingWire } from './wiring'

export interface WireLayerProps {
  setup: Setup
  /** The ephemeral wire being drawn; never part of the document. */
  pending?: PendingWire | null
}

/**
 * One SVG overlay in the canvas transform holding a curve for every
 * Connection in the Setup, plus the pending wire while one is being drawn.
 * Endpoints are model-derived (see `geometry.ts`); the cable-above/behind
 * rule is ticket 23's, so for now the layer paints over the faceplates.
 */
export function WireLayer({ setup, pending }: WireLayerProps) {
  let pendingPath: string | null = null
  if (pending) {
    const from = pointForPort(setup, pending.from)
    // Without a live pointer the wire collapses to its source anchor.
    if (from) pendingPath = wireCurve(from, pending.to ?? from)
  }

  return (
    <svg className="wire-layer" data-testid="wire-layer" aria-hidden="true" width={1} height={1}>
      {setup.connections.map((connection) => {
        const d = connectionCurve(setup, connection)
        if (!d) return null
        const key = connectionKey(connection)
        return <path key={key} d={d} data-connection={key} />
      })}
      {pendingPath && pending && (
        <path
          className="pending"
          data-pending={`${pending.from.switch}:${pending.from.port}`}
          d={pendingPath}
        />
      )}
    </svg>
  )
}

function connectionKey(connection: Connection): string {
  return `${refKey(connection.a)}-${refKey(connection.b)}`
}

function refKey(ref: PortRef): string {
  return `${ref.switch}:${ref.port}`
}
