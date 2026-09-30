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
    numbering: string
    rows: Array<{
      numbering?: string
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
      numbering: 'odd-top-even-bottom',
      rows: [
        {
          ports: ports(
            1,
            ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23'],
            'rj45',
            '1G',
          ),
        },
        {
          ports: ports(
            13,
            ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24'],
            'rj45',
            '1G',
          ),
        },
        { numbering: 'start-over', ports: ports(25, ['1', '2'], 'sfp', '1G') },
      ],
    },
  },
  {
    chip: 'Unifi 48 Port',
    layout: {
      numbering: 'odd-top-even-bottom',
      rows: [
        {
          ports: ports(
            1,
            [
              '1',
              '3',
              '5',
              '7',
              '9',
              '11',
              '13',
              '15',
              '17',
              '19',
              '21',
              '23',
              '25',
              '27',
              '29',
              '31',
              '33',
              '35',
              '37',
              '39',
              '41',
              '43',
              '45',
              '47',
            ],
            'rj45',
            '1G',
          ),
        },
        {
          ports: ports(
            25,
            [
              '2',
              '4',
              '6',
              '8',
              '10',
              '12',
              '14',
              '16',
              '18',
              '20',
              '22',
              '24',
              '26',
              '28',
              '30',
              '32',
              '34',
              '36',
              '38',
              '40',
              '42',
              '44',
              '46',
              '48',
            ],
            'rj45',
            '1G',
          ),
        },
        { numbering: 'continue', ports: ports(49, ['49', '50', '51', '52'], 'sfp+', '10G') },
      ],
    },
  },
  {
    chip: '24×1G + 4×SFP+',
    layout: {
      numbering: 'odd-top-even-bottom',
      rows: [
        {
          ports: ports(
            1,
            ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23'],
            'rj45',
            '1G',
          ),
        },
        {
          ports: ports(
            13,
            ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24'],
            'rj45',
            '1G',
          ),
        },
        { numbering: 'continue', ports: ports(25, ['25', '27'], 'sfp+', '10G') },
        { numbering: 'continue', ports: ports(27, ['26', '28'], 'sfp+', '10G') },
      ],
    },
  },
  {
    chip: '12×1G + 2×SFP',
    layout: {
      numbering: 'even-top-zero-based',
      rows: [
        { ports: ports(1, ['0', '2', '4', '6', '8', '10'], 'rj45', '1G') },
        { ports: ports(7, ['1', '3', '5', '7', '9', '11'], 'rj45', '1G') },
        { numbering: 'start-over', ports: ports(13, ['0', '1'], 'sfp', '1G') },
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
    await waitFor(() =>
      expect(canvasContent().style.transform).toBe('translate(100px, 50px) scale(2)'),
    )

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

    expect(within(inspector()).getByText(/2 rows of 24 RJ45 1G ports/)).toBeInTheDocument()
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
    expect(canvasContent().style.transform).toBe('translate(40px, -20px) scale(1.5)')

    fireEvent.click(screen.getByRole('group', { name: 'Core' }))
    expect(canvasContent().style.transform).toBe('translate(40px, -20px) scale(1.5)')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    // The canvas behind the overlay is still live: picking another switch just retargets it.
    fireEvent.click(screen.getByRole('group', { name: 'Edge' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Edge')

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Close inspector' }))
    expect(canvasContent().style.transform).toBe('translate(40px, -20px) scale(1.5)')
  })
})

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

interface StoredLayout {
  numbering: string
  rows: Array<{
    numbering?: string
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
  it('shows the row controls for the selected switch and autosaves a count change live', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)

    openCoreEditor()
    const panel = inspector()
    expect(within(panel).getByLabelText('Port numbering')).toHaveValue('odd-top-even-bottom')
    expect(within(panel).getByLabelText('Row 1 port count')).toHaveValue(2)
    expect(within(panel).getByLabelText('Row 1 port kind')).toHaveValue('rj45')
    expect(within(panel).getByLabelText('Row 1 port speed')).toHaveValue('1G')
    expect(within(panel).queryByLabelText('Row 1 numbering')).not.toBeInTheDocument()
    expect(within(panel).getByLabelText('Row 2 port count')).toHaveValue(1)
    expect(within(panel).getByLabelText('Row 2 port kind')).toHaveValue('sfp+')
    expect(within(panel).getByLabelText('Row 2 numbering')).toHaveValue('start-over')

    fireEvent.change(within(panel).getByLabelText('Row 1 port count'), { target: { value: '3' } })
    fireEvent.blur(within(panel).getByLabelText('Row 1 port count'))

    // A lone top row numbers sequentially; the start-over SFP row stays 1. The new port mints p50.
    expect(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Core' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SFP+ port 1 (10G) on Core' })).toBeInTheDocument()
    expect(storedLayout().rows[0].ports.map((port) => port.label)).toEqual(['1', '2', '3'])
    expect(storedLayout().rows[0].ports.map((port) => port.id)).toEqual(['p1', 'p2', 'p50'])
  })

  it('marks an out-of-range count inline and never commits it', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()
    const count = within(panel).getByLabelText('Row 1 port count')

    fireEvent.change(count, { target: { value: '49' } })

    expect(count).toHaveAttribute('aria-invalid', 'true')
    expect(within(panel).getByText('Enter a whole number from 1 to 48.')).toBeInTheDocument()
    expect(storedLayout().rows[0].ports).toHaveLength(2)

    fireEvent.blur(count)

    expect(count).toHaveValue(2)
    expect(storedLayout().rows[0].ports).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' })).toBeInTheDocument()

    fireEvent.change(count, { target: { value: '0' } })
    expect(count).toHaveAttribute('aria-invalid', 'true')
    fireEvent.keyDown(count, { key: 'Enter' })
    expect(storedLayout().rows[0].ports).toHaveLength(2)
  })

  it('moves a row’s numbering default with its kind, and keeps an explicit override', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()
    const kind = within(panel).getByLabelText('Row 2 port kind')
    const numbering = within(panel).getByLabelText('Row 2 numbering')

    fireEvent.change(kind, { target: { value: 'rj45' } })

    expect(numbering).toHaveValue('continue')
    expect(storedLayout().rows[1].ports[0]).toMatchObject({ kind: 'rj45' })
    expect(storedLayout().rows[1].ports[0].label).toBe('2')

    fireEvent.change(kind, { target: { value: 'sfp+' } })

    expect(numbering).toHaveValue('start-over')

    fireEvent.change(numbering, { target: { value: 'continue' } })
    fireEvent.change(kind, { target: { value: 'sfp' } })

    expect(numbering).toHaveValue('continue')
    expect(storedLayout().rows[1].numbering).toBe('continue')
  })

  it('edits a row’s speed and regenerates its port labels live', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.change(within(panel).getByLabelText('Row 2 port speed'), { target: { value: '1G' } })

    expect(screen.getByRole('button', { name: 'SFP+ port 1 (1G) on Core' })).toBeInTheDocument()
    expect(storedLayout().rows[1].ports[0].speed).toBe('1G')
  })

  it('changes the whole numbering preset, relabelling every row and keeping connections', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.change(within(panel).getByLabelText('Port numbering'), {
      target: { value: 'sequential' },
    })

    expect(storedLayout().numbering).toBe('sequential')
    expect(storedLayout().rows.map((row) => row.ports.map((port) => port.label))).toEqual([
      ['1', '2'],
      ['1'],
    ])
    expect(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Core' })).toBeInTheDocument()

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.setup.connections).toHaveLength(1)
    expect(stored.setup.connections[0].a).toEqual({ switch: 'sw1', port: 'p1' })
  })

  it('appends a row with fresh ports, default numbering and autosave, without a confirm', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.click(within(panel).getByRole('button', { name: 'Add row' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    const appended = storedLayout().rows[2]
    expect(appended.numbering).toBe('continue')
    expect(appended.ports).toHaveLength(12)
    expect(appended.ports[0]).toMatchObject({ id: 'p50', kind: 'rj45', speed: '1G' })
    expect(appended.ports[11]).toMatchObject({ id: 'p61', label: '13' })
    expect(within(panel).getByLabelText('Row 3 port count')).toHaveValue(12)
  })

  it('removes an unconnected row immediately and never lets the last row go', () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleDocument()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.click(within(panel).getByRole('button', { name: 'Remove row 2' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(storedLayout().rows).toHaveLength(1)
    expect(
      screen.queryByRole('button', { name: 'SFP+ port 1 (10G) on Core' }),
    ).not.toBeInTheDocument()
    // A lone row numbers sequentially again: 1 and 2.
    expect(screen.getByRole('button', { name: 'RJ45 port 2 (1G) on Core' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Remove row 1' })).toBeDisabled()
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').setup.connections,
    ).toHaveLength(1)
  })

  it('confirms a count that would sever a connection, and can cancel it', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleWithTwoLinks()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()
    const count = within(panel).getByLabelText('Row 1 port count')

    fireEvent.change(count, { target: { value: '1' } })
    fireEvent.blur(count)

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Change layout?')
    expect(dialog).toHaveTextContent('Applying this change to Core severs 1 connection.')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(count).toHaveValue(2)
    expect(storedLayout().rows[0].ports).toHaveLength(2)
    expect(storedConnections()).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'RJ45 port 3 (1G) on Core' })).toBeInTheDocument()
  })

  it('severs the connections and autosaves once the count change is confirmed', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleWithTwoLinks()))
    render(<App />)
    openCoreEditor()
    const count = within(screen.getByRole('complementary')).getByLabelText('Row 1 port count')

    fireEvent.change(count, { target: { value: '1' } })
    fireEvent.blur(count)
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))

    expect(storedLayout().rows[0].ports.map((port) => port.id)).toEqual(['p1'])
    expect(storedConnections()).toEqual([
      { a: { switch: 'sw1', port: 'p1' }, b: { switch: 'sw2', port: 'p2' } },
    ])
    expect(
      screen.queryByRole('button', { name: 'RJ45 port 3 (1G) on Core' }),
    ).not.toBeInTheDocument()
    expect(count).toHaveValue(1)
  })

  it('confirms a row removal naming the switch and the connections to sever', async () => {
    window.localStorage.setItem(STORAGE_KEY, serializeDocument(sampleWithTwoLinks()))
    render(<App />)
    openCoreEditor()
    const panel = inspector()

    fireEvent.click(within(panel).getByRole('button', { name: 'Remove row 1' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Change layout?')
    expect(dialog).toHaveTextContent('Applying this change to Core severs 2 connections.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(storedLayout().rows).toHaveLength(2)
    expect(storedConnections()).toHaveLength(2)

    fireEvent.click(within(panel).getByRole('button', { name: 'Remove row 1' }))
    fireEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Apply' }),
    )

    expect(storedLayout().rows).toHaveLength(1)
    expect(storedLayout().rows[0].ports[0].id).toBe('p49')
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

  it('live-previews the rows being built while keeping the draft out of the document and storage', () => {
    render(<App />)
    startBlank()
    const add = within(inspector()).getByRole('button', { name: 'Add switch' })

    expect(add).toBeDisabled()
    expect(storedSwitches()).toHaveLength(0)

    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add row' }))

    const preview = ghost()
    expect(within(preview).getByText('12')).toBeInTheDocument()
    expect(within(preview).queryByText('13')).not.toBeInTheDocument()
    // The previewed ports stay decorative: nothing to click, wire or focus.
    expect(within(preview).queryAllByRole('button')).toHaveLength(0)
    expect(add).toBeEnabled()
    expect(storedSwitches()).toHaveLength(0)

    const count = within(inspector()).getByLabelText('Row 1 port count')
    fireEvent.change(count, { target: { value: '4' } })
    fireEvent.blur(count)

    expect(within(preview).getByText('4')).toBeInTheDocument()
    expect(within(preview).queryByText('5')).not.toBeInTheDocument()

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

    fireEvent.change(within(inspector()).getByLabelText('Name'), { target: { value: 'Rack A' } })
    fireEvent.change(within(inspector()).getByLabelText('Model'), { target: { value: 'USW-24' } })
    fireEvent.change(within(inspector()).getByLabelText('Port numbering'), {
      target: { value: 'sequential' },
    })
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add row' }))
    const count = within(inspector()).getByLabelText('Row 1 port count')
    fireEvent.change(count, { target: { value: '4' } })
    fireEvent.blur(count)

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
      numbering: 'sequential',
      rows: [
        {
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
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add row' }))
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
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add row' }))

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
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add row' }))
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
    fireEvent.click(within(inspector()).getByRole('button', { name: 'Add row' }))
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
