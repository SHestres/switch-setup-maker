import { describe, expect, it } from 'vitest'

import { switchLabel } from './document'
import type { Switch } from './types'

function makeSwitch(changes: Partial<Switch> = {}): Switch {
  return {
    id: 'sw1',
    name: '',
    model: '',
    x: 0,
    y: 0,
    layout: { sections: [] },
    ...changes,
  }
}

describe('switchLabel', () => {
  it('prefers the name, then the model, then the id', () => {
    expect(switchLabel(makeSwitch({ name: 'Core', model: 'NSW-24G' }))).toBe('Core')
    expect(switchLabel(makeSwitch({ model: 'NSW-24G' }))).toBe('NSW-24G')
    expect(switchLabel(makeSwitch())).toBe('sw1')
  })
})
