import type { PortRef } from '@/model/types'

import type { Point } from './geometry'

/**
 * Ephemeral wiring state (ticket 22). Neither ever enters the document or
 * storage; the document only changes once `connect` lands a pair.
 */

/** The wire being drawn: from a Port to the pointer (or the Port when idle). */
export interface PendingWireState {
  from: PortRef
  to?: Point
}

/** A refusal to show near the offending Port, in the connection rules' copy. */
export interface WireHintState {
  port: PortRef
  message: string
}

/** How long a refusal hint stays before fading out. */
export const WIRE_HINT_MS = 3000
