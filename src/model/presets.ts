import { materializeSections } from './layout'
import type { SectionSpec } from './layout'
import type { Switch } from './types'

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
  /** The ordered Section recipes; section order is faceplate order. */
  sections: readonly SectionSpec[]
  /** The full layout, shown while the chip is hovered or focused. */
  details: string
}

export const LAYOUT_PRESETS: readonly LayoutPreset[] = [
  {
    id: '24x1g-2xsfp',
    label: '24×1G + 2×SFP',
    sections: [
      {
        rows: 2,
        columns: 12,
        kind: 'rj45',
        speed: '1G',
        numbering: 'alternating-top-first',
        startMode: 'auto',
      },
      {
        rows: 1,
        columns: 2,
        kind: 'sfp',
        speed: '1G',
        numbering: 'sequential',
        startMode: 'custom',
        start: 1,
      },
    ],
    details: '2 rows of 12 RJ45 1G ports, alternating top-first (1–24); 2 SFP 1G uplinks at 1–2.',
  },
  {
    id: 'unifi-48-port',
    label: 'Unifi 48 Port',
    model: 'Unifi 48 Port',
    sections: [
      {
        rows: 2,
        columns: 8,
        kind: 'rj45',
        speed: '1G',
        numbering: 'alternating-top-first',
        startMode: 'auto',
      },
      {
        rows: 2,
        columns: 8,
        kind: 'rj45',
        speed: '1G',
        numbering: 'alternating-top-first',
        startMode: 'auto',
      },
      {
        rows: 2,
        columns: 8,
        kind: 'rj45',
        speed: '2.5G',
        numbering: 'alternating-top-first',
        startMode: 'auto',
      },
      {
        rows: 2,
        columns: 2,
        kind: 'sfp+',
        speed: '10G',
        numbering: 'sequential',
        startMode: 'auto',
      },
    ],
    details:
      'Three 2×8 RJ45 sections, 1G then 2.5G, alternating top-first (1–48); 4 SFP+ 10G uplinks at 49–52.',
  },
  {
    id: '24x1g-4xsfp-plus',
    label: '24×1G + 4×SFP+',
    sections: [
      {
        rows: 2,
        columns: 12,
        kind: 'rj45',
        speed: '1G',
        numbering: 'alternating-top-first',
        startMode: 'auto',
      },
      {
        rows: 2,
        columns: 2,
        kind: 'sfp+',
        speed: '10G',
        numbering: 'sequential',
        startMode: 'auto',
      },
    ],
    details:
      '2 rows of 12 RJ45 1G ports, alternating top-first (1–24); a 2×2 SFP+ 10G uplink block at 25–28.',
  },
  {
    id: '12x1g-2xsfp',
    label: '12×1G + 2×SFP',
    sections: [
      {
        rows: 2,
        columns: 6,
        kind: 'rj45',
        speed: '1G',
        numbering: 'alternating-top-first',
        startMode: 'custom',
        start: 0,
      },
      {
        rows: 1,
        columns: 2,
        kind: 'sfp',
        speed: '1G',
        numbering: 'sequential',
        startMode: 'custom',
        start: 0,
      },
    ],
    details:
      '2 rows of 6 RJ45 1G ports, alternating top-first zero-based (0–11); 2 SFP 1G uplinks at 0–1.',
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
    layout: { sections: materializeSections(preset.sections) },
  }
}
