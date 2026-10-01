import { describe, expect, it } from 'vitest'

import { LAYOUT_PRESETS, switchFromPreset } from './presets'
import type { Switch } from './types'

function preset(id: string): (typeof LAYOUT_PRESETS)[number] {
  const found = LAYOUT_PRESETS.find((entry) => entry.id === id)
  if (!found) throw new Error(`preset ${id} is missing`)
  return found
}

function build(id: string): Switch {
  return switchFromPreset(preset(id), 'sw1', { x: 0, y: 0 })
}

function labels(switch_: Switch, index: number): string[] {
  return switch_.layout.sections[index].ports.map((port) => port.label)
}

// The section recipes and label ranges below come from the spec's layout-preset table.
describe('layout presets', () => {
  it('keeps exactly one named hardware entry', () => {
    expect(LAYOUT_PRESETS.filter((entry) => entry.model !== undefined)).toHaveLength(1)
    expect(preset('unifi-48-port').model).toBe('Unifi 48 Port')
  })

  it('builds 24×1G + 2×SFP as two sections with the SFP pair pinned to 1–2', () => {
    const switch_ = build('24x1g-2xsfp')

    expect(switch_.layout.sections.map((section) => section.start)).toEqual([1, 1])
    expect(switch_.layout.sections.map((section) => section.ports.length)).toEqual([24, 2])
    expect(labels(switch_, 0).slice(0, 4)).toEqual(['1', '3', '5', '7'])
    expect(labels(switch_, 0).slice(-4)).toEqual(['18', '20', '22', '24'])
    expect(labels(switch_, 1)).toEqual(['1', '2'])
  })

  it('builds the Unifi 48 Port as three RJ45 sections plus SFP 49–52', () => {
    const switch_ = build('unifi-48-port')

    expect(switch_.model).toBe('Unifi 48 Port')
    expect(switch_.layout.sections.map((section) => section.start)).toEqual([1, 17, 33, 49])
    expect(switch_.layout.sections.map((section) => section.ports.length)).toEqual([16, 16, 16, 4])
    expect(labels(switch_, 0)).toEqual([
      '1',
      '3',
      '5',
      '7',
      '9',
      '11',
      '13',
      '15',
      '2',
      '4',
      '6',
      '8',
      '10',
      '12',
      '14',
      '16',
    ])
    expect(switch_.layout.sections[2].speed).toBe('2.5G')
    expect(labels(switch_, 3)).toEqual(['49', '50', '51', '52'])
  })

  it('builds 24×1G + 4×SFP with the uplink block continuing at 25–28', () => {
    const switch_ = build('24x1g-4xsfp')

    expect(switch_.layout.sections.map((section) => section.start)).toEqual([1, 25])
    expect(switch_.layout.sections.map((section) => section.ports.length)).toEqual([24, 4])
    expect(labels(switch_, 1)).toEqual(['25', '26', '27', '28'])
  })

  it('builds 12×1G + 2×SFP zero-based, both sections pinned to 0', () => {
    const switch_ = build('12x1g-2xsfp')

    expect(switch_.layout.sections.map((section) => section.startMode)).toEqual([
      'custom',
      'custom',
    ])
    expect(switch_.layout.sections.map((section) => section.start)).toEqual([0, 0])
    expect(labels(switch_, 0).slice(0, 6)).toEqual(['0', '2', '4', '6', '8', '10'])
    expect(labels(switch_, 1)).toEqual(['0', '1'])
  })

  it('continues each Auto section after the previous section’s highest label', () => {
    const switch_ = build('unifi-48-port')
    for (const [index, section] of switch_.layout.sections.entries()) {
      if (section.startMode !== 'auto') continue
      const previousHighest = index === 0 ? 0 : Math.max(...labels(switch_, index - 1).map(Number))
      expect(section.start, `${section.kind} section ${index}`).toBe(previousHighest + 1)
    }
  })
})
