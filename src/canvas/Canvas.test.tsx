import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { sampleDocument } from '@/test/fixtures'

import { Canvas } from './Canvas'

describe('Canvas', () => {
  it('reserves port clicks for wiring: a port never selects or opens anything', () => {
    const onPortClick = vi.fn()
    const onSelectSwitch = vi.fn()
    const onClearSelection = vi.fn()
    render(
      <Canvas
        document={sampleDocument()}
        onPortClick={onPortClick}
        onSelectSwitch={onSelectSwitch}
        onClearSelection={onClearSelection}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' }))

    expect(onPortClick).toHaveBeenCalledWith({ switch: 'sw1', port: 'p1' })
    expect(onSelectSwitch).not.toHaveBeenCalled()
    expect(onClearSelection).not.toHaveBeenCalled()
  })

  it('selects a switch from its body and clears on an empty-canvas click', () => {
    const onSelectSwitch = vi.fn()
    const onClearSelection = vi.fn()
    render(
      <Canvas
        document={sampleDocument()}
        onSelectSwitch={onSelectSwitch}
        onClearSelection={onClearSelection}
      />,
    )

    fireEvent.click(screen.getByRole('group', { name: 'Edge' }))
    expect(onSelectSwitch).toHaveBeenCalledWith('sw2')

    fireEvent.click(screen.getByTestId('canvas-stage'))
    expect(onClearSelection).toHaveBeenCalledTimes(1)
  })

  it('moves a dragged switch without selecting it', () => {
    const onMoveSwitch = vi.fn()
    const onSelectSwitch = vi.fn()
    const document_ = sampleDocument()
    render(
      <Canvas document={document_} onMoveSwitch={onMoveSwitch} onSelectSwitch={onSelectSwitch} />,
    )
    const core = screen.getByRole('group', { name: 'Core' })

    fireEvent.mouseDown(core, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseMove(window, { clientX: 180, clientY: 140 })
    fireEvent.mouseUp(window, { clientX: 180, clientY: 140 })

    expect(onMoveSwitch).toHaveBeenCalledTimes(1)
    const [id, position] = onMoveSwitch.mock.calls[0]
    expect(id).toBe('sw1')
    expect(position).not.toEqual({ x: 120, y: 360 })

    fireEvent.click(core)
    expect(onSelectSwitch).not.toHaveBeenCalled()
  })

  it('leaves port mousedowns to wiring: dragging from a port does not move the switch', () => {
    const onMoveSwitch = vi.fn()
    render(<Canvas document={sampleDocument()} onMoveSwitch={onMoveSwitch} />)
    const port = screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' })

    fireEvent.mouseDown(port, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseMove(window, { clientX: 180, clientY: 140 })
    fireEvent.mouseUp(window, { clientX: 180, clientY: 140 })

    expect(onMoveSwitch).not.toHaveBeenCalled()
  })

  it('reports its rendered size so new switches can be centered on what is visible', () => {
    const onCanvasSizeChange = vi.fn()
    const rect = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 0, 1000, 700))
    try {
      render(<Canvas document={sampleDocument()} onCanvasSizeChange={onCanvasSizeChange} />)

      expect(onCanvasSizeChange).toHaveBeenCalledWith({ width: 1000, height: 700 })
    } finally {
      rect.mockRestore()
    }
  })

  it('does not select or clear when a drag ends over empty canvas', () => {
    const onMoveSwitch = vi.fn()
    const onSelectSwitch = vi.fn()
    const onClearSelection = vi.fn()
    render(
      <Canvas
        document={sampleDocument()}
        onMoveSwitch={onMoveSwitch}
        onSelectSwitch={onSelectSwitch}
        onClearSelection={onClearSelection}
      />,
    )
    const core = screen.getByRole('group', { name: 'Core' })

    fireEvent.mouseDown(core, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseMove(window, { clientX: 180, clientY: 140 })
    fireEvent.mouseUp(window, { clientX: 180, clientY: 140 })
    fireEvent.click(screen.getByTestId('canvas-stage'))

    expect(onMoveSwitch).toHaveBeenCalledTimes(1)
    expect(onMoveSwitch.mock.calls[0][0]).toBe('sw1')
    expect(onSelectSwitch).not.toHaveBeenCalled()
    expect(onClearSelection).not.toHaveBeenCalled()
  })

  it('draws the restored connections in the wire layer', () => {
    render(<Canvas document={sampleDocument()} />)

    expect(screen.getByTestId('wire-layer').querySelectorAll('path[data-connection]')).toHaveLength(
      1,
    )
  })

  it('marks connected ports so their connector fill changes, both ends of the wire', () => {
    render(<Canvas document={sampleDocument()} />)

    expect(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' })).toHaveClass(
      'connected',
    )
    expect(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' })).not.toHaveClass(
      'connected',
    )
    expect(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' })).toHaveClass(
      'connected',
    )
  })
})
