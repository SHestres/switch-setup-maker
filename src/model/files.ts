import { parseDocumentText, serializeDocument } from './serialize'
import type { DocumentParseResult } from './serialize'
import type { SetupDocument } from './types'

/**
 * Browser file I/O for the Import and Export entry points (ticket 06).
 * Kept thin: validation, dialogs and confirms belong to the caller.
 */

/** Trigger a pretty-printed JSON download named `switch-setup-YYYY-MM-DD.json`. */
export function exportDocumentFile(setupDocument: SetupDocument): void {
  const blob = new Blob([serializeDocument(setupDocument)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = `switch-setup-${new Date().toISOString().slice(0, 10)}.json`
  window.document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Read and validate a chosen file; failures come back as messages for the error dialog. */
export async function importDocumentFile(file: File): Promise<DocumentParseResult> {
  try {
    return parseDocumentText(await file.text())
  } catch {
    return { ok: false, error: 'The file could not be read.' }
  }
}
