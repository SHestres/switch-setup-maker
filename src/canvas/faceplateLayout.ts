import type { Port } from '@/model/types'

export function portAriaLabel(port: Port, switchName: string): string {
  return `${port.kind.toUpperCase()} port ${port.label} (${port.speed}) on ${switchName}`
}
