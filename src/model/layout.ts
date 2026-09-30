import type {
  GeneratedNumberingPreset,
  Port,
  PortKind,
  PortLayout,
  PortSpeed,
  Row,
  RowNumbering,
  Switch,
} from './types'

/** The builder's view of a row before ports exist: a count, a kind, a speed and a numbering choice. */
export interface RowSpec {
  count: number
  kind: PortKind
  speed: PortSpeed
  /** Only meaningful on rows after the first; absent means `continue`. */
  numbering?: RowNumbering
}

/** Where each convention starts counting. */
const BASE: Record<GeneratedNumberingPreset, number> = {
  'odd-top-even-bottom': 1,
  sequential: 1,
  'even-top-zero-based': 0,
}

/**
 * Generate printed labels for a whole layout.
 *
 * `sequential` counts across each row in turn. The two column-pair conventions pair each
 * consecutive pair of rows and hand out numbers down the columns (top port first), which for
 * a base of 1 yields odd-top/even-bottom and for a base of 0 yields Juniper's even-top/odd-bottom.
 * A row that starts over opens a new column-pair group and resets the count to the convention's base.
 */
export function generateLabels(
  preset: GeneratedNumberingPreset,
  rows: readonly RowSpec[],
): string[][] {
  const labels: string[][] = rows.map(() => [])
  let next = BASE[preset]

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    if (index > 0 && row.numbering === 'start-over') next = BASE[preset]

    if (preset === 'sequential') {
      for (let column = 0; column < row.count; column += 1) labels[index].push(String(next++))
      continue
    }

    const bottomIndex = index + 1
    const bottom =
      bottomIndex < rows.length && rows[bottomIndex].numbering !== 'start-over'
        ? rows[bottomIndex]
        : undefined

    const width = bottom ? Math.max(row.count, bottom.count) : row.count
    for (let column = 0; column < width; column += 1) {
      if (column < row.count) labels[index].push(String(next++))
      if (bottom && column < bottom.count) labels[bottomIndex].push(String(next++))
    }

    if (bottom) index += 1
  }

  return labels
}

/** Build ports (with fresh stable ids) from a row-builder draft. */
export function materialiseRows(preset: GeneratedNumberingPreset, rows: readonly RowSpec[]): Row[] {
  const labels = generateLabels(preset, rows)
  let portNumber = 0

  return rows.map((row, index) => {
    const materialised: Row = {
      ports: labels[index].map((label) => ({
        id: `p${(portNumber += 1)}`,
        label,
        kind: row.kind,
        speed: row.speed,
      })),
    }
    if (index > 0 && row.numbering !== undefined) materialised.numbering = row.numbering
    return materialised
  })
}

/** Regenerate every printed label under the layout's current convention, keeping port ids. */
export function relabelRows(layout: PortLayout): Row[] {
  if (layout.numbering === 'custom') return layout.rows

  const labels = generateLabels(
    layout.numbering,
    layout.rows.map((row, index) => ({
      count: row.ports.length,
      kind: row.ports[0].kind,
      speed: row.ports[0].speed,
      ...(index > 0 && row.numbering !== undefined ? { numbering: row.numbering } : {}),
    })),
  )

  return layout.rows.map((row, index) => ({
    ...row,
    ports: row.ports.map((port, column) => ({ ...port, label: labels[index][column] })),
  }))
}

/** Remove ports from a switch, dropping any row left empty. Connections are the caller's concern. */
export function removePortsFromSwitch(switch_: Switch, portIds: Iterable<string>): Switch {
  const removed = new Set(portIds)

  return {
    ...switch_,
    layout: {
      ...switch_.layout,
      rows: switch_.layout.rows
        .map((row) => ({ ...row, ports: row.ports.filter((port) => !removed.has(port.id)) }))
        .filter((row) => row.ports.length > 0),
    },
  }
}

/** One past the highest `p<n>` suffix in use, so ids stay readable and are never reused while present. */
export function nextPortId(ports: Iterable<Port>): string {
  let highest = 0
  for (const port of ports) {
    const match = /^p(\d+)$/.exec(port.id)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return `p${highest + 1}`
}
