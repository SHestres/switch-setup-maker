/**
 * The single versioned document that autosave and JSON files share.
 * Shape and invariants are specified in ticket 05 and the section model in ticket 26;
 * the tracker lives in `.scratch/`.
 */

export const DOCUMENT_VERSION = 2

export type PortKind = 'rj45' | 'sfp'

export const PORT_KINDS: readonly PortKind[] = ['rj45', 'sfp']

export type PortSpeed = '100M' | '1G' | '2.5G' | '5G' | '10G'

export const PORT_SPEEDS: readonly PortSpeed[] = ['100M', '1G', '2.5G', '5G', '10G']

/** The conventions a Section generates labels under. */
export const SECTION_NUMBERINGS = [
  'alternating-top-first',
  'alternating-bottom-first',
  'sequential',
] as const

export type SectionNumbering = (typeof SECTION_NUMBERINGS)[number]

/** Whether a Section counts on from the previous one, or pins its own start number. */
export const SECTION_START_MODES = ['auto', 'custom'] as const

export type SectionStartMode = (typeof SECTION_START_MODES)[number]

export type Theme = 'light' | 'dark' | 'blueprint'

export const THEMES: readonly Theme[] = ['light', 'dark', 'blueprint']

export type CableLayer = 'behind' | 'above'

export const CABLE_LAYERS: readonly CableLayer[] = ['behind', 'above']

export interface Port {
  /** Stable identity, unique within its switch (`p1`, `p2`, …). */
  id: string
  /** Printed number or name on the faceplate. Display data: changed freely, never a connection target. */
  label: string
  kind: PortKind
  speed: PortSpeed
}

/** A horizontal group of ports on a faceplate. Derived from a Section's grid, never stored. */
export interface Row {
  ports: Port[]
}

export interface Section {
  kind: PortKind
  speed: PortSpeed
  rows: number
  columns: number
  numbering: SectionNumbering
  startMode: SectionStartMode
  /** `custom` sections pin this number; `auto` sections carry their resolved start. */
  start: number
  /** All rows × columns ports, materialized row by row. */
  ports: Port[]
}

export interface PortLayout {
  sections: Section[]
}

export interface Switch {
  id: string
  /** Optional free text; blank prints nothing on the faceplate. */
  name: string
  /** Optional free text; the future device library may prefill or supersede it. */
  model: string
  /** Top-left corner in canvas units (1 unit = 1 CSS px at 100% zoom). */
  x: number
  y: number
  layout: PortLayout
}

/** A resolved reference to one port: the switch that carries it and the port itself. */
export interface PortRef {
  switch: string
  port: string
}

/** An undirected port-to-port link. The pair is its identity; cable metadata rides on it in future. */
export interface Connection {
  a: PortRef
  b: PortRef
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface UiState {
  theme: Theme
  cableLayer: CableLayer
  viewport: Viewport
}

export interface Setup {
  switches: Switch[]
  connections: Connection[]
}

export interface SetupDocument {
  version: number
  setup: Setup
  ui: UiState
}
