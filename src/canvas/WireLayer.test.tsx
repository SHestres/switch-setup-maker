import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { removeSwitch } from '@/model/connections'
import { sampleDocument } from '@/test/fixtures'

import { WireLayer } from './WireLayer'

describe('WireLayer', () => {
  it('draws one curve for the connection, labelled by its port refs', () => {
    render(<WireLayer setup={sampleDocument().setup} />)

    const layer = screen.getByTestId('wire-layer')
    const path = layer.querySelector('[data-connection="sw1:p1-sw2:p2"]')
    expect(layer.querySelectorAll('path')).toHaveLength(1)
    expect(path).toBeInTheDocument()
  })

  it('draws same-switch links alongside cross-switch ones', () => {
    const setup = sampleDocument().setup
    setup.connections.push({
      a: { switch: 'sw1', port: 'p1' },
      b: { switch: 'sw1', port: 'p2' },
    })

    render(<WireLayer setup={setup} />)

    const layer = screen.getByTestId('wire-layer')
    expect(layer.querySelectorAll('path')).toHaveLength(2)
    expect(layer.querySelector('[data-connection="sw1:p1-sw1:p2"]')).toBeInTheDocument()
  })

  it('draws nothing after the switch at one end is removed (no dangling wires)', () => {
    const setup = removeSwitch(sampleDocument().setup, 'sw2')

    render(<WireLayer setup={setup} />)

    expect(screen.getByTestId('wire-layer').querySelectorAll('path')).toHaveLength(0)
  })
})
