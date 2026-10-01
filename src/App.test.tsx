import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

    importFile(new File(['{"version": 3}'], 'setup.json', { type: 'application/json' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Import failed')
    expect(dialog).toHaveTextContent(/version 3/)
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
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.ui.viewport).toEqual({ x: 40, y: -20, zoom: 1.5 })
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

    expect(screen.getByText('No switches yet')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').ui.viewport).toEqual({
      x: 60,
      y: 30,
      zoom: 1,
    })
  })

  it('zooms with the wheel and persists each step', () => {
    vi.useFakeTimers()
    try {
      render(<App />)

      fireEvent.wheel(canvasContent(), { deltaY: -100, clientX: 100, clientY: 100 })
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      const first = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')

      fireEvent.wheel(canvasContent(), { deltaY: -100, clientX: 100, clientY: 100 })
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      const second = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')

      expect(first.ui.viewport.zoom).toBeGreaterThan(1)
      expect(second.ui.viewport.zoom).toBeGreaterThan(first.ui.viewport.zoom)
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

function inspector(): HTMLElement {
  return screen.getByRole('complementary', { name: 'Switch inspector' })
}

function storedSwitches(): Array<Record<string, unknown>> {
  const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
  return stored.setup.switches
}

interface PresetCase {
  chip: string
  layout: {
    sections: Array<{
      kind: string
      speed: string
      rows: number
      columns: number
      numbering: string
      startMode: string
      start: number
      ports: Array<{ id: string; label: string; kind: string; speed: string }>
    }>
  }
}

function ports(first: number, labels: string[], kind: string, speed: string) {
  return labels.map((label, index) => ({ id: `p${first + index}`, label, kind, speed }))
}

const PRESET_LAYOUTS: PresetCase[] = [
  {
    chip: '24×1G + 2×SFP',
    layout: {
      sections: [
        {
          kind: 'rj45',
          speed: '1G',
          rows: 2,
          columns: 12,
          numbering: 'alternating-top-first',
          startMode: 'auto',
          start: 1,
          ports: [
            ...ports(
              1,
              ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23'],
              'rj45',
              '1G',
            ),
            ...ports(
              13,
              ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24'],
              'rj45',
              '1G',
            ),
          ],
        },
        {
          kind: 'sfp',
          speed: '1G',
          rows: 1,
          columns: 2,
          numbering: 'sequential',
          startMode: 'custom',
          start: 1,
          ports: ports(25, ['1', '2'], 'sfp', '1G'),
        },
      ],
    },
  },
  {
    chip: 'Unifi 48 Port',
    layout: {
      sections: [
        {
          kind: 'rj45',
          speed: '1G',
          rows: 2,
          columns: 8,
          numbering: 'alternating-top-first',
          startMode: 'auto',
          start: 1,
          ports: [
            ...ports(1, ['1', '3', '5', '7', '9', '11', '13', '15'], 'rj45', '1G'),
            ...ports(9, ['2', '4', '6', '8', '10', '12', '14', '16'], 'rj45', '1G'),
          ],
        },
        {
          kind: 'rj45',
          speed: '1G',
          rows: 2,
          columns: 8,
          numbering: 'alternating-top-first',
          startMode: 'auto',
          start: 17,
          ports: [
            ...ports(17, ['17', '19', '21', '23', '25', '27', '29', '31'], 'rj45', '1G'),
            ...ports(25, ['18', '20', '22', '24', '26', '28', '30', '32'], 'rj45', '1G'),
          ],
        },
        {
          kind: 'rj45',
          speed: '2.5G',
          rows: 2,
          columns: 8,
          numbering: 'alternating-top-first',
          startMode: 'auto',
          start: 33,
          ports: [
            ...ports(33, ['33', '35', '37', '39', '41', '43', '45', '47'], 'rj45', '2.5G'),
            ...ports(41, ['34', '36', '38', '40', '42', '44', '46', '48'], 'rj45', '2.5G'),
          ],
        },
        {
          kind: 'sfp+',
          speed: '10G',
          rows: 2,
          columns: 2,
          numbering: 'sequential',
          startMode: 'auto',
          start: 49,
          ports: ports(49, ['49', '50', '51', '52'], 'sfp+', '10G'),
        },
      ],
    },
  },
  {
    chip: '24×1G + 4×SFP+',
    layout: {
      sections: [
        {
          kind: 'rj45',
          speed: '1G',
          rows: 2,
          columns: 12,
          numbering: 'alternating-top-first',
          startMode: 'auto',
          start: 1,
          ports: [
            ...ports(
              1,
              ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23'],
              'rj45',
              '1G',
            ),
            ...ports(
              13,
              ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24'],
              'rj45',
              '1G',
            ),
          ],
        },
        {
          kind: 'sfp+',
          speed: '10G',
          rows: 2,
          columns: 2,
          numbering: 'sequential',
          startMode: 'auto',
          start: 25,
          ports: ports(25, ['25', '26', '27', '28'], 'sfp+', '10G'),
        },
      ],
    },
  },
  {
    chip: '12×1G + 2×SFP',
    layout: {
      sections: [
        {
          kind: 'rj45',
          speed: '1G',
          rows: 2,
          columns: 6,
          numbering: 'alternating-top-first',
          startMode: 'custom',
          start: 0,
          ports: [
            ...ports(1, ['0', '2', '4', '6', '8', '10'], 'rj45', '1G'),
            ...ports(7, ['1', '3', '5', '7', '9', '11'], 'rj45', '1G'),
          ],
        },
        {
          kind: 'sfp',
          speed: '1G',
          rows: 1,
          columns: 2,
          numbering: 'sequential',
          startMode: 'custom',
          start: 0,
          ports: ports(13, ['0', '1'], 'sfp', '1G'),
        },
      ],
    },
  },
]

describe('add switch', () => {
  it('opens the layout-preset gallery from the app bar', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))

    const panel = inspector()
    expect(within(panel).getByRole('heading', { name: 'Add a switch' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: '24×1G + 2×SFP' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Unifi 48 Port' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: '24×1G + 4×SFP+' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: '12×1G + 2×SFP' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Start blank' })).toBeEnabled()
  })

  it.each(PRESET_LAYOUTS)('creates the exact layout for $chip', ({ chip, layout }) => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: chip }))

    expect(storedSwitches()).toHaveLength(1)
    expect(storedSwitches()[0].layout).toEqual(layout)
  })

  it('lands each new switch at the visible centre with the diagonal cascade', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: '12×1G + 2×SFP' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: '24×1G + 2×SFP' }))

    expect(storedSwitches()[0]).toMatchObject({ id: 'sw1', x: 160, y: 355.5 })
    expect(storedSwitches()[1]).toMatchObject({ id: 'sw2', x: 184, y: 379.5 })
  })

  it('never lands a new switch on a survivor after a deletion', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: '12×1G + 2×SFP' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: '24×1G + 2×SFP' }))

    // Delete the first switch; the survivor keeps the second cascade slot.
    fireEvent.click(screen.getByRole('group', { name: 'sw1' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Delete switch' }))
    fireEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
    )

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: '24×1G + 2×SFP' }))

    const [survivor, added] = storedSwitches()
    expect([added.x, added.y]).not.toEqual([survivor.x, survivor.y])
    expect(screen.getByRole('group', { name: 'sw3' })).toBeInTheDocument()
  })

  it('a preset chip selects the new switch and flips the panel to its editor', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: '24×1G + 2×SFP' }))

    const panel = inspector()
    expect(within(panel).getByRole('heading', { name: 'Edit switch' })).toBeInTheDocument()
    expect(within(panel).getByLabelText('Name')).toHaveValue('')
    expect(within(panel).getByLabelText('Model')).toHaveValue('')
  })

  it('clicking a switch body selects it and opens its editor on that switch', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    const core = screen.getByRole('group', { name: 'Core' })
    fireEvent.click(core)

    expect(core).toHaveClass('selected')
    const panel = inspector()
    expect(within(panel).getByRole('heading', { name: 'Edit switch' })).toBeInTheDocument()
    expect(within(panel).getByLabelText('Name')).toHaveValue('Core')
    expect(within(panel).getByLabelText('Model')).toHaveValue('NSW-24G-4X')
  })

  it('name and model edits update the faceplate live and survive a refresh', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    const app = render(<App />)

    fireEvent.click(screen.getByRole('group', { name: 'Core' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Rack A' } })
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'USW-24' } })

    const faceplate = screen.getByRole('group', { name: 'Rack A' })
    expect(within(faceplate).getByText('USW-24')).toBeInTheDocument()

    app.unmount()
    render(<App />)

    expect(screen.getByRole('group', { name: 'Rack A' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Rack A' })).getByText('USW-24'),
    ).toBeInTheDocument()
  })

  it('places new switches at the visible centre after panning and zooming', async () => {
    render(<App />)
    const incoming = sampleDocument()
    incoming.setup = { switches: [], connections: [] }
    incoming.ui.viewport = { x: 100, y: 50, zoom: 2 }
    importFile(jsonFile(incoming))

    await waitFor(() => expect(storedViewport()).toEqual({ x: 100, y: 50, zoom: 2 }))

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: '12×1G + 2×SFP' }))

    expect(storedSwitches()[0]).toMatchObject({ x: -190, y: 130.5 })
  })

  it('only the Unifi 48 Port entry prefills the model name', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: '24×1G + 2×SFP' }))
    expect(storedSwitches()[0]).toMatchObject({ model: '' })

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Unifi 48 Port' }))

    expect(storedSwitches()[1]).toMatchObject({ model: 'Unifi 48 Port' })
    expect(screen.getByRole('group', { name: 'Unifi 48 Port' })).toBeInTheDocument()
    expect(screen.getByLabelText('Model')).toHaveValue('Unifi 48 Port')
  })

  it('shows the full preset details while a chip is hovered', async () => {
    const user = userEvent.setup()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    const chip = within(inspector()).getByRole('button', { name: 'Unifi 48 Port' })
    expect(within(inspector()).queryByText(/49–52/)).not.toBeInTheDocument()

    await user.hover(chip)

    expect(within(inspector()).getByText(/Three 2×8 RJ45 sections/)).toBeInTheDocument()
    expect(within(inspector()).getByText(/49–52/)).toBeInTheDocument()

    await user.unhover(chip)
    expect(within(inspector()).queryByText(/49–52/)).not.toBeInTheDocument()
  })
})

describe('closing the inspector', () => {
  it('closes with the ✕', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    fireEvent.click(screen.getByRole('group', { name: 'Core' }))

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Close inspector' }))

    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()
  })

  it('closes with Escape', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    fireEvent.click(screen.getByRole('group', { name: 'Core' }))

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()
  })

  it('an empty-canvas click closes the panel and deselects', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    const core = screen.getByRole('group', { name: 'Core' })
    fireEvent.click(core)
    expect(core).toHaveClass('selected')

    fireEvent.click(screen.getByTestId('canvas-stage'))

    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()
    expect(core).not.toHaveClass('selected')
  })
})

describe('port clicks', () => {
  it('never open the inspector', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' }))

    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()
  })

  it('leave an open inspector and its selection alone', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    fireEvent.click(screen.getByRole('group', { name: 'Core' }))

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))

    expect(within(inspector()).getByLabelText('Name')).toHaveValue('Core')
  })
})

describe('inspector overlay', () => {
  it('never re-fits the canvas when it opens or closes, and stays non-modal', () => {
    const restored = sampleDocument()
    restored.ui.viewport = { x: 40, y: -20, zoom: 1.5 }
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(restored))
    render(<App />)

    fireEvent.click(screen.getByRole('group', { name: 'Core' }))
    expect(storedViewport()).toEqual({ x: 40, y: -20, zoom: 1.5 })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    // The canvas behind the overlay is still live: picking another switch just retargets it.
    fireEvent.click(screen.getByRole('group', { name: 'Edge' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Edge')

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Close inspector' }))
    expect(storedViewport()).toEqual({ x: 40, y: -20, zoom: 1.5 })
  })
})

function storedViewport(): { x: number; y: number; zoom: number } {
  const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
  return stored.ui.viewport
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

describe('wires', () => {
  function wireLayer(): HTMLElement {
    return screen.getByTestId('wire-layer')
  }

  it('renders every connection from a restored setup, including same-switch links', () => {
    const restored = sampleDocument()
    restored.setup.connections.push({
      a: { switch: 'sw1', port: 'p2' },
      b: { switch: 'sw1', port: 'p49' },
    })
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(restored))

    render(<App />)

    expect(wireLayer().querySelectorAll('path[data-connection]')).toHaveLength(2)
    expect(wireLayer().querySelector('[data-connection="sw1:p1-sw2:p2"]')).toBeInTheDocument()
    expect(wireLayer().querySelector('[data-connection="sw1:p2-sw1:p49"]')).toBeInTheDocument()
  })

  it('renders wires from an imported setup', async () => {
    render(<App />)

    importFile(jsonFile(sampleDocument()))

    expect(await screen.findByText('Core')).toBeInTheDocument()
    expect(wireLayer().querySelectorAll('path[data-connection]')).toHaveLength(1)
  })

  it('gives connected ports the wired jack class, restored across a refresh', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    const app = render(<App />)

    expect(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' })).toHaveClass(
      'connected',
    )
    expect(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' })).not.toHaveClass(
      'connected',
    )
    expect(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' })).toHaveClass(
      'connected',
    )

    app.unmount()
    render(<App />)

    expect(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' })).toHaveClass(
      'connected',
    )
    expect(wireLayer().querySelectorAll('path[data-connection]')).toHaveLength(1)
  })
})

interface StoredLayout {
  sections: Array<{
    kind: string
    speed: string
    rows: number
    columns: number
    numbering: string
    startMode: string
    start: number
    ports: Array<{ id: string; label: string; kind: string; speed: string }>
  }>
}

function storedLayout(index = 0): StoredLayout {
  const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
  return stored.setup.switches[index].layout as StoredLayout
}

function storedConnections(): Array<{
  a: { switch: string; port: string }
  b: { switch: string; port: string }
}> {
  const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
  return stored.setup.connections
}

function storedCableLayer(): string {
  const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
  return stored.ui.cableLayer
}

/** The sample setup plus a second link so a structural edit can sever a count of two. */
function sampleWithTwoLinks(): SetupDocument {
  const document = sampleDocument()
  document.setup.connections.push({
    a: { switch: 'sw1', port: 'p2' },
    b: { switch: 'sw2', port: 'p1' },
  })
  return document
}

function openCoreEditor(): void {
  fireEvent.click(screen.getByRole('group', { name: 'Core' }))
}

describe('switch layout editor', () => {
  it('shows the section controls for the selected switch and autosaves a column change live', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    openCoreEditor()
    const panel = inspector()
    expect(within(panel).getByLabelText('Section 1 rows')).toHaveValue(1)
    expect(within(panel).getByLabelText('Section 1 columns')).toHaveValue(2)
    expect(within(panel).getByLabelText('Section 1 port kind')).toHaveValue('rj45')
    expect(within(panel).getByLabelText('Section 1 port speed')).toHaveValue('1G')
    expect(within(panel).getByLabelText('Section 1 numbering')).toHaveValue('alternating-top-first')
    expect(within(panel).getByLabelText('Section 1 start mode')).toHaveValue('auto')
    expect(within(panel).getByLabelText('Section 1 start number')).toHaveValue(1)
    expect(within(panel).getByLabelText('Section 1 start number')).toBeDisabled()
    expect(within(panel).getByLabelText('Section 2 port kind')).toHaveValue('sfp+')
    expect(within(panel).getByLabelText('Section 2 numbering')).toHaveValue('sequential')
    expect(within(panel).getByLabelText('Section 2 start mode')).toHaveValue('custom')
    expect(within(panel).getByLabelText('Section 2 start number')).toHaveValue(1)
    expect(within(panel).getByLabelText('Section 2 start number')).toBeEnabled()

    fireEvent.change(within(panel).getByLabelText('Section 1 columns'), { target: { value: '3' } })
    fireEvent.blur(within(panel).getByLabelText('Section 1 columns'))

    // A one-row alternating section numbers 1, 3, 5; the new column mints p50.
    expect(screen.getByRole('button', { name: 'RJ45 port 5 (1G) on Core' })).toBeInTheDocument()
    expect(storedLayout().sections[0].ports.map((port) => port.label)).toEqual(['1', '3', '5'])
    expect(storedLayout().sections[0].ports.map((port) => port.id)).toEqual(['p1', 'p2', 'p50'])
  })

  it('marks an out-of-range dimension inline and never commits it', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()
    const columns = within(panel).getByLabelText('Section 1 columns')

    fireEvent.change(columns, { target: { value: '49' } })

    expect(columns).toHaveAttribute('aria-invalid', 'true')
    expect(within(panel).getByText('Enter a whole number from 1 to 48.')).toBeInTheDocument()
    expect(storedLayout().sections[0].ports).toHaveLength(2)

    fireEvent.blur(columns)

    expect(columns).toHaveValue(2)
    expect(storedLayout().sections[0].ports).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' })).toBeInTheDocument()

    fireEvent.change(columns, { target: { value: '0' } })
    expect(columns).toHaveAttribute('aria-invalid', 'true')
    fireEvent.keyDown(columns, { key: 'Enter' })
    expect(storedLayout().sections[0].ports).toHaveLength(2)
  })

  it('changes a section’s numbering convention, relabelling it and keeping connections', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.change(within(panel).getByLabelText('Section 1 numbering'), {
      target: { value: 'sequential' },
    })

    expect(storedLayout().sections[0].numbering).toBe('sequential')
    expect(storedLayout().sections[0].ports.map((port) => port.label)).toEqual(['1', '2'])
    // A pinned custom section after it stays put.
    expect(storedLayout().sections[1].start).toBe(1)
    expect(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Core' })).toBeInTheDocument()

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.setup.connections).toHaveLength(1)
    expect(stored.setup.connections[0].a).toEqual({ switch: 'sw1', port: 'p1' })
  })

  it('supports alternating bottom first', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.change(within(panel).getByLabelText('Section 1 numbering'), {
      target: { value: 'alternating-bottom-first' },
    })

    expect(storedLayout().sections[0].ports.map((port) => port.label)).toEqual(['2', '4'])
    expect(screen.getByRole('button', { name: 'RJ45 port 4 (1G) on Core' })).toBeInTheDocument()
  })

  it('pins a custom start only when the user asks for one', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()
    const startMode = within(panel).getByLabelText('Section 1 start mode')
    const startNumber = within(panel).getByLabelText('Section 1 start number')

    fireEvent.change(startMode, { target: { value: 'custom' } })

    expect(startNumber).toBeEnabled()
    expect(startNumber).toHaveValue(1)

    fireEvent.change(startNumber, { target: { value: '0' } })
    fireEvent.blur(startNumber)

    expect(storedLayout().sections[0].startMode).toBe('custom')
    expect(storedLayout().sections[0].start).toBe(0)
    expect(storedLayout().sections[0].ports.map((port) => port.label)).toEqual(['0', '2'])
  })

  it('flips a section to Auto so it chains after the previous highest label', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.change(within(panel).getByLabelText('Section 2 start mode'), {
      target: { value: 'auto' },
    })

    expect(storedLayout().sections[1].startMode).toBe('auto')
    expect(storedLayout().sections[1].start).toBe(4)
    expect(screen.getByRole('button', { name: 'SFP+ port 4 (10G) on Core' })).toBeInTheDocument()
  })

  it('edits a section’s speed and regenerates its port labels live', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.change(within(panel).getByLabelText('Section 2 port speed'), {
      target: { value: '1G' },
    })

    expect(screen.getByRole('button', { name: 'SFP+ port 1 (1G) on Core' })).toBeInTheDocument()
    expect(storedLayout().sections[1].speed).toBe('1G')
  })

  it('appends a section with fresh ports and an auto start, without a confirm', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.click(within(panel).getByRole('button', { name: 'Add section' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    const appended = storedLayout().sections[2]
    // The pinned SFP+ section tops out at 1, so the new auto section starts at 2.
    expect(appended).toMatchObject({
      rows: 2,
      columns: 8,
      kind: 'rj45',
      speed: '1G',
      numbering: 'alternating-top-first',
      startMode: 'auto',
      start: 2,
    })
    expect(appended.ports).toHaveLength(16)
    expect(appended.ports[0]).toMatchObject({ id: 'p50', label: '2' })
    expect(appended.ports[15]).toMatchObject({ id: 'p65', label: '17' })
    expect(within(panel).getByLabelText('Section 3 columns')).toHaveValue(8)
  })

  it('moves a section left or right, keeping its ports and connections', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.click(within(panel).getByRole('button', { name: 'Move section 2 left' }))

    expect(storedLayout().sections.map((section) => section.kind)).toEqual(['sfp+', 'rj45'])
    expect(storedLayout().sections[0].ports.map((port) => port.id)).toEqual(['p49'])
    expect(storedConnections()).toHaveLength(1)

    fireEvent.click(within(panel).getByRole('button', { name: 'Move section 1 right' }))

    expect(storedLayout().sections.map((section) => section.kind)).toEqual(['rj45', 'sfp+'])
  })

  it('removes an unconnected section immediately and never lets the last section go', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.click(within(panel).getByRole('button', { name: 'Remove section 2' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(storedLayout().sections).toHaveLength(1)
    expect(
      screen.queryByRole('button', { name: 'SFP+ port 1 (10G) on Core' }),
    ).not.toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Remove section 1' })).toBeDisabled()
    expect(storedConnections()).toHaveLength(1)
  })

  it('confirms a shrink that would sever a connection, and can cancel it', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleWithTwoLinks()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()
    const columns = within(panel).getByLabelText('Section 1 columns')

    fireEvent.change(columns, { target: { value: '1' } })
    fireEvent.blur(columns)

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Change layout?')
    expect(dialog).toHaveTextContent('Applying this change to Core severs 1 connection.')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(columns).toHaveValue(2)
    expect(storedLayout().sections[0].ports).toHaveLength(2)
    expect(storedConnections()).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' })).toBeInTheDocument()
  })

  it('severs the connections and autosaves once the shrink is confirmed', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleWithTwoLinks()))
    render(<App />)
    openCoreEditor()
    const columns = within(screen.getByRole('complementary')).getByLabelText('Section 1 columns')

    fireEvent.change(columns, { target: { value: '1' } })
    fireEvent.blur(columns)
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))

    expect(storedLayout().sections[0].ports.map((port) => port.id)).toEqual(['p1'])
    expect(storedConnections()).toEqual([
      { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p2' } },
    ])
    expect(
      screen.queryByRole('button', { name: 'RJ45 port 3 (1G) on Core' }),
    ).not.toBeInTheDocument()
    expect(columns).toHaveValue(1)
  })

  it('confirms a section removal naming the switch and the connections to sever', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleWithTwoLinks()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.click(within(panel).getByRole('button', { name: 'Remove section 1' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Change layout?')
    expect(dialog).toHaveTextContent('Applying this change to Core severs 2 connections.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(storedLayout().sections).toHaveLength(2)
    expect(storedConnections()).toHaveLength(2)

    fireEvent.click(within(panel).getByRole('button', { name: 'Remove section 1' }))
    fireEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Apply' }),
    )

    expect(storedLayout().sections).toHaveLength(1)
    expect(storedLayout().sections[0].ports[0].id).toBe('p49')
    expect(storedConnections()).toEqual([])
  })

  it('deletes a switch only after a confirm naming it and its connections', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleWithTwoLinks()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.click(within(panel).getByRole('button', { name: 'Delete switch' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Delete switch?')
    expect(dialog).toHaveTextContent('Deleting Core severs 2 connections.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('group', { name: 'Core' })).toBeInTheDocument()
    expect(within(panel).getByLabelText('Name')).toHaveValue('Core')
    expect(storedConnections()).toHaveLength(2)

    fireEvent.click(within(panel).getByRole('button', { name: 'Delete switch' }))
    fireEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
    )

    expect(screen.queryByRole('group', { name: 'Core' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Edge' })).toBeInTheDocument()
    expect(storedConnections()).toEqual([])
    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()
  })

  it('still confirms deleting a switch with no connections', async () => {
    const document = sampleDocument()
    document.setup.connections = []
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(document))
    render(<App />)
    fireEvent.click(screen.getByRole('group', { name: 'Edge' }))

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Delete switch' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Deleting Edge severs no connections.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(screen.queryByRole('group', { name: 'Edge' })).not.toBeInTheDocument()
    expect(storedLayout()).toBeDefined()
  })
})
function wireLayerElement(): HTMLElement {
  return screen.getByTestId('wire-layer')
}

function pendingPath(): SVGPathElement | null {
  return document.querySelector<SVGPathElement>('[data-pending]')
}

describe('wiring', () => {
  beforeEach(() => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
  })

  it('starts a pending wire on the first port click and lands it on the second', () => {
    const app = render(<App />)
    const stored = window.localStorage.getItem(STORAGE_KEY)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))

    expect(pendingPath()).toHaveAttribute('data-pending', 'sw1:p2')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(stored)
    expect(wireLayerElement().querySelectorAll('path[data-connection]')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Edge' }))

    expect(pendingPath()).not.toBeInTheDocument()
    expect(
      wireLayerElement().querySelector('[data-connection="sw1:p2-sw2:p1"]'),
    ).toBeInTheDocument()
    expect(storedConnections()).toContainEqual({
      a: { switch: 'sw1', port: 'p2' },
      b: { switch: 'sw2', port: 'p1' },
    })

    app.unmount()
    render(<App />)

    expect(
      wireLayerElement().querySelector('[data-connection="sw1:p2-sw2:p1"]'),
    ).toBeInTheDocument()
  })

  it('allows wiring two ports on the same switch', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))
    fireEvent.click(screen.getByRole('button', { name: 'SFP+ port 1 (10G) on Core' }))

    expect(
      wireLayerElement().querySelector('[data-connection="sw1:p2-sw1:p49"]'),
    ).toBeInTheDocument()
    expect(storedConnections()).toContainEqual({
      a: { switch: 'sw1', port: 'p2' },
      b: { switch: 'sw1', port: 'p49' },
    })
  })

  it('refuses a busy port and shows the connection rules’ hint near it', () => {
    render(<App />)
    const stored = window.localStorage.getItem(STORAGE_KEY)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))
    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' }))

    const hint = screen.getByRole('status')
    expect(hint).toHaveTextContent('Port 2 is already connected.')
    expect(hint).toHaveAttribute('data-hint-port', 'sw2:p2')

    expect(
      wireLayerElement().querySelector('[data-connection="sw1:p2-sw2:p2"]'),
    ).not.toBeInTheDocument()
    expect(storedConnections()).toHaveLength(1)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(stored)
    // The wire stays for another target: only the refused end was the problem.
    expect(pendingPath()).toHaveAttribute('data-pending', 'sw1:p2')
  })

  it('cancels a pending wire with Escape and leaves no effect', () => {
    render(<App />)
    const stored = window.localStorage.getItem(STORAGE_KEY)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))
    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' }))
    expect(pendingPath()).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(pendingPath()).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(stored)
    expect(wireLayerElement().querySelectorAll('path[data-connection]')).toHaveLength(1)

    // The next port click starts a fresh wire rather than landing the cancelled one.
    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Edge' }))
    expect(pendingPath()).toHaveAttribute('data-pending', 'sw2:p1')
  })

  it('cancels a pending wire on an empty-canvas click and leaves no effect', () => {
    render(<App />)
    const stored = window.localStorage.getItem(STORAGE_KEY)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))
    fireEvent.click(screen.getByTestId('canvas-stage'))

    expect(pendingPath()).not.toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(stored)
    expect(wireLayerElement().querySelectorAll('path[data-connection]')).toHaveLength(1)
  })

  it('fades a refusal hint on its own', () => {
    vi.useFakeTimers()
    try {
      render(<App />)

      fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))
      fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' }))
      expect(screen.getByRole('status')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(pendingPath()).toHaveAttribute('data-pending', 'sw1:p2')
    } finally {
      vi.useRealTimers()
    }
  })

  it('refuses wiring a port to itself with the self-link copy', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))
    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))

    expect(screen.getByRole('status')).toHaveTextContent('A port cannot connect to itself.')
    expect(screen.getByRole('status')).toHaveAttribute('data-hint-port', 'sw1:p2')
    expect(storedConnections()).toHaveLength(1)
  })

  it('refuses a duplicate pair with the duplicate copy', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' }))
    fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' }))

    expect(screen.getByRole('status')).toHaveTextContent('Those ports are already connected.')
    expect(screen.getByRole('status')).toHaveAttribute('data-hint-port', 'sw2:p2')
    expect(storedConnections()).toHaveLength(1)
  })

  it('draws the pending wire from the source port to the pointer', () => {
    render(<App />)
    const port = screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' })

    fireEvent.mouseDown(port, { clientX: 40, clientY: 60, button: 0 })
    fireEvent.click(port)

    const fromClick = pendingPath()?.getAttribute('d')
    expect(fromClick).toBeTruthy()

    fireEvent.mouseMove(canvasRoot(), { clientX: 260, clientY: 180 })

    const afterMove = pendingPath()?.getAttribute('d')
    expect(afterMove).not.toBe(fromClick)
  })

  it('redraws the cables and the delete affordance live while dragging, writing the model only on gesture end', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    const cable = (): SVGPathElement | null =>
      wireLayerElement().querySelector<SVGPathElement>('[data-connection="sw1:p1-sw2:p2"]')

    const hit = wireLayerElement().querySelector('[data-wire-hit="sw1:p1-sw2:p2"]')
    if (!hit) throw new Error('cable hit target is not rendered')
    fireEvent.click(hit)
    const affordance = screen.getByRole('button', { name: 'Delete cable' })
    const cableBefore = cable()?.getAttribute('d')
    const affordanceBefore = { left: affordance.style.left, top: affordance.style.top }
    const stored = window.localStorage.getItem(STORAGE_KEY)

    fireEvent.mouseDown(screen.getByRole('group', { name: 'Core' }), {
      clientX: 200,
      clientY: 200,
      button: 0,
    })
    fireEvent.mouseMove(document, { clientX: 260, clientY: 230 })

    expect(cable()?.getAttribute('d')).not.toBe(cableBefore)
    expect({ left: affordance.style.left, top: affordance.style.top }).not.toEqual(affordanceBefore)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(stored)

    fireEvent.mouseUp(document, { clientX: 260, clientY: 230 })

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBe(stored)
  })
})

describe('draft switch', () => {
  function startBlank(): void {
    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Start blank' }))
  }

  function ghost(): HTMLElement {
    return screen.getByRole('group', { name: 'Draft switch' })
  }

  it('previews a ghost draft on the canvas that never reaches the document or storage', () => {
    render(<App />)

    startBlank()

    const preview = ghost()
    expect(preview).toBeInTheDocument()
    // Untouched means zero ports and no controls to wire, drag or select.
    expect(within(preview).queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryByText('No switches yet')).not.toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)
  })

  it('live-previews the sections being built while keeping the draft out of the document and storage', () => {
    render(<App />)
    startBlank()
    const add = within(inspector()).getByRole('button', { name: 'Add switch' })

    expect(add).toBeDisabled()
    expect(storedSwitches()).toHaveLength(0)

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add section' }))

    const preview = ghost()
    expect(within(preview).getByText('15')).toBeInTheDocument()
    expect(within(preview).queryByText('17')).not.toBeInTheDocument()
    // The previewed ports stay decorative: nothing to click, wire or focus.
    expect(within(preview).queryAllByRole('button')).toHaveLength(0)
    expect(add).toBeEnabled()
    expect(storedSwitches()).toHaveLength(0)

    const columns = within(inspector()).getByLabelText('Section 1 columns')
    fireEvent.change(columns, { target: { value: '4' } })
    fireEvent.blur(columns)

    expect(within(preview).getByText('7')).toBeInTheDocument()
    expect(within(preview).queryByText('9')).not.toBeInTheDocument()

    fireEvent.change(within(inspector()).getByLabelText('Name'), { target: { value: 'Rack A' } })
    fireEvent.change(within(inspector()).getByLabelText('Model'), {
      target: { value: 'USW-24' },
    })

    expect(within(preview).getByText('Rack A')).toBeInTheDocument()
    expect(within(preview).getByText('USW-24')).toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)
    expect(window.localStorage.getItem(STORAGE_KEY) ?? '').not.toContain('Rack A')
    expect(window.localStorage.getItem(STORAGE_KEY) ?? '').not.toContain('USW-24')
  })

  it('commits the previewed draft through the placement rule and selects the new switch', () => {
    render(<App />)
    startBlank()

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add section' }))
    fireEvent.change(within(inspector()).getByLabelText('Name'), { target: { value: 'Rack A' } })
    fireEvent.change(within(inspector()).getByLabelText('Model'), {
      target: { value: 'USW-24' },
    })
    fireEvent.change(within(inspector()).getByLabelText('Section 1 numbering'), {
      target: { value: 'sequential' },
    })
    const rows = within(inspector()).getByLabelText('Section 1 rows')
    fireEvent.change(rows, { target: { value: '1' } })
    fireEvent.blur(rows)
    const columns = within(inspector()).getByLabelText('Section 1 columns')
    fireEvent.change(columns, { target: { value: '4' } })
    fireEvent.blur(columns)

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add switch' }))

    expect(screen.queryByRole('group', { name: 'Draft switch' })).not.toBeInTheDocument()
    expect(within(inspector()).getByRole('heading', { name: 'Edit switch' })).toBeInTheDocument()

    expect(storedSwitches()).toHaveLength(1)
    expect(storedSwitches()[0]).toMatchObject({
      id: 'sw1',
      name: 'Rack A',
      model: 'USW-24',
      x: 160,
      y: 355.5,
    })
    expect(storedLayout()).toEqual({
      sections: [
        {
          kind: 'rj45',
          speed: '1G',
          rows: 1,
          columns: 4,
          numbering: 'sequential',
          startMode: 'auto',
          start: 1,
          ports: [
            { id: 'p1', label: '1', kind: 'rj45', speed: '1G' },
            { id: 'p2', label: '2', kind: 'rj45', speed: '1G' },
            { id: 'p3', label: '3', kind: 'rj45', speed: '1G' },
            { id: 'p4', label: '4', kind: 'rj45', speed: '1G' },
          ],
        },
      ],
    })
    expect(screen.getByRole('group', { name: 'Rack A' })).toHaveClass('selected')
  })

  it('discards an untouched draft silently when the panel is closed', () => {
    render(<App />)
    startBlank()

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Close inspector' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Draft switch' })).not.toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)
    expect(screen.getByText('No switches yet')).toBeInTheDocument()
  })

  it('discards an untouched draft silently on Escape', () => {
    render(<App />)
    startBlank()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Draft switch' })).not.toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)
  })

  it('discards an untouched draft silently on an empty-canvas click', () => {
    render(<App />)
    startBlank()

    fireEvent.click(screen.getByTestId('canvas-stage'))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Draft switch' })).not.toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)
  })

  it('asks before discarding an edited draft and keeps it on cancel', async () => {
    render(<App />)
    startBlank()
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add section' }))
    fireEvent.change(within(inspector()).getByLabelText('Name'), { target: { value: 'Rack A' } })

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Close inspector' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Discard this switch?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(within(inspector()).getByRole('heading', { name: 'New switch' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Draft switch' })).toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Close inspector' }))
    const again = await screen.findByRole('alertdialog')
    fireEvent.click(within(again).getByRole('button', { name: 'Discard' }))

    expect(screen.queryByRole('group', { name: 'Draft switch' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)
  })

  it('asks before replacing an edited draft with the gallery', async () => {
    render(<App />)
    startBlank()
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add section' }))

    fireEvent.click(screen.getByRole('button', { name: '+ Add switch' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Discard this switch?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard' }))

    expect(within(inspector()).getByRole('heading', { name: 'Add a switch' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Draft switch' })).not.toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)
  })

  it('counts a typed name as an edit even before any row exists', async () => {
    render(<App />)
    startBlank()

    fireEvent.change(within(inspector()).getByLabelText('Name'), { target: { value: 'Rack A' } })
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Close inspector' }))

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Discard this switch?')
  })

  it('cancels the discard confirm with Escape and keeps the draft', async () => {
    render(<App />)
    startBlank()
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add section' }))
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Close inspector' }))
    const dialog = await screen.findByRole('alertdialog')

    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Draft switch' })).toBeInTheDocument()
    expect(within(inspector()).getByRole('heading', { name: 'New switch' })).toBeInTheDocument()
    expect(storedSwitches()).toHaveLength(0)
  })

  it('discards an untouched draft silently when another switch is selected instead', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    startBlank()

    fireEvent.click(screen.getByRole('group', { name: 'Core' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Draft switch' })).not.toBeInTheDocument()
    expect(within(inspector()).getByLabelText('Name')).toHaveValue('Core')
    expect(storedSwitches()).toHaveLength(2)
  })

  it('confirms before an edited draft gives way to the switch that was clicked', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    startBlank()
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add section' }))
    fireEvent.change(within(inspector()).getByLabelText('Name'), { target: { value: 'Rack A' } })

    fireEvent.click(screen.getByRole('group', { name: 'Core' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Discard this switch?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard' }))

    expect(screen.queryByRole('group', { name: 'Draft switch' })).not.toBeInTheDocument()
    expect(within(inspector()).getByLabelText('Name')).toHaveValue('Core')
    expect(storedSwitches()).toHaveLength(2)
    expect(storedSwitches().some((switch_) => switch_.name === 'Rack A')).toBe(false)
  })
})

describe('managing cables', () => {
  function cableHit(key = 'sw1:p1-sw2:p2'): SVGPathElement {
    const hit = wireLayerElement().querySelector<SVGPathElement>(`[data-wire-hit="${key}"]`)
    if (!hit) throw new Error(`cable ${key} is not rendered`)
    return hit
  }

  function cableCurve(key = 'sw1:p1-sw2:p2'): SVGPathElement | null {
    return wireLayerElement().querySelector<SVGPathElement>(`[data-connection="${key}"]`)
  }

  it('selects a cable by click, deletes it with the affordance, frees both ports and survives a refresh', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    const app = render(<App />)

    fireEvent.click(cableHit())

    expect(cableCurve()).toHaveClass('selected')
    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()
    const before = window.localStorage.getItem(STORAGE_KEY)

    fireEvent.click(screen.getByRole('button', { name: 'Delete cable' }))

    expect(cableCurve()).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete cable' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' })).not.toHaveClass(
      'connected',
    )
    expect(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' })).not.toHaveClass(
      'connected',
    )
    expect(storedConnections()).toHaveLength(0)
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBe(before)

    app.unmount()
    render(<App />)

    expect(screen.getByRole('button', { name: 'RJ45 port 1 (1G) on Core' })).not.toHaveClass(
      'connected',
    )
    expect(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Edge' })).not.toHaveClass(
      'connected',
    )
    expect(wireLayerElement().querySelectorAll('path[data-connection]')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Delete cable' })).not.toBeInTheDocument()
  })

  it('deletes the selected cable with the Delete key and deselects it with Escape', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    fireEvent.click(cableHit())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(cableCurve()).not.toHaveClass('selected')
    expect(screen.queryByRole('button', { name: 'Delete cable' })).not.toBeInTheDocument()

    fireEvent.click(cableHit())
    fireEvent.keyDown(window, { key: 'Delete' })

    expect(cableCurve()).not.toBeInTheDocument()
    expect(storedConnections()).toHaveLength(0)
  })

  it('never deletes a selected cable while the user is typing in the inspector', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    fireEvent.click(screen.getByRole('group', { name: 'Core' }))
    fireEvent.click(cableHit())

    fireEvent.keyDown(within(inspector()).getByLabelText('Name'), { key: 'Backspace' })
    fireEvent.keyDown(within(inspector()).getByLabelText('Model'), { key: 'Delete' })

    expect(cableCurve()).toBeInTheDocument()
    expect(cableCurve()).toHaveClass('selected')
    expect(storedConnections()).toHaveLength(1)
  })

  it('keeps cable and switch selection isolated', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    fireEvent.click(cableHit())
    expect(cableCurve()).toHaveClass('selected')
    expect(
      screen.queryByRole('complementary', { name: 'Switch inspector' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('group', { name: 'Core' }))
    expect(within(inspector()).getByLabelText('Name')).toHaveValue('Core')
    expect(cableCurve()).not.toHaveClass('selected')
    expect(screen.queryByRole('button', { name: 'Delete cable' })).not.toBeInTheDocument()

    fireEvent.click(cableHit())
    expect(cableCurve()).toHaveClass('selected')
    expect(within(inspector()).getByLabelText('Name')).toHaveValue('Core')

    fireEvent.click(screen.getByTestId('canvas-stage'))
    expect(cableCurve()).not.toHaveClass('selected')
  })

  describe('cable layer', () => {
    function stagePositions(): { layer: number; core: number } {
      const children = [...screen.getByTestId('canvas-stage').children]
      return {
        layer: children.indexOf(wireLayerElement()),
        core: children.indexOf(screen.getByRole('group', { name: 'Core' })),
      }
    }

    it('orders cables behind or above the switches and keeps the choice across a refresh', () => {
      window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
      const app = render(<App />)

      expect(screen.getByRole('button', { name: 'Cables behind' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      // Behind the switches: the layer paints before the faceplates.
      expect(stagePositions().layer).toBeLessThan(stagePositions().core)

      fireEvent.click(screen.getByRole('button', { name: 'Cables above' }))

      expect(screen.getByRole('button', { name: 'Cables above' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(stagePositions().layer).toBeGreaterThan(stagePositions().core)
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
      expect(stored.ui.cableLayer).toBe('above')

      app.unmount()
      render(<App />)

      expect(screen.getByRole('button', { name: 'Cables above' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(stagePositions().layer).toBeGreaterThan(stagePositions().core)
    })

    it('keeps the wire being drawn above the switches even with cables behind', () => {
      window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
      render(<App />)

      fireEvent.click(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' }))

      const children = [...screen.getByTestId('canvas-stage').children]
      expect(children.indexOf(screen.getByTestId('pending-wire-layer'))).toBeGreaterThan(
        children.indexOf(screen.getByRole('group', { name: 'Core' })),
      )
    })

    it('always draws cables above in blueprint while the stored preference stays intact', () => {
      window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
      render(<App />)
      expect(stagePositions().layer).toBeLessThan(stagePositions().core)

      fireEvent.click(screen.getByRole('button', { name: 'Blueprint' }))

      expect(canvasRoot()).toHaveAttribute('data-theme', 'blueprint')
      expect(stagePositions().layer).toBeGreaterThan(stagePositions().core)
      expect(screen.getByRole('button', { name: 'Cables behind' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(storedCableLayer()).toBe('behind')

      // Toggling the stored preference never moves the blueprint drawing.
      fireEvent.click(screen.getByRole('button', { name: 'Cables above' }))
      expect(stagePositions().layer).toBeGreaterThan(stagePositions().core)
      fireEvent.click(screen.getByRole('button', { name: 'Cables behind' }))
      expect(stagePositions().layer).toBeGreaterThan(stagePositions().core)
      expect(storedCableLayer()).toBe('behind')

      // Leaving blueprint applies the stored preference again.
      fireEvent.click(screen.getByRole('button', { name: 'Light' }))
      expect(stagePositions().layer).toBeLessThan(stagePositions().core)
    })
  })
})
