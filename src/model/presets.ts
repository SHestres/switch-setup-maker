import { materialiseRows } from './layout'
import type { RowSpec } from './layout'
import type { GeneratedNumberingPreset, Switch } from './types'

/**
 * The layout-preset gallery is data, ready for a real device library later
 * (spec: "Layout presets"). Exactly one entry carries a model name.
 */
export interface LayoutPreset {
  id: string
  /** The chip label. */
  label: string
  /** Prefilled model name; only the hardware entry with a named model sets it. */
  model?: string
  numbering: GeneratedNumberingPreset
  rows: readonly RowSpec[]
  /** The full layout, shown while the chip is hovered or focused. */
  details: string
}

export const LAYOUT_PRESETS: readonly LayoutPreset[] = [
  {
    id: '24x1g-2xsfp',
    label: '24×1G + 2×SFP',
    numbering: 'odd-top-even-bottom',
    rows: [
      { count: 12, kind: 'rj45', speed: '1G' },
      { count: 12, kind: 'rj45', speed: '1G' },
      { count: 2, kind: 'sfp', speed: '1G', numbering: 'start-over' },
    ],
    details:
      '2 rows of 12 RJ45 1G ports, odd top/even bottom (1–24); 2 SFP 1G uplinks restarting at 1–2.',
  },
  {
    id: 'unifi-48-port',
    label: 'Unifi 48 Port',
    model: 'Unifi 48 Port',
    numbering: 'odd-top-even-bottom',
    rows: [
      { count: 24, kind: 'rj45', speed: '1G' },
      { count: 24, kind: 'rj45', speed: '1G' },
      { count: 4, kind: 'sfp+', speed: '10G', numbering: 'continue' },
    ],
    details:
      '2 rows of 24 RJ45 1G ports, odd top/even bottom (1–48); 4 SFP+ 10G uplinks continuing at 49–52.',
  },
  {
    id: '24x1g-4xsfp-plus',
    label: '24×1G + 4×SFP+',
    numbering: 'odd-top-even-bottom',
    rows: [
      { count: 12, kind: 'rj45', speed: '1G' },
      { count: 12, kind: 'rj45', speed: '1G' },
      { count: 2, kind: 'sfp+', speed: '10G', numbering: 'continue' },
      { count: 2, kind: 'sfp+', speed: '10G', numbering: 'continue' },
    ],
    details:
      '2 rows of 12 RJ45 1G ports, odd top/even bottom (1–24); a 2×2 SFP+ 10G uplink block continuing at 25–28.',
  },
  {
    id: '12x1g-2xsfp',
    label: '12×1G + 2×SFP',
    numbering: 'even-top-zero-based',
    rows: [
      { count: 6, kind: 'rj45', speed: '1G' },
      { count: 6, kind: 'rj45', speed: '1G' },
      { count: 2, kind: 'sfp', speed: '1G', numbering: 'start-over' },
    ],
    details:
      '2 rows of 6 RJ45 1G ports, even top/zero-based (0–11); 2 SFP 1G uplinks restarting at 0–1.',
  },
]

/** Build the switch a hardware preset describes; placing it on the canvas is the caller's job. */
export function switchFromPreset(
  preset: LayoutPreset,
  id: string,
  position: { x: number; y: number },
): Switch {
  return {
    id,
    name: '',
    model: preset.model ?? '',
    x: position.x,
    y: position.y,
    layout: {
      numbering: preset.numbering,
      rows: materialiseRows(preset.numbering, preset.rows),
    },
  }
}
