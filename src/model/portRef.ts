import type { PortRef } from './types'

/**
 * Stable `switch:port` key for a Port ref: the identity behind the connected-port
 * sets, connection pair dedupe and the canvas `data-*` hooks. It is never
 * serialised — the document stores the refs themselves.
 */
export function portKey(ref: PortRef): string {
  return `${ref.switch}:${ref.port}`
}
