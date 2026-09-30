import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { exportDocumentFile, importDocumentFile } from '@/model/files'
import type { SetupDocument } from '@/model/types'

import { secondaryButton } from './buttonStyles'
import { Dialog } from './Dialog'

interface AppBarProps {
  document: SetupDocument
  onReplace: (document: SetupDocument) => void
  onNewSetup: () => void
}

/**
 * The persistence half of ticket 06's app bar: Import, Export and New setup.
 * The builder and canvas tickets add their own controls alongside these.
 */
export function AppBar({ document, onReplace, onNewSetup }: AppBarProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<SetupDocument | null>(null)
  const [confirmingNewSetup, setConfirmingNewSetup] = useState(false)

  const hasContent = document.setup.switches.length > 0 || document.setup.connections.length > 0

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const result = await importDocumentFile(file)
    if (!result.ok) {
      setImportError(result.error)
      return
    }

    if (hasContent) setPendingImport(result.document)
    else onReplace(result.document)
  }

  function exportSetup() {
    try {
      exportDocumentFile(document)
    } catch {
      setExportError('The setup could not be exported.')
    }
  }

  return (
    <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
      <h1 className="mr-auto text-sm font-semibold tracking-tight">Switch Setup Maker</h1>

      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        aria-label="Import setup"
        className="hidden"
        onChange={(event) => {
          void chooseFile(event)
        }}
      />
      <button type="button" className={secondaryButton} onClick={() => fileInput.current?.click()}>
        Import
      </button>
      <button type="button" className={secondaryButton} onClick={exportSetup}>
        Export
      </button>
      <button type="button" className={secondaryButton} onClick={() => setConfirmingNewSetup(true)}>
        New setup
      </button>

      <Dialog
        open={importError !== null}
        onOpenChange={(open) => {
          if (!open) setImportError(null)
        }}
        title="Import failed"
        description={importError ?? ''}
        actions={[{ label: 'OK', variant: 'primary' }]}
      />

      <Dialog
        open={exportError !== null}
        onOpenChange={(open) => {
          if (!open) setExportError(null)
        }}
        title="Export failed"
        description={exportError ?? ''}
        actions={[{ label: 'OK', variant: 'primary' }]}
      />

      <Dialog
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null)
        }}
        title="Replace the current setup?"
        description="Importing applies the file's switches, connections and view settings. The current setup will be discarded."
        actions={[
          { label: 'Cancel' },
          {
            label: 'Replace',
            variant: 'primary',
            onClick: () => {
              if (pendingImport) onReplace(pendingImport)
            },
          },
        ]}
      />

      <Dialog
        open={confirmingNewSetup}
        onOpenChange={setConfirmingNewSetup}
        title="Discard the current setup?"
        description="This clears the switches, connections and viewport. Theme and cable preferences are kept."
        actions={[
          { label: 'Cancel' },
          { label: 'Discard', variant: 'primary', onClick: onNewSetup },
        ]}
      />
    </header>
  )
}
