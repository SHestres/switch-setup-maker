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

  it('moves a dragged switch by the pointer delta at the current zoom, without selecting', () => {
    const onMoveSwitch = vi.fn()
    const onSelectSwitch = vi.fn()
    const document_ = sampleDocument()
    document_.ui.viewport = { x: 0, y: 0, zoom: 2 }
    render(
      <Canvas document={document_} onMoveSwitch={onMoveSwitch} onSelectSwitch={onSelectSwitch} />,
    )
    const core = screen.getByRole('group', { name: 'Core' })

    fireEvent.mouseDown(core, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseMove(window, { clientX: 180, clientY: 140 })
    fireEvent.mouseUp(window, { clientX: 180, clientY: 140 })

    expect(onMoveSwitch).toHaveBeenCalledWith('sw1', { x: 160, y: 380 })

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

  it('reports its rendered size so new switches can be centred on what is visible', () => {
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

    expect(onMoveSwitch).toHaveBeenCalledWith('sw1', { x: 200, y: 400 })
    expect(onSelectSwitch).not.toHaveBeenCalled()
    expect(onClearSelection).not.toHaveBeenCalled()
  })

  it('draws the restored connections inside the canvas transform', () => {
    render(<Canvas document={sampleDocument()} />)

    const layer = screen.getByTestId('wire-layer')
    expect(layer.closest('#canvas-content')).not.toBeNull()
    expect(layer.querySelectorAll('path')).toHaveLength(1)
  })

  it('marks connected ports so their jack fill changes, both ends of the wire', () => {
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
