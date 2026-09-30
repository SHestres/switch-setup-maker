import { parseDocumentText, serializeDocument } from './serialize'
import type { SetupDocument } from './types'

export const STORAGE_KEY = 'switch-setup-maker.document'

/** The autosaved document, or `null` when nothing valid has been saved. */
export function loadDocument(storage: Storage = window.localStorage): SetupDocument | null {
  let saved: string | null
  try {
    saved = storage.getItem(STORAGE_KEY)
  } catch (error) {
    console.warn('The saved setup could not be read.', error)
    return null
  }
  if (saved === null) return null

  const result = parseDocumentText(saved)
  if (!result.ok) {
    console.warn(`Ignoring the saved setup: ${result.error}`)
    return null
  }
  return result.document
}

export function saveDocument(
  document: SetupDocument,
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(STORAGE_KEY, serializeDocument(document))
  } catch (error) {
    console.warn('The setup could not be saved to browser storage.', error)
  }
}
