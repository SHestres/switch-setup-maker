import type { LayoutEdit, RowEdit } from '@/model/layoutEdit'
import type { Switch } from '@/model/types'

import { SwitchFields } from './SwitchFields'

export interface SwitchEditorProps {
  switch_: Switch
  onChange: (changes: { name?: string; model?: string }) => void
  /** A valid layout edit; the app decides whether it needs confirming first. */
  onLayoutEdit: (edit: LayoutEdit) => void
  onDelete: () => void
}

function editableRows(switch_: Switch): RowEdit[] {
  return switch_.layout.rows.map((row, index) => ({
    source: index,
    spec: {
      count: row.ports.length,
      kind: row.ports[0].kind,
      speed: row.ports[0].speed,
      ...(index > 0 ? { numbering: row.numbering ?? 'continue' } : {}),
    },
  }))
}

/**
 * The full editor for a selected switch: identity, numbering preset, rows and delete.
 * Every change is a complete `LayoutEdit` request; the app commits it, confirming first
 * when it would sever connections. The fields themselves are shared with the draft builder.
 */
export function SwitchEditor({ switch_, onChange, onLayoutEdit, onDelete }: SwitchEditorProps) {
  const rows = editableRows(switch_)

  const commitRows = (next: RowEdit[]) => {
    if (switch_.layout.numbering === 'custom') return
    onLayoutEdit({ numbering: switch_.layout.numbering, rows: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <SwitchFields
        name={switch_.name}
        model={switch_.model}
        numbering={switch_.layout.numbering}
        rows={rows}
        onNameChange={(name) => onChange({ name })}
        onModelChange={(model) => onChange({ model })}
        onNumberingChange={(numbering) => onLayoutEdit({ numbering, rows })}
        onRowsChange={commitRows}
      />

      <button
        type="button"
        className="self-start rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onClick={onDelete}
      >
        Delete switch
      </button>
    </div>
  )
}
