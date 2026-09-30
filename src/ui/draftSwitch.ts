import { materialiseRows } from '@/model/layout'
import type { RowEdit } from '@/model/layoutEdit'
import type { GeneratedNumberingPreset, Switch } from '@/model/types'

/** The convention a hand-built switch starts with: the presets' most common one. */
export const DEFAULT_DRAFT_NUMBERING: GeneratedNumberingPreset = 'odd-top-even-bottom'

/**
 * A switch being built by hand. Ephemeral App-level UI state: the draft is
 * previewed on the canvas but never enters the document or storage until
 * `Add switch` materialises it.
 */
export interface DraftSwitch {
  name: string
  model: string
  numbering: GeneratedNumberingPreset
  rows: RowEdit[]
  /** Top-left corner in canvas units, fixed where the committed switch will land. */
  x: number
  y: number
}

export function createDraftSwitch(position: { x: number; y: number }): DraftSwitch {
  return {
    name: '',
    model: '',
    numbering: DEFAULT_DRAFT_NUMBERING,
    rows: [],
    x: position.x,
    y: position.y,
  }
}

/** The rows that will materialise: zero-port rows are dropped, never previewed or committed. */
export function draftRows(draft: DraftSwitch): RowEdit[] {
  return draft.rows.filter((row) => row.spec.count > 0)
}

export function draftCanCommit(draft: DraftSwitch): boolean {
  return draftRows(draft).length > 0
}

/** The switch the draft previews; `id` is the committed id, or empty for the ghost. */
export function draftToSwitch(draft: DraftSwitch, id = ''): Switch {
  return {
    id,
    name: draft.name,
    model: draft.model,
    x: draft.x,
    y: draft.y,
    layout: {
      numbering: draft.numbering,
      rows: materialiseRows(
        draft.numbering,
        draftRows(draft).map((row) => row.spec),
      ),
    },
  }
}

/** A typed name/model, a row or a new convention is worth confirming before discard. */
export function draftIsEdited(draft: DraftSwitch): boolean {
  return (
    draft.name.trim() !== '' ||
    draft.model.trim() !== '' ||
    draft.rows.length > 0 ||
    draft.numbering !== DEFAULT_DRAFT_NUMBERING
  )
}
