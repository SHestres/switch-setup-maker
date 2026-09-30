import type { RowSpec } from './layout'
import { generateLabels, nextPortId } from './layout'
import { findSwitch } from './document'
import { removePorts } from './connections'
import type { GeneratedNumberingPreset, Port, Row, Setup, SetupDocument, Switch } from './types'

/**
 * One row of a layout edit. `source` points at the row's index in the switch being edited,
 * or is `null` for a row appended by this edit. Rows are matched by `source`, never by order,
 * so removing a middle row never hands its ports' identities to the row below.
 */
export interface RowEdit {
  source: number | null
  spec: RowSpec
}

/** The complete layout a switch should have after the edit. */
export interface LayoutEdit {
  numbering: GeneratedNumberingPreset
  rows: readonly RowEdit[]
}

export interface LayoutEditPlan {
  /** The rebuilt switch: surviving ports keep their ids, new columns get fresh ids, labels regenerate. */
  switch: Switch
  /** Existing ports this edit drops; callers purge their connections. */
  removedPortIds: string[]
}

/**
 * Rebuild a switch's layout from row specs.
 *
 * Identity rules: a row keeps its ports when its `source` row survives the edit; within a row,
 * a port keeps its id when its column survives, new columns mint ids after the switch's highest
 * `p<n>`, and columns past the new count are removed. Removed rows remove all of their ports.
 * Kind, speed and labels always follow the edit; `custom` numbering is not accepted.
 */
export function planLayoutEdit(switch_: Switch, edit: LayoutEdit): LayoutEditPlan {
  const labels = generateLabels(
    edit.numbering,
    edit.rows.map((rowEdit) => rowEdit.spec),
  )
  const removedPortIds: string[] = []

  const keptSources = new Set(
    edit.rows.flatMap((rowEdit) => (rowEdit.source === null ? [] : [rowEdit.source])),
  )
  for (const [index, row] of switch_.layout.rows.entries()) {
    if (!keptSources.has(index)) removedPortIds.push(...row.ports.map((port) => port.id))
  }

  let nextId = Number(nextPortId(switch_.layout.rows.flatMap((row) => row.ports)).slice(1))
  const mintPort = (label: string, spec: RowSpec): Port => ({
    id: `p${nextId++}`,
    label,
    kind: spec.kind,
    speed: spec.speed,
  })

  const rows: Row[] = edit.rows.map((rowEdit, index) => {
    const sourceRow = rowEdit.source === null ? undefined : switch_.layout.rows[rowEdit.source]
    const ports = labels[index].map((label, column) => {
      const existing = sourceRow?.ports[column]
      if (!existing) return mintPort(label, rowEdit.spec)
      return { ...existing, label, kind: rowEdit.spec.kind, speed: rowEdit.spec.speed }
    })
    if (sourceRow) {
      for (const port of sourceRow.ports.slice(rowEdit.spec.count)) removedPortIds.push(port.id)
    }

    const row: Row = { ports }
    if (index > 0) row.numbering = rowEdit.spec.numbering ?? 'continue'
    return row
  })

  return {
    switch: { ...switch_, layout: { ...switch_.layout, numbering: edit.numbering, rows } },
    removedPortIds,
  }
}

/** How many connections would be severed if these ports (all on `switchId`) were removed. */
export function countSeveredConnections(
  setup: Setup,
  switchId: string,
  portIds: Iterable<string>,
): number {
  const removed = new Set(portIds)
  if (removed.size === 0) return 0

  return setup.connections.filter(
    (connection) =>
      (connection.a.switch === switchId && removed.has(connection.a.port)) ||
      (connection.b.switch === switchId && removed.has(connection.b.port)),
  ).length
}

/** Apply an edit to the document: rebuild the switch and purge every connection that lost its port. */
export function applyLayoutEdit(
  document: SetupDocument,
  switchId: string,
  edit: LayoutEdit,
): SetupDocument {
  const switch_ = findSwitch(document.setup, switchId)
  if (!switch_) return document

  const plan = planLayoutEdit(switch_, edit)
  const setup = removePorts(document.setup, switchId, plan.removedPortIds)
  return {
    ...document,
    setup: {
      ...setup,
      switches: setup.switches.map((current) => (current.id === switchId ? plan.switch : current)),
    },
  }
}
