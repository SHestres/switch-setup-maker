import type { LayoutEdit, SectionEdit } from '@/model/layoutEdit'
import type { Switch } from '@/model/types'

import { SwitchFields } from './SwitchFields'
import type { SectionEditOptions } from './SwitchFields'

export interface SwitchEditorProps {
  switch_: Switch
  onChange: (changes: { name?: string; model?: string }) => void
  /**
   * A valid layout edit; the app decides whether it needs confirming first. `live` marks a
   * change typed in a number field: the app applies it only when it severs nothing.
   */
  onLayoutEdit: (edit: LayoutEdit, options?: SectionEditOptions) => void
  onDelete: () => void
}

function editableSections(switch_: Switch): SectionEdit[] {
  return switch_.layout.sections.map((section, index) => ({
    source: index,
    spec: {
      rows: section.rows,
      columns: section.columns,
      kind: section.kind,
      speed: section.speed,
      numbering: section.numbering,
      startMode: section.startMode,
      start: section.start,
    },
  }))
}

/**
 * The full editor for a selected switch: identity, sections and delete.
 * Every layout change is a complete `LayoutEdit` request; the app commits it, confirming
 * first when it would sever connections. The fields themselves are shared with the draft
 * builder.
 */
export function SwitchEditor({ switch_, onChange, onLayoutEdit, onDelete }: SwitchEditorProps) {
  return (
    <SwitchFields
      name={switch_.name}
      model={switch_.model}
      sections={editableSections(switch_)}
      onNameChange={(name) => onChange({ name })}
      onModelChange={(model) => onChange({ model })}
      onSectionsChange={(sections, options) => onLayoutEdit({ sections }, options)}
      action={
        <button
          type="button"
          className="self-start rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={onDelete}
        >
          Delete switch
        </button>
      }
    />
  )
}
