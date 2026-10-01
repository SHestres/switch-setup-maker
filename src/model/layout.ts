import type {
  Port,
  PortKind,
  PortLayout,
  PortSpeed,
  Row,
  Section,
  SectionNumbering,
  SectionStartMode,
  Switch,
} from './types'

/** The builder's view of a section before ports exist: a grid, one kind, speed and numbering. */
export interface SectionSpec {
  rows: number
  columns: number
  kind: PortKind
  speed: PortSpeed
  numbering: SectionNumbering
  startMode: SectionStartMode
  /** Required for `custom`; recomputed from the chain for `auto`. */
  start?: number
}

/** The grid facts a label generation needs; Sections and specs both carry them. */
export interface SectionGrid {
  rows: number
  columns: number
  numbering: SectionNumbering
}

/**
 * Generate printed labels for one Section.
 *
 * `sequential` counts across each row in turn. The two alternating conventions pair each
 * consecutive pair of rows and hand out numbers down the columns — the chosen row takes the
 * start number and both rows step by 2 — then continue after that span. A trailing unpaired
 * row is treated as the top of its own pair.
 */
export function generateSectionLabels(grid: SectionGrid, start: number): string[][] {
  const labels: string[][] = []

  if (grid.numbering === 'sequential') {
    let next = start
    for (let row = 0; row < grid.rows; row += 1) {
      const rowLabels: string[] = []
      for (let column = 0; column < grid.columns; column += 1) rowLabels.push(String(next++))
      labels.push(rowLabels)
    }
    return labels
  }

  const bottomFirst = grid.numbering === 'alternating-bottom-first'
  let base = start
  for (let row = 0; row < grid.rows; row += 2) {
    const top: string[] = []
    const bottom: string[] = []
    for (let column = 0; column < grid.columns; column += 1) {
      top.push(String(bottomFirst ? base + 1 + 2 * column : base + 2 * column))
      bottom.push(String(bottomFirst ? base + 2 * column : base + 1 + 2 * column))
    }
    labels.push(top)
    if (row + 1 < grid.rows) labels.push(bottom)
    base += 2 * grid.columns
  }
  return labels
}

/** The span a Section's printed labels cover at a resolved start, e.g. `1–16`. */
export function sectionLabelRange(grid: SectionGrid, start: number): string {
  const labels = generateSectionLabels(grid, start).flat().map(Number)
  const first = Math.min(...labels)
  const last = Math.max(...labels)
  return first === last ? String(first) : `${first}–${last}`
}

function normalizeStart(start: number | undefined): number {
  if (start === undefined || !Number.isFinite(start)) return 0
  return Math.max(0, Math.trunc(start))
}

/**
 * Resolve every Section's start in one pass: an `auto` Section starts at the previous
 * Section's highest label + 1 (the first starts at 1); a `custom` Section uses its stored
 * start. Returns the start numbers in section order.
 */
export function resolveSectionStarts(sections: readonly SectionSpec[]): number[] {
  let next = 1
  return sections.map((section) => {
    const start = section.startMode === 'custom' ? normalizeStart(section.start) : next
    const labels = generateSectionLabels(section, start).flat()
    const highest = labels.reduce((max, label) => Math.max(max, Number(label)), start - 1)
    next = highest + 1
    return start
  })
}

/** Build Sections (with fresh stable ids) from a section-builder draft. */
export function materializeSections(specs: readonly SectionSpec[]): Section[] {
  const starts = resolveSectionStarts(specs)
  let portNumber = 0

  return specs.map((spec, index) => ({
    kind: spec.kind,
    speed: spec.speed,
    rows: spec.rows,
    columns: spec.columns,
    numbering: spec.numbering,
    startMode: spec.startMode,
    start: starts[index],
    ports: generateSectionLabels(spec, starts[index])
      .flat()
      .map((label) => ({
        id: `p${(portNumber += 1)}`,
        label,
        kind: spec.kind,
        speed: spec.speed,
      })),
  }))
}

/**
 * Regenerate every Section's labels and resolved start under its current convention,
 * keeping port ids and pinned custom starts.
 */
export function relabelSections(layout: PortLayout): Section[] {
  const starts = resolveSectionStarts(layout.sections)

  return layout.sections.map((section, index) => {
    const labels = generateSectionLabels(section, starts[index]).flat()
    return {
      ...section,
      start: starts[index],
      ports: section.ports.map((port, position) => ({
        ...port,
        label: labels[position] ?? port.label,
      })),
    }
  })
}

/** The Section's ports sliced into faceplate rows, row by row. */
export function sectionRows(section: Section): Row[] {
  const rows: Row[] = []
  for (let index = 0; index < section.rows; index += 1) {
    const ports = section.ports.slice(index * section.columns, (index + 1) * section.columns)
    if (ports.length > 0) rows.push({ ports })
  }
  return rows
}

/**
 * Remove ports from a switch, dropping any Section left empty. Defensive cascade helper:
 * production layout edits rebuild Sections through `planLayoutEdit`, so a partial removal
 * here is only ever an intermediate state. Connections are the caller's concern.
 */
export function removePortsFromSwitch(switch_: Switch, portIds: Iterable<string>): Switch {
  const removed = new Set(portIds)

  return {
    ...switch_,
    layout: {
      ...switch_.layout,
      sections: switch_.layout.sections
        .map((section) => ({
          ...section,
          ports: section.ports.filter((port) => !removed.has(port.id)),
        }))
        .filter((section) => section.ports.length > 0),
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
