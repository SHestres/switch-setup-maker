import { samePair } from '@/model/connections'
import type { Connection, Setup } from '@/model/types'

import { connectionCurve, connectionMidpoint } from './geometry'
import { portKey } from './portRef'

export interface WireLayerProps {
  setup: Setup
  /** The selected Connection, by unordered pair; ephemeral UI state. */
  selected?: Connection | null
  /** Select a cable. Never opens the Switch inspector. */
  onSelectConnection?: (connection: Connection) => void
  /** Delete a cable from the affordance at its midpoint. */
  onDeleteConnection?: (connection: Connection) => void
}

/**
 * One SVG overlay in the canvas transform holding a curve for every
 * Connection in the Setup. Each cable carries an invisible, generously wide
 * hit target; the selected cable is highlighted and gets a delete affordance
 * anchored to its midpoint. The cable-above/behind ordering is decided by
 * where the Canvas places this layer.
 */
export function WireLayer({
  setup,
  selected = null,
  onSelectConnection,
  onDeleteConnection,
}: WireLayerProps) {
  const midpoint = selected ? connectionMidpoint(setup, selected) : undefined

  return (
    <>
      <svg className="wire-layer" data-testid="wire-layer" aria-hidden="true" width={1} height={1}>
        {setup.connections.map((connection) => {
          const d = connectionCurve(setup, connection)
          if (!d) return null
          const key = connectionKey(connection)
          const isSelected = selected !== null && samePair(connection, selected.a, selected.b)
          return (
            <g key={key} className="wire">
              <path className={isSelected ? 'wire selected' : 'wire'} d={d} data-connection={key} />
              <path
                className="wire-hit"
                d={d}
                data-wire-hit={key}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectConnection?.(connection)
                }}
              />
            </g>
          )
        })}
      </svg>
      {selected && midpoint && (
        <button
          type="button"
          className="wire-actions"
          data-wire-actions={connectionKey(selected)}
          style={{ left: midpoint.x, top: midpoint.y }}
          onClick={(event) => {
            event.stopPropagation()
            onDeleteConnection?.(selected)
          }}
        >
          Delete cable
        </button>
      )}
    </>
  )
}

function connectionKey(connection: Connection): string {
  return `${portKey(connection.a)}-${portKey(connection.b)}`
}
