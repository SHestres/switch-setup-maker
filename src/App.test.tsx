import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { serializeDocument } from '@/model/serialize'
import { STORAGE_KEY } from '@/model/storage'
import type { SetupDocument } from '@/model/types'
import { restoreObjectUrls, stubObjectUrls } from '@/test/objectUrls'
import { sampleDocument } from '@/test/fixtures'

import App from './App'

function jsonFile(document: SetupDocument, name = 'setup.json'): File {
  return new File([serializeDocument(document)], name, { type: 'application/json' })
}

function renameFirstSwitch(document: SetupDocument, name: string): SetupDocument {
  document.setup.switches[0].name = name
  return document
}

function importFile(file: File): void {
  fireEvent.change(screen.getByLabelText('Import setup'), { target: { files: [file] } })
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('restore on load', () => {
  it('shows the autosaved setup after a browser refresh', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))

    render(<App />)

    expect(screen.getByText('Core')).toBeInTheDocument()
    expect(screen.getByText('Edge')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' })).toBeInTheDocument()
  })

  it('shows the empty state on a first run', () => {
    render(<App />)

    expect(screen.getByText('No switches yet')).toBeInTheDocument()
  })
})

describe('import', () => {
  it('applies a valid file straight away when the setup is empty', async () => {
    render(<App />)

    importFile(jsonFile(sampleDocument()))

    expect(await screen.findByText('Core')).toBeInTheDocument()
  })

  it('names the first problem in an error dialog for an invalid file', async () => {
    render(<App />)

    importFile(new File(['{"version": 2}'], 'setup.json', { type: 'application/json' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Import failed')
    expect(dialog).toHaveTextContent(/version 2/)
  })

  it('asks before replacing a non-empty setup and keeps it on cancel', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    importFile(jsonFile(renameFirstSwitch(sampleDocument(), 'Rack A')))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Replace the current setup?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Rack A')).not.toBeInTheDocument()
    expect(screen.getByText('Core')).toBeInTheDocument()
  })

  it('replaces the setup after confirming', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    importFile(jsonFile(renameFirstSwitch(sampleDocument(), 'Rack A')))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Replace' }))

    expect(await screen.findByText('Rack A')).toBeInTheDocument()
    expect(screen.queryByText('Core')).not.toBeInTheDocument()
  })
})

describe('export', () => {
  it('downloads the current setup as dated JSON', () => {
    const { created, downloads } = stubObjectUrls()
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Export' }))

    expect(downloads[0]).toMatch(/^switch-setup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(created).toHaveLength(1)

    restoreObjectUrls()
    vi.restoreAllMocks()
  })
})

describe('new setup', () => {
  it('clears the setup after confirming and writes the empty document back to storage', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'New setup' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard' }))

    expect(await screen.findByText('No switches yet')).toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"switches": []')
  })

  it('keeps the setup when cancelled', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'New setup' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Core')).toBeInTheDocument()
  })
})

describe('canvas', () => {
  it('renders restored faceplates with rows, labels, kinds and speeds', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))

    render(<App />)

    const core = screen.getByRole('group', { name: 'Core' })
    expect(within(core).getByText('NSW-24G-4X')).toBeInTheDocument()
    expect(
      within(core).getByRole('button', { name: 'RJ45 port 1 (1G) on Core' }),
    ).toBeInTheDocument()
    expect(
      within(core).getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }),
    ).toBeInTheDocument()
    expect(
      within(core).getByRole('button', { name: 'SFP+ port 1 (10G) on Core' }),
    ).toBeInTheDocument()
    expect(within(core).getByText('3')).toBeInTheDocument()

    const edge = screen.getByRole('group', { name: 'Edge' })
    expect(
      within(edge).getByRole('button', { name: 'RJ45 port 1 (1G) on Edge' }),
    ).toBeInTheDocument()
    expect(
      within(edge).getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' }),
    ).toBeInTheDocument()
    expect(within(edge).getByText('2')).toBeInTheDocument()
  })

  it('shows the first-run card with the final copy until the first switch exists', () => {
    render(<App />)

    expect(screen.getByText('No switches yet')).toBeInTheDocument()
    expect(
      screen.getByText('Add a switch, then click any two ports to wire them.'),
    ).toBeInTheDocument()
  })

  it('applies the viewport from an imported setup', async () => {
    render(<App />)
    const incoming = sampleDocument()
    incoming.ui.viewport = { x: 40, y: -20, zoom: 1.5 }

    importFile(jsonFile(incoming))

    expect(await screen.findByText('Core')).toBeInTheDocument()
    expect(canvasContent().style.transform).toBe('translate(40px, -20px) scale(1.5)')
  })

  it('drags a switch by the pointer and keeps the new position across a refresh', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    const app = render(<App />)
    const core = screen.getByRole('group', { name: 'Core' })

    fireEvent.mouseDown(core, { clientX: 200, clientY: 200, button: 0 })
    fireEvent.mouseMove(document, { clientX: 260, clientY: 230 })
    fireEvent.mouseUp(document, { clientX: 260, clientY: 230 })

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.setup.switches[0]).toMatchObject({ x: 180, y: 390 })

    app.unmount()
    render(<App />)
    expect(screen.getByRole('group', { name: 'Core' })).toHaveStyle({
      left: '180px',
      top: '390px',
    })
  })

  it('does not move a switch on a click', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    const core = screen.getByRole('group', { name: 'Core' })

    fireEvent.mouseDown(core, { clientX: 200, clientY: 200, button: 0 })
    fireEvent.mouseUp(document, { clientX: 200, clientY: 200 })
    fireEvent.click(core)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.setup.switches[0]).toMatchObject({ x: 120, y: 360 })
  })

  it('pans the canvas and keeps the viewport across a refresh', () => {
    const app = render(<App />)

    fireEvent.mouseDown(canvasContent(), { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseMove(document, { clientX: 160, clientY: 130, buttons: 1 })
    fireEvent.mouseUp(document, { clientX: 160, clientY: 130 })

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.ui.viewport).toEqual({ x: 60, y: 30, zoom: 1 })

    app.unmount()
    render(<App />)
    expect(canvasContent().style.transform).toBe('translate(60px, 30px) scale(1)')
  })

  it('persists zoom after a wheel gesture', () => {
    vi.useFakeTimers()
    try {
      render(<App />)

      fireEvent.wheel(canvasContent(), { deltaY: -120, clientX: 100, clientY: 100 })
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
      expect(stored.ui.viewport.zoom).toBeGreaterThan(1)
    } finally {
      vi.useRealTimers()
    }
  })
})

function canvasContent(): HTMLElement {
  const content = document.querySelector<HTMLElement>('#canvas-content')
  if (!content) throw new Error('canvas content is not rendered')
  return content
}

function canvasRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>('.canvas-root')
  if (!root) throw new Error('canvas root is not rendered')
  return root
}

describe('themes', () => {
  it('switches the canvas theme immediately from the app bar', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))

    expect(canvasRoot()).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the chosen theme across a refresh', () => {
    const app = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Blueprint' }))

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.ui.theme).toBe('blueprint')

    app.unmount()
    render(<App />)

    expect(canvasRoot()).toHaveAttribute('data-theme', 'blueprint')
    expect(screen.getByRole('button', { name: 'Blueprint' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('restores the stored theme on load', () => {
    const stored = sampleDocument()
    stored.ui.theme = 'dark'
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(stored))

    render(<App />)

    expect(canvasRoot()).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'false')
  })
})
