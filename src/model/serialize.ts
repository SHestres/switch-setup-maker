import {
  createDefaultUi,
  DEFAULT_CABLE_LAYER,
  DEFAULT_THEME,
  DEFAULT_VIEWPORT,
  findPort,
} from './document'
import { generateSectionLabels, nextPortId, relabelSections, resolveSectionStarts } from './layout'
import type { SectionSpec } from './layout'
import { portKey } from './portRef'
import type {
  CableLayer,
  Connection,
  Port,
  PortKind,
  PortLayout,
  PortRef,
  PortSpeed,
  Section,
  SectionNumbering,
  Setup,
  SetupDocument,
  Switch,
  Theme,
  UiState,
  Viewport,
} from './types'
import {
  CABLE_LAYERS,
  DOCUMENT_VERSION,
  PORT_KINDS,
  PORT_SPEEDS,
  SECTION_NUMBERINGS,
  SECTION_START_MODES,
  THEMES,
} from './types'

export type DocumentParseResult =
  { ok: true; document: SetupDocument } | { ok: false; error: string }

/** The exact bytes that autosave and the Export button share. */
export function serializeDocument(document: SetupDocument): string {
  return JSON.stringify(document, null, 2)
}

export function parseDocumentText(text: string): DocumentParseResult {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }
  return parseDocument(value)
}

/** Validate an already-parsed value, filling in defaults and migrating version 1. */
export function parseDocument(value: unknown): DocumentParseResult {
  try {
    return { ok: true, document: readDocument(value) }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'The document is not valid.',
    }
  }
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fail(message: string): never {
  throw new Error(message)
}

function readRequiredString(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(`${where} must be a non-empty string.`)
  return value
}

function readOptionalString(value: unknown, where: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') fail(`${where} must be text.`)
  return value
}

function readFiniteNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    fail(`${where} must be a finite number.`)
  return value
}

function readOneOf<T extends string>(value: unknown, allowed: readonly T[], where: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(`${where} must be one of ${allowed.join(', ')}; got ${JSON.stringify(value)}.`)
  }
  return value as T
}

function readGridSize(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    fail(`${where} must be a whole number of at least 1.`)
  }
  return value
}

function readStartNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    fail(`${where} must be a whole number of 0 or more.`)
  }
  return value
}

function readDocument(value: unknown): SetupDocument {
  if (!isObject(value)) fail('The document must be a JSON object.')
  if (value.version === undefined) fail('The document is missing its "version".')

  if (value.version === V1_DOCUMENT_VERSION) return readV1Document(value)
  if (value.version !== DOCUMENT_VERSION) {
    fail(
      `Unsupported document version ${JSON.stringify(value.version)}; this app reads versions ${V1_DOCUMENT_VERSION} and ${DOCUMENT_VERSION}.`,
    )
  }

  return {
    version: DOCUMENT_VERSION,
    setup: value.setup === undefined ? { switches: [], connections: [] } : readSetup(value.setup),
    ui: value.ui === undefined ? createDefaultUi() : readUi(value.ui),
  }
}

function readSetup(value: unknown): Setup {
  if (!isObject(value)) fail('"setup" must be an object.')

  const switches = readSwitchList(value.switches, readSwitch)
  return { switches, connections: readConnections(value.connections, switches) }
}

/**
 * Read a switch array, rejecting duplicate ids. Version 1 and 2 differ only in
 * how one switch's layout is read, so the array handling is shared.
 */
function readSwitchList(
  value: unknown,
  readOne: (raw: JsonObject, where: string) => Switch,
): Switch[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) fail('"setup.switches" must be an array.')

  const ids = new Set<string>()
  return value.map((raw, index) => {
    const where = `switches[${index}]`
    if (!isObject(raw)) fail(`${where} must be an object.`)

    const id = readRequiredString(raw.id, `${where}.id`)
    if (ids.has(id)) fail(`${where} repeats the switch id "${id}".`)
    ids.add(id)

    return readOne(raw, where)
  })
}

function readSwitch(raw: JsonObject, where: string): Switch {
  const layout = raw.layout
  if (!isObject(layout)) fail(`${where}.layout must be an object.`)

  return {
    id: readRequiredString(raw.id, `${where}.id`),
    name: readOptionalString(raw.name, `${where}.name`) ?? '',
    model: readOptionalString(raw.model, `${where}.model`) ?? '',
    x: readFiniteNumber(raw.x, `${where}.x`),
    y: readFiniteNumber(raw.y, `${where}.y`),
    layout: readLayout(layout, where),
  }
}

/**
 * Sections carry generated data (labels, resolved auto starts), so parsing normalizes
 * them: whatever came in, the document in memory matches its numbering conventions.
 */
function readLayout(raw: JsonObject, where: string): PortLayout {
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    fail(`${where}.layout.sections must be a non-empty array of sections.`)
  }

  const portIds = new Set<string>()
  const sections = raw.sections.map((section, index) =>
    readSection(section, `${where}.layout.sections[${index}]`, portIds),
  )
  return { sections: relabelSections({ sections }) }
}

function readSection(value: unknown, where: string, portIds: Set<string>): Section {
  if (!isObject(value)) fail(`${where} must be an object.`)

  const kind = readOneOf(value.kind, PORT_KINDS, `${where}.kind`) as PortKind
  const speed = readOneOf(value.speed, PORT_SPEEDS, `${where}.speed`) as PortSpeed
  const rows = readGridSize(value.rows, `${where}.rows`)
  const columns = readGridSize(value.columns, `${where}.columns`)
  const numbering: SectionNumbering =
    value.numbering === undefined
      ? 'alternating-top-first'
      : readOneOf(value.numbering, SECTION_NUMBERINGS, `${where}.numbering`)
  const startMode =
    value.startMode === undefined
      ? 'auto'
      : readOneOf(value.startMode, SECTION_START_MODES, `${where}.startMode`)
  const start = value.start === undefined ? 0 : readStartNumber(value.start, `${where}.start`)

  const ports = readPorts(value.ports, where, portIds)
  if (ports.length !== rows * columns) {
    fail(`${where} declares ${rows} rows × ${columns} columns but carries ${ports.length} ports.`)
  }
  assertPortsMatch(ports, { kind, speed }, where, 'section')

  return { kind, speed, rows, columns, numbering, startMode, start, ports }
}

/** Read a non-empty port array; port ids are unique across the whole switch. */
function readPorts(value: unknown, where: string, portIds: Set<string>): Port[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${where} needs at least one port.`)
  return value.map((port, index) => readPort(port, `${where}.ports[${index}]`, portIds))
}

/** A Section, like a version 1 row, carries exactly one kind and one speed. */
function assertPortsMatch(
  ports: readonly Port[],
  expected: { kind: PortKind; speed: PortSpeed },
  where: string,
  owner: 'section' | 'row',
): void {
  for (const [index, port] of ports.entries()) {
    if (port.kind !== expected.kind) {
      fail(
        `${where}.ports[${index}].kind "${port.kind}" must match the ${owner}'s kind "${expected.kind}".`,
      )
    }
    if (port.speed !== expected.speed) {
      fail(
        `${where}.ports[${index}].speed "${port.speed}" must match the ${owner}'s speed "${expected.speed}".`,
      )
    }
  }
}

function readPort(value: unknown, where: string, portIds: Set<string>): Port {
  if (!isObject(value)) fail(`${where} must be an object.`)

  const id = readRequiredString(value.id, `${where}.id`)
  if (portIds.has(id)) fail(`${where} repeats the port id "${id}".`)
  portIds.add(id)

  return {
    id,
    label: readRequiredString(value.label, `${where}.label`),
    kind: readOneOf(value.kind, PORT_KINDS, `${where}.kind`) as PortKind,
    speed: readOneOf(value.speed, PORT_SPEEDS, `${where}.speed`) as PortSpeed,
  }
}

function readConnections(value: unknown, switches: Switch[]): Connection[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) fail('"setup.connections" must be an array.')

  const setup: Setup = { switches, connections: [] }
  const usedPorts = new Set<string>()
  const seenPairs = new Set<string>()

  return value.map((raw, index) => {
    const where = `connections[${index}]`
    if (!isObject(raw)) fail(`${where} must be an object.`)

    const a = readPortRef(raw.a, `${where}.a`, setup)
    const b = readPortRef(raw.b, `${where}.b`, setup)

    if (a.switch === b.switch && a.port === b.port) {
      fail(`${where} links port "${a.port}" on switch "${a.switch}" to itself.`)
    }

    const pair = [portKey(a), portKey(b)].sort().join('|')
    if (seenPairs.has(pair)) fail(`${where} repeats a connection that already exists.`)
    seenPairs.add(pair)

    for (const ref of [a, b]) {
      const key = portKey(ref)
      if (usedPorts.has(key)) {
        fail(
          `${where} reuses port "${ref.port}" on switch "${ref.switch}", which is already connected.`,
        )
      }
      usedPorts.add(key)
    }

    return { a, b }
  })
}

function readPortRef(value: unknown, where: string, setup: Setup): PortRef {
  if (!isObject(value)) fail(`${where} must be a port reference.`)

  const ref: PortRef = {
    switch: readRequiredString(value.switch, `${where}.switch`),
    port: readRequiredString(value.port, `${where}.port`),
  }
  if (!findPort(setup, ref)) {
    fail(`${where} points at port "${ref.port}" on switch "${ref.switch}", which does not exist.`)
  }
  return ref
}

function readUi(value: unknown): UiState {
  if (!isObject(value)) fail('"ui" must be an object.')

  return {
    theme:
      value.theme === undefined
        ? DEFAULT_THEME
        : (readOneOf(value.theme, THEMES, 'ui.theme') as Theme),
    cableLayer:
      value.cableLayer === undefined
        ? DEFAULT_CABLE_LAYER
        : (readOneOf(value.cableLayer, CABLE_LAYERS, 'ui.cableLayer') as CableLayer),
    viewport: value.viewport === undefined ? { ...DEFAULT_VIEWPORT } : readViewport(value.viewport),
  }
}

function readViewport(value: unknown): Viewport {
  if (!isObject(value)) fail('"ui.viewport" must be an object.')

  return {
    x: readFiniteNumber(value.x, 'ui.viewport.x'),
    y: readFiniteNumber(value.y, 'ui.viewport.y'),
    zoom: readFiniteNumber(value.zoom, 'ui.viewport.zoom'),
  }
}

/* ----------------------------------------------------------------------------------------------
 * Version 1 migration
 *
 * Policy: version 1 documents convert automatically. Generated row numbers become Section
 * numbering; a `custom` layout is the one shape version 2 cannot represent, and is rejected
 * with a message naming it. The exact row → section mapping lives in `sectionsFromV1Rows`.
 * -------------------------------------------------------------------------------------------- */

const V1_DOCUMENT_VERSION = 1

const V1_NUMBERINGS = [
  'odd-top-even-bottom',
  'sequential',
  'even-top-zero-based',
  'custom',
] as const
type V1Numbering = (typeof V1_NUMBERINGS)[number]

const V1_ROW_NUMBERINGS = ['continue', 'start-over'] as const
type V1RowNumbering = (typeof V1_ROW_NUMBERINGS)[number]

interface V1Row {
  numbering?: V1RowNumbering
  ports: Port[]
}

interface V1Mapping {
  numbering: SectionNumbering
  base: number
}

/**
 * Version 1's conventions and the Section convention that reproduces them:
 * `odd-top-even-bottom` is alternating top-first from 1; `even-top-zero-based` is the same
 * convention from 0 (0, 2, … on top); `sequential` counts row-major from 1.
 */
const V1_SECTION_MAPPING: Record<Exclude<V1Numbering, 'custom'>, V1Mapping> = {
  'odd-top-even-bottom': { numbering: 'alternating-top-first', base: 1 },
  'even-top-zero-based': { numbering: 'alternating-top-first', base: 0 },
  sequential: { numbering: 'sequential', base: 1 },
}

function readV1Document(value: JsonObject): SetupDocument {
  const setup =
    value.setup === undefined ? { switches: [], connections: [] } : readV1Setup(value.setup)
  return {
    version: DOCUMENT_VERSION,
    setup,
    ui: value.ui === undefined ? createDefaultUi() : readUi(value.ui),
  }
}

function readV1Setup(value: unknown): Setup {
  if (!isObject(value)) fail('"setup" must be an object.')

  const switches = readSwitchList(value.switches, readV1Switch)
  return { switches, connections: readConnections(value.connections, switches) }
}

function readV1Switch(raw: JsonObject, where: string): Switch {
  const layout = raw.layout
  if (!isObject(layout)) fail(`${where}.layout must be an object.`)

  const numbering: V1Numbering =
    layout.numbering === undefined
      ? 'odd-top-even-bottom'
      : readOneOf(layout.numbering, V1_NUMBERINGS, `${where}.layout.numbering`)
  if (numbering === 'custom') {
    fail(
      `${where} uses custom port labels, which version 2 cannot represent; choose a generated numbering and import it again.`,
    )
  }

  if (!Array.isArray(layout.rows) || layout.rows.length === 0) {
    fail(`${where}.layout.rows must be a non-empty array of rows.`)
  }

  const portIds = new Set<string>()
  const rows = layout.rows.map((row, index) =>
    readV1Row(row, `${where}.layout.rows[${index}]`, portIds),
  )

  return {
    id: readRequiredString(raw.id, `${where}.id`),
    name: readOptionalString(raw.name, `${where}.name`) ?? '',
    model: readOptionalString(raw.model, `${where}.model`) ?? '',
    x: readFiniteNumber(raw.x, `${where}.x`),
    y: readFiniteNumber(raw.y, `${where}.y`),
    layout: { sections: sectionsFromV1Rows(rows, numbering) },
  }
}

function readV1Row(value: unknown, where: string, portIds: Set<string>): V1Row {
  if (!isObject(value)) fail(`${where} must be an object.`)

  const numbering: V1RowNumbering | undefined =
    value.numbering === undefined
      ? undefined
      : readOneOf(value.numbering, V1_ROW_NUMBERINGS, `${where}.numbering`)

  const ports = readPorts(value.ports, where, portIds)
  // A version 2 Section carries one kind and one speed, so a mixed row cannot be mapped.
  assertPortsMatch(ports, ports[0], where, 'row')

  return numbering === undefined ? { ports } : { numbering, ports }
}

/**
 * The version 1 → 2 layout mapping.
 *
 * - Rows run into one group while they keep the same kind and speed and do not `start-over`.
 * - Each group becomes one Section per pair of rows: a Section can then interleave the pair
 *   the way version 1 did. A trailing unpaired row becomes its own one-row sequential
 *   Section, because that is how version 1 counted it.
 * - A `start-over` row (or a zero-based switch's first group) pins the group's start at the
 *   convention's base; every other group chains on from the previous Section.
 * - Ports keep their ids and order; a row narrower than its Section's widest row is padded
 *   with fresh ids, because version 2 sections are rectangular.
 * - Labels are regenerated from the Section conventions. For the generated version 1
 *   conventions this reproduces the old labels, except where version 1 interleaved across a
 *   kind/speed change (a hand-written corner).
 */
function sectionsFromV1Rows(
  rows: readonly V1Row[],
  numbering: Exclude<V1Numbering, 'custom'>,
): Section[] {
  const mapping = V1_SECTION_MAPPING[numbering]

  interface Group {
    rows: V1Row[]
    /** True when the group's first Section pins the convention base rather than chaining. */
    opensPinned: boolean
    kind: PortKind
    speed: PortSpeed
  }

  const groups: Group[] = []
  for (const row of rows) {
    const kind = row.ports[0].kind
    const speed = row.ports[0].speed
    const previous = groups[groups.length - 1]
    const startsOver = row.numbering === 'start-over'

    if (!previous || startsOver || previous.kind !== kind || previous.speed !== speed) {
      groups.push({
        rows: [row],
        opensPinned: startsOver || (groups.length === 0 && mapping.base === 0),
        kind,
        speed,
      })
    } else {
      previous.rows.push(row)
    }
  }

  const specs: SectionSpec[] = []
  for (const group of groups) {
    if (mapping.numbering === 'sequential') {
      specs.push({
        rows: group.rows.length,
        columns: widestRow(group.rows),
        kind: group.kind,
        speed: group.speed,
        numbering: 'sequential',
        startMode: group.opensPinned ? 'custom' : 'auto',
        start: mapping.base,
      })
      continue
    }

    const paired = group.rows.length - (group.rows.length % 2)
    if (paired > 0) {
      specs.push({
        rows: paired,
        columns: widestRow(group.rows.slice(0, paired)),
        kind: group.kind,
        speed: group.speed,
        numbering: 'alternating-top-first',
        startMode: group.opensPinned ? 'custom' : 'auto',
        start: mapping.base,
      })
    }
    if (paired < group.rows.length) {
      const lone = group.rows[group.rows.length - 1]
      specs.push({
        rows: 1,
        columns: lone.ports.length,
        kind: group.kind,
        speed: group.speed,
        numbering: 'sequential',
        startMode: group.opensPinned && paired === 0 ? 'custom' : 'auto',
        start: mapping.base,
      })
    }
  }

  const starts = resolveSectionStarts(specs)
  let nextId = Number(nextPortId(rows.flatMap((row) => row.ports)).slice(1))
  let rowCursor = 0

  return specs.map((spec, index) => {
    const labels = generateSectionLabels(spec, starts[index]).flat()
    const ports: Port[] = []
    for (let position = 0; position < spec.rows * spec.columns; position += 1) {
      const row = rowCursor + Math.floor(position / spec.columns)
      const column = position % spec.columns
      const source = rows[row]?.ports[column]
      const label = labels[position]
      ports.push(
        source
          ? { ...source, label }
          : { id: `p${nextId++}`, label, kind: spec.kind, speed: spec.speed },
      )
    }
    rowCursor += spec.rows
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
}

function widestRow(rows: readonly V1Row[]): number {
  return rows.reduce((widest, row) => Math.max(widest, row.ports.length), 0)
}
