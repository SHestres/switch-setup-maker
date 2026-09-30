import type { Switch } from '@/model/types'

export interface SwitchEditorProps {
  switch_: Switch
  onChange: (changes: { name?: string; model?: string }) => void
}

const input =
  'rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * The selected switch's editor. Ticket 17 covers name and model; ticket 19
 * grows this into the full layout editor.
 */
export function SwitchEditor({ switch_, onChange }: SwitchEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          className={input}
          value={switch_.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Model</span>
        <input
          className={input}
          value={switch_.model}
          onChange={(event) => onChange({ model: event.target.value })}
        />
      </label>
    </div>
  )
}
