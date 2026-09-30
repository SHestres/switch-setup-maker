/**
 * The single versioned document that autosave and JSON files share.
 * Shape and invariants are specified in ticket 05; the tracker lives in `.scratch/`.
 */

export const DOCUMENT_VERSION = 1

export type PortKind = 'rj45' | 'sfp' | 'sfp+'

export const PORT_KINDS: readonly PortKind[] = ['rj45', 'sfp', 'sfp+']

export type PortSpeed = '100M' | '1G' | '2.5G' | '5G' | '10G'

export const PORT_SPEEDS: readonly PortSpeed[] = ['100M', '1G', '2.5G', '5G', '10G']

/** The three conventions the builder can generate; `custom` means labels are user-owned. */
export const GENERATED_NUMBERING_PRESETS = [
  'odd-top-even-bottom',
  'sequential',
  'even-top-zero-based',
] as const

export type GeneratedNumberingPreset = (typeof GENERATED_NUMBERING_PRESETS)[number]

export type NumberingPreset = GeneratedNumberingPreset | 'custom'

export const NUMBERING_PRESETS: readonly NumberingPreset[] = [
  ...GENERATED_NUMBERING_PRESETS,
  'custom',
]

/** Rows after the first: keep counting, or restart at the preset's base number. */
export type RowNumbering = 'continue' | 'start-over'

export const ROW_NUMBERINGS: readonly RowNumbering[] = ['continue', 'start-over']

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

export interface Row {
  /** Only meaningful on rows after the first; absent means `continue`. */
  numbering?: RowNumbering
  ports: Port[]
}

export interface PortLayout {
  numbering: NumberingPreset
  rows: Row[]
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
