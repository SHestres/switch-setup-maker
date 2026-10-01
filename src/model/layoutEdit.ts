import { removePorts } from './connections'
import { findSwitch } from './document'
import { generateSectionLabels, nextPortId, resolveSectionStarts } from './layout'
import type { SectionSpec } from './layout'
import type { Port, Section, Setup, SetupDocument, Switch } from './types'

/**
 * One Section of a layout edit. `source` points at the section's index in the switch being
 * edited, or is `null` for a section appended by this edit. Sections are matched by `source`,
 * never by order, so removing or moving a middle section never hands its ports' identities
 * to another section.
 */
export interface SectionEdit {
  source: number | null
  spec: SectionSpec
}

/** The complete layout a switch should have after the edit. */
export interface LayoutEdit {
  sections: readonly SectionEdit[]
}

export interface LayoutEditPlan {
  /** The rebuilt switch: surviving ports keep their ids, new positions get fresh ids, labels regenerate. */
  switch: Switch
  /** Existing ports this edit drops; callers purge their connections. */
  removedPortIds: string[]
}

/**
 * Rebuild a switch's layout from section specs.
 *
 * Identity rules: a Section keeps its ports when its `source` section survives the edit;
 * within a Section, a port keeps its id when its (row, column) survives, new positions mint
 * ids after the switch's highest `p<n>`, and positions past the new grid are removed.
 * Removed Sections remove all of their ports. Kind, speed, numbering, start mode and labels
 * always follow the edit.
 */
export function planLayoutEdit(switch_: Switch, edit: LayoutEdit): LayoutEditPlan {
  const starts = resolveSectionStarts(edit.sections.map((sectionEdit) => sectionEdit.spec))
  const removedPortIds: string[] = []

  const keptSources = new Set(
    edit.sections.flatMap((sectionEdit) =>
      sectionEdit.source === null ? [] : [sectionEdit.source],
    ),
  )
  for (const [index, section] of switch_.layout.sections.entries()) {
    if (!keptSources.has(index)) removedPortIds.push(...section.ports.map((port) => port.id))
  }

  let nextId = Number(
    nextPortId(switch_.layout.sections.flatMap((section) => section.ports)).slice(1),
  )
  const mintPort = (label: string, spec: SectionSpec): Port => ({
    id: `p${nextId++}`,
    label,
    kind: spec.kind,
    speed: spec.speed,
  })

  const sections: Section[] = edit.sections.map((sectionEdit, index) => {
    const spec = sectionEdit.spec
    const source =
      sectionEdit.source === null ? undefined : switch_.layout.sections[sectionEdit.source]
    const labels = generateSectionLabels(spec, starts[index]).flat()

    const ports = labels.map((label, position) => {
      const row = Math.floor(position / spec.columns)
      const column = position % spec.columns
      const existing =
        source && row < source.rows && column < source.columns
          ? source.ports[row * source.columns + column]
          : undefined
      if (!existing) return mintPort(label, spec)
      return { ...existing, label, kind: spec.kind, speed: spec.speed }
    })

    if (source) {
      const kept = new Set(ports.map((port) => port.id))
      for (const port of source.ports) if (!kept.has(port.id)) removedPortIds.push(port.id)
    }

    return {
      kind: spec.kind,
      speed: spec.speed,
      rows: spec.rows,
      columns: spec.columns,
      numbering: spec.numbering,
      startMode: spec.startMode,
      start: starts[index],
      ports,
    }
  })

  return { switch: { ...switch_, layout: { ...switch_.layout, sections } }, removedPortIds }
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
