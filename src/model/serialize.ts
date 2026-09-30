import {
  createDefaultUi,
  DEFAULT_CABLE_LAYER,
  DEFAULT_THEME,
  DEFAULT_VIEWPORT,
  findPort,
} from './document'
import type {
  CableLayer,
  Connection,
  NumberingPreset,
  Port,
  PortKind,
  PortLayout,
  PortRef,
  PortSpeed,
  Row,
  RowNumbering,
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
  NUMBERING_PRESETS,
  PORT_KINDS,
  PORT_SPEEDS,
  ROW_NUMBERINGS,
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

/** Validate an already-parsed value against ticket 05's invariants, filling in defaults. */
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

function readDocument(value: unknown): SetupDocument {
  if (!isObject(value)) fail('The document must be a JSON object.')
  if (value.version === undefined) fail('The document is missing its "version".')
  if (value.version !== DOCUMENT_VERSION) {
    fail(
      `Unsupported document version ${JSON.stringify(value.version)}; this app reads version ${DOCUMENT_VERSION}.`,
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

  const switches = readSwitches(value.switches)
  return { switches, connections: readConnections(value.connections, switches) }
}

function readSwitches(value: unknown): Switch[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) fail('"setup.switches" must be an array.')

  const ids = new Set<string>()
  return value.map((raw, index) => {
    const where = `switches[${index}]`
    if (!isObject(raw)) fail(`${where} must be an object.`)

    const id = readRequiredString(raw.id, `${where}.id`)
    if (ids.has(id)) fail(`${where} repeats the switch id "${id}".`)
    ids.add(id)

    return readSwitch(raw, where)
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

function readLayout(raw: JsonObject, where: string): PortLayout {
  const numbering: NumberingPreset =
    raw.numbering === undefined
      ? 'odd-top-even-bottom'
      : readOneOf(raw.numbering, NUMBERING_PRESETS, `${where}.layout.numbering`)

  if (!Array.isArray(raw.rows) || raw.rows.length === 0) {
    fail(`${where}.layout.rows must be a non-empty array of rows.`)
  }

  const portIds = new Set<string>()
  const rows = raw.rows.map((row, index) => readRow(row, `${where}.layout.rows[${index}]`, portIds))
  return { numbering, rows }
}

function readRow(value: unknown, where: string, portIds: Set<string>): Row {
  if (!isObject(value)) fail(`${where} must be an object.`)

  const numbering: RowNumbering | undefined =
    value.numbering === undefined
      ? undefined
      : readOneOf(value.numbering, ROW_NUMBERINGS, `${where}.numbering`)

  if (!Array.isArray(value.ports) || value.ports.length === 0) {
    fail(`${where} needs at least one port.`)
  }

  const ports = value.ports.map((port, index) =>
    readPort(port, `${where}.ports[${index}]`, portIds),
  )
  return numbering === undefined ? { ports } : { numbering, ports }
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

function portKey(ref: PortRef): string {
  return `${ref.switch}\u0000${ref.port}`
}
