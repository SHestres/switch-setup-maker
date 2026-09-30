import { primaryButton } from './buttonStyles'
import type { DraftSwitch } from './draftSwitch'
import { draftCanCommit } from './draftSwitch'
import { SwitchFields } from './SwitchFields'

export interface DraftSwitchBuilderProps {
  draft: DraftSwitch
  onChange: (draft: DraftSwitch) => void
  onAdd: () => void
}

/** Builds a switch by hand while the canvas previews it; nothing exists until `Add switch`. */
export function DraftSwitchBuilder({ draft, onChange, onAdd }: DraftSwitchBuilderProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Shape the rows of the new switch; the canvas previews them live.
      </p>
      <SwitchFields
        name={draft.name}
        model={draft.model}
        numbering={draft.numbering}
        rows={draft.rows}
        onNameChange={(name) => onChange({ ...draft, name })}
        onModelChange={(model) => onChange({ ...draft, model })}
        onNumberingChange={(numbering) => onChange({ ...draft, numbering })}
        onRowsChange={(rows) => onChange({ ...draft, rows })}
      />
      <button
        type="button"
        className={`${primaryButton} self-start`}
        disabled={!draftCanCommit(draft)}
        onClick={onAdd}
      >
        Add switch
      </button>
    </div>
  )
}
