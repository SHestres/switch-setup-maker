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
    <SwitchFields
      name={draft.name}
      model={draft.model}
      sections={draft.sections}
      onNameChange={(name) => onChange({ ...draft, name })}
      onModelChange={(model) => onChange({ ...draft, model })}
      onSectionsChange={(sections) => onChange({ ...draft, sections })}
      notes={
        <p className="text-xs leading-relaxed text-muted-foreground">
          Shape the sections of the new switch; the canvas previews them live.
        </p>
      }
      action={
        <button
          type="button"
          className={`${primaryButton} self-start`}
          disabled={!draftCanCommit(draft)}
          onClick={onAdd}
        >
          Add switch
        </button>
      }
    />
  )
}
