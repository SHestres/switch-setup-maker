import { portKey } from '@/model/portRef'
import type { Setup } from '@/model/types'

import { pointForPort, wireCurve } from './geometry'
import type { PendingWireState } from './wiring'

export interface PendingWireProps {
  setup: Setup
  /** The ephemeral wire being drawn; never part of the document. */
  pending?: PendingWireState | null
}

/**
 * The ephemeral wire that follows the pointer while wiring (ticket 22). It
 * always paints above the faceplates — even when settled cables are behind
 * them — so the active gesture stays visible; it is not part of the cable
 * layer preference.
 */
export function PendingWire({ setup, pending = null }: PendingWireProps) {
  if (!pending) return null
  const from = pointForPort(setup, pending.from)
  // Without a live pointer the wire collapses to its source anchor.
  if (!from) return null

  return (
    <svg
      className="pending-wire-layer"
      data-testid="pending-wire-layer"
      aria-hidden="true"
      width={1}
      height={1}
    >
      <path
        className="pending"
        data-pending={portKey(pending.from)}
        d={wireCurve(from, pending.to ?? from)}
      />
    </svg>
  )
}
