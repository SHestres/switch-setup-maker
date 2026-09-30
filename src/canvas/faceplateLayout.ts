import type { Port, Row } from '@/model/types'

/** A faceplate split into its main port field and its uplink banks. */
export interface FaceplateBanks {
  main: readonly Row[]
  left: readonly Row[]
  right: readonly Row[]
}

/**
 * Uplink cages render beside the RJ45 field: contiguous non-RJ45 rows at the
 * start go left, at the end go right, anything else stays on the main field.
 */
export function splitBanks(rows: readonly Row[]): FaceplateBanks {
  const firstMain = rows.findIndex(isMainRow)
  if (firstMain === -1) return { main: rows, left: [], right: [] }

  let lastMain = firstMain
  for (let index = firstMain + 1; index < rows.length; index++) {
    if (isMainRow(rows[index])) lastMain = index
  }

  const leftCount = rows.slice(0, firstMain).every(isUplinkRow) ? firstMain : 0
  const rightCount = rows.slice(lastMain + 1).every(isUplinkRow) ? rows.length - lastMain - 1 : 0
  return {
    main: rows.slice(leftCount, rows.length - rightCount),
    left: rows.slice(0, leftCount),
    right: rows.slice(rows.length - rightCount),
  }
}

/** Printed bank label, e.g. `SFP+ 49–52`; falls back to the kind for odd labels. */
export function bankLabel(rows: readonly Row[]): string {
  const ports = rows.flatMap((row) => row.ports)
  if (ports.length === 0) return ''
  const kind = ports[0].kind.toUpperCase()
  const first = ports[0].label
  const last = ports[ports.length - 1].label
  if (!isNumeric(first) || !isNumeric(last)) return kind
  return first === last ? `${kind} ${first}` : `${kind} ${first}–${last}`
}

export function portAriaLabel(port: Port, switchName: string): string {
  return `${port.kind.toUpperCase()} port ${port.label} (${port.speed}) on ${switchName}`
}

function isMainRow(row: Row): boolean {
  return row.ports.some((port) => port.kind === 'rj45')
}

function isUplinkRow(row: Row): boolean {
  return row.ports.length > 0 && row.ports.every((port) => port.kind !== 'rj45')
}

function isNumeric(value: string): boolean {
  return /^\d+$/.test(value)
}
