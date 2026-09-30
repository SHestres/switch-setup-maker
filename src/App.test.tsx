import { fireEvent, render, screen, within } from '@testing-library/react'
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
    expect(screen.getByText(/2 switches/)).toBeInTheDocument()
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
