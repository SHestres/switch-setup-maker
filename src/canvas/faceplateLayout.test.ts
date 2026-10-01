import { describe, expect, it } from 'vitest'

import { portAriaLabel } from './faceplateLayout'

describe('portAriaLabel', () => {
  it('names kind, printed label, speed and switch', () => {
    expect(portAriaLabel({ id: 'p1', label: '24', kind: 'rj45', speed: '2.5G' }, 'Core')).toBe(
      'RJ45 port 24 (2.5G) on Core',
    )
  })
})
