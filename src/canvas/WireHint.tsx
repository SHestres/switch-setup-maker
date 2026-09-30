import { findSwitch } from '@/model/document'
import type { Setup } from '@/model/types'

import { portAnchor } from './geometry'
import { portKey } from './portRef'
import type { WireHintState } from './wiring'

export interface WireHintProps {
  setup: Setup
  hint: WireHintState
}

/**
 * A transient refusal bubble anchored above the offending Port (ticket 22).
 * The copy comes from the connection rules; this component only places it.
 */
export function WireHint({ setup, hint }: WireHintProps) {
  const switch_ = findSwitch(setup, hint.port.switch)
  const anchor = switch_ ? portAnchor(switch_, hint.port.port) : undefined
  if (!anchor) return null

  return (
    <div
      role="status"
      className="wire-hint"
      data-hint-port={portKey(hint.port)}
      style={{ left: anchor.x, top: anchor.y }}
    >
      {hint.message}
    </div>
  )
}
