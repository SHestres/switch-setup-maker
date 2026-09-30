import type {
  CableLayer,
  Port,
  PortRef,
  Setup,
  SetupDocument,
  Switch,
  Theme,
  UiState,
  Viewport,
} from './types'
import { DOCUMENT_VERSION } from './types'

export const DEFAULT_THEME: Theme = 'light'
export const DEFAULT_CABLE_LAYER: CableLayer = 'behind'
export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

export function createDefaultUi(): UiState {
  return {
    theme: DEFAULT_THEME,
    cableLayer: DEFAULT_CABLE_LAYER,
    viewport: { ...DEFAULT_VIEWPORT },
  }
}

export function createEmptyDocument(): SetupDocument {
  return {
    version: DOCUMENT_VERSION,
    setup: { switches: [], connections: [] },
    ui: createDefaultUi(),
  }
}

export function findSwitch(setup: Setup, switchId: string): Switch | undefined {
  return setup.switches.find((switch_) => switch_.id === switchId)
}

export function findPort(setup: Setup, ref: PortRef): Port | undefined {
  return findSwitch(setup, ref.switch)
    ?.layout.rows.flatMap((row) => row.ports)
    .find((port) => port.id === ref.port)
}

/** One past the highest `sw<n>` suffix in use. */
export function nextSwitchId(switches: Iterable<Switch>): string {
  let highest = 0
  for (const switch_ of switches) {
    const match = /^sw(\d+)$/.exec(switch_.id)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return `sw${highest + 1}`
}

/** New setup: clear switches, connections and the viewport; keep theme and cable-layer preferences. */
export function resetSetup(document: SetupDocument): SetupDocument {
  return {
    version: DOCUMENT_VERSION,
    setup: { switches: [], connections: [] },
    ui: { ...document.ui, viewport: { ...DEFAULT_VIEWPORT } },
  }
}

/** Move one switch to a new top-left corner; other switches and the ui stay put. */
export function moveSwitch(
  document: SetupDocument,
  switchId: string,
  position: { x: number; y: number },
): SetupDocument {
  return {
    ...document,
    setup: {
      ...document.setup,
      switches: document.setup.switches.map((switch_) =>
        switch_.id === switchId ? { ...switch_, ...position } : switch_,
      ),
    },
  }
}

/** Replace the persisted viewport without touching the rest of the ui state. */
export function setViewport(document: SetupDocument, viewport: Viewport): SetupDocument {
  return { ...document, ui: { ...document.ui, viewport } }
}

/** Switch the persisted theme without touching the rest of the ui state. */
export function setTheme(document: SetupDocument, theme: Theme): SetupDocument {
  return { ...document, ui: { ...document.ui, theme } }
}
