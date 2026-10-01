import { describe, expect, it } from 'vitest'

import { portKey } from './portRef'

describe('portKey', () => {
  it('joins the switch and port ids with a colon', () => {
    expect(portKey({ switch: 'sw1', port: 'p2' })).toBe('sw1:p2')
  })
})
