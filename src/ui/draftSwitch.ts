import { materializeSections } from '@/model/layout'
import type { SectionEdit } from '@/model/layoutEdit'
import type { Switch } from '@/model/types'

/**
 * A switch being built by hand. Ephemeral App-level UI state: the draft is
 * previewed on the canvas but never enters the document or storage until
 * `Add switch` materializes it.
 */
export interface DraftSwitch {
  name: string
  model: string
  sections: SectionEdit[]
  /** Top-left corner in canvas units, fixed where the committed switch will land. */
  x: number
  y: number
}

export function createDraftSwitch(position: { x: number; y: number }): DraftSwitch {
  return {
    name: '',
    model: '',
    sections: [],
    x: position.x,
    y: position.y,
  }
}

export function draftCanCommit(draft: DraftSwitch): boolean {
  return draft.sections.length > 0
}

/** The switch the draft previews; `id` is the committed id, or empty for the ghost. */
export function draftToSwitch(draft: DraftSwitch, id = ''): Switch {
  return {
    id,
    name: draft.name,
    model: draft.model,
    x: draft.x,
    y: draft.y,
    layout: { sections: materializeSections(draft.sections.map((section) => section.spec)) },
  }
}

/** A typed name/model or a section is worth confirming before discard. */
export function draftIsEdited(draft: DraftSwitch): boolean {
  return draft.name.trim() !== '' || draft.model.trim() !== '' || draft.sections.length > 0
}
