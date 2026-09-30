import type { Connection, PortRef, Setup } from '@/model/types'

import { connectionCurve } from './geometry'

export interface WireLayerProps {
  setup: Setup
}

/**
 * One SVG overlay in the canvas transform holding a curve for every
 * Connection in the Setup. Endpoints are model-derived (see `geometry.ts`);
 * the cable-above/behind rule is ticket 23's, so for now the layer paints
 * over the faceplates.
 */
export function WireLayer({ setup }: WireLayerProps) {
  return (
    <svg className="wire-layer" data-testid="wire-layer" aria-hidden="true" width={1} height={1}>
      {setup.connections.map((connection) => {
        const d = connectionCurve(setup, connection)
        if (!d) return null
        const key = connectionKey(connection)
        return <path key={key} d={d} data-connection={key} />
      })}
    </svg>
  )
}

function connectionKey(connection: Connection): string {
  return `${refKey(connection.a)}-${refKey(connection.b)}`
}

function refKey(ref: PortRef): string {
  return `${ref.switch}:${ref.port}`
}
