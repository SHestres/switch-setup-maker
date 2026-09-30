import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { createEmptyDocument } from './document'
import { loadDocument, saveDocument } from './storage'
import type { SetupDocument } from './types'

export interface DocumentState {
  document: SetupDocument
  setDocument: Dispatch<SetStateAction<SetupDocument>>
}

/** The document in React: restored once on load, written back to browser storage on every change. */
export function useDocument(storage: Storage = window.localStorage): DocumentState {
  const [document, setDocument] = useState<SetupDocument>(
    () => loadDocument(storage) ?? createEmptyDocument(),
  )

  useEffect(() => {
    saveDocument(document, storage)
  }, [document, storage])

  return { document, setDocument }
}
