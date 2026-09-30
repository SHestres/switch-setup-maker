import { describe, expect, it } from 'vitest'

import type { Port, Row } from '@/model/types'

import { bankLabel, portAriaLabel, splitBanks } from './faceplateLayout'

function row(kind: Port['kind'], labels: string[]): Row {
  return {
    ports: labels.map((label, index) => ({ id: `p${index + 1}`, label, kind, speed: '1G' })),
  }
}

describe('splitBanks', () => {
  it('moves trailing non-RJ45 rows into a right-hand uplink bank', () => {
    const banks = splitBanks([
      row('rj45', ['1', '3']),
      row('rj45', ['2', '4']),
      row('sfp+', ['49', '50']),
    ])
    expect(banks.main).toHaveLength(2)
    expect(banks.right).toHaveLength(1)
    expect(banks.left).toHaveLength(0)
  })

  it('moves leading non-RJ45 rows into a left-hand bank', () => {
    const banks = splitBanks([row('sfp+', ['1', '2']), row('rj45', ['1', '2'])])
    expect(banks.left).toHaveLength(1)
    expect(banks.main).toHaveLength(1)
    expect(banks.right).toHaveLength(0)
  })

  it('keeps non-RJ45 rows between mains on the main field', () => {
    const banks = splitBanks([row('rj45', ['1']), row('sfp', ['9']), row('rj45', ['2'])])
    expect(banks.main).toHaveLength(3)
    expect(banks.left).toHaveLength(0)
    expect(banks.right).toHaveLength(0)
  })

  it('keeps an all-uplink layout on the main field', () => {
    const banks = splitBanks([row('sfp', ['1']), row('sfp+', ['2'])])
    expect(banks.main).toHaveLength(2)
    expect(banks.left).toHaveLength(0)
    expect(banks.right).toHaveLength(0)
  })
})

describe('bankLabel', () => {
  it('labels the range from the flattened labels across rows', () => {
    expect(bankLabel([row('sfp+', ['25', '27']), row('sfp+', ['26', '28'])])).toBe('SFP+ 25–28')
    expect(bankLabel([row('sfp', ['1'])])).toBe('SFP 1')
  })
})

describe('portAriaLabel', () => {
  it('names kind, printed label, speed and switch', () => {
    expect(portAriaLabel({ id: 'p1', label: '24', kind: 'rj45', speed: '2.5G' }, 'Core')).toBe(
      'RJ45 port 24 (2.5G) on Core',
    )
  })
})
