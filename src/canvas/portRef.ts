import type { PortRef } from '@/model/types'

/**
 * Stable `switch:port` key for a Port ref. Used for connection data
 * attributes and the connected-port sets the faceplate renders from.
 */
export function portKey(ref: PortRef): string {
  return `${ref.switch}:${ref.port}`
}
