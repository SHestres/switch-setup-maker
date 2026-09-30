import { useId, useState } from 'react'

import type { RowSpec } from '@/model/layout'
import type { LayoutEdit } from '@/model/layoutEdit'
import type {
  GeneratedNumberingPreset,
  PortKind,
  PortSpeed,
  RowNumbering,
  Switch,
} from '@/model/types'
import { GENERATED_NUMBERING_PRESETS, PORT_KINDS, PORT_SPEEDS } from '@/model/types'

import { secondaryButton } from './buttonStyles'

export interface SwitchEditorProps {
  switch_: Switch
  onChange: (changes: { name?: string; model?: string }) => void
  /** A valid layout edit; the app decides whether it needs confirming first. */
  onLayoutEdit: (edit: LayoutEdit) => void
  onDelete: () => void
}

const input =
  'rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const labelText = 'text-xs font-medium text-muted-foreground'

const COUNT_MIN = 1
const COUNT_MAX = 48

/** What a hand-added row starts as: one half of the common 2×12 arrangement. */
const NEW_ROW: RowSpec = { count: 12, kind: 'rj45', speed: '1G' }

const NUMBERING_LABELS: Record<GeneratedNumberingPreset, string> = {
  'odd-top-even-bottom': 'Odd top / even bottom',
  sequential: 'Sequential',
  'even-top-zero-based': 'Even top / zero-based',
}

const KIND_LABELS: Record<PortKind, string> = { rj45: 'RJ45', sfp: 'SFP', 'sfp+': 'SFP+' }

/** The builder default that rides along when a row's kind changes, until the user overrides it. */
function defaultNumbering(kind: PortKind): RowNumbering {
  return kind === 'rj45' ? 'continue' : 'start-over'
}

interface EditableRow {
  /** Index into the switch's current rows, or `null` for a row appended by this edit. */
  source: number | null
  spec: RowSpec
}

function editableRows(switch_: Switch): EditableRow[] {
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
 * when it would sever connections. Ticket 20 reuses the same row builder for the draft.
 */
export function SwitchEditor({ switch_, onChange, onLayoutEdit, onDelete }: SwitchEditorProps) {
  const rows = editableRows(switch_)
  // `custom` labels are user-owned; v1 does not edit them, only offers a generated convention.
  const editable = switch_.layout.numbering !== 'custom'

  const commit = (
    mutate: (rows: EditableRow[]) => EditableRow[],
    numbering = switch_.layout.numbering,
  ) => {
    if (numbering === 'custom') return
    onLayoutEdit({ numbering, rows: mutate(rows) })
  }

  const changeCount = (index: number, count: number) =>
    commit((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, spec: { ...row.spec, count } } : row,
      ),
    )

  const changeKind = (index: number, kind: PortKind) =>
    commit((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row
        const spec: RowSpec = { ...row.spec, kind }
        if (rowIndex > 0) {
          // Follow the new kind's convention unless the user overrode the old kind's default.
          if (row.spec.numbering === defaultNumbering(row.spec.kind)) {
            spec.numbering = defaultNumbering(kind)
          }
        }
        return { ...row, spec }
      }),
    )

  const changeSpeed = (index: number, speed: PortSpeed) =>
    commit((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, spec: { ...row.spec, speed } } : row,
      ),
    )

  const changeNumbering = (index: number, numbering: RowNumbering) =>
    commit((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, spec: { ...row.spec, numbering } } : row,
      ),
    )

  const addRow = () => commit((current) => [...current, { source: null, spec: { ...NEW_ROW } }])

  const removeRow = (index: number) =>
    commit((current) => current.filter((_row, rowIndex) => rowIndex !== index))

  return (
    <div className="flex flex-col gap-5">
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
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Port numbering</span>
        <select
          className={input}
          aria-label="Port numbering"
          value={switch_.layout.numbering}
          onChange={(event) =>
            commit((current) => current, event.target.value as GeneratedNumberingPreset)
          }
        >
          {switch_.layout.numbering === 'custom' && (
            <option value="custom" disabled>
              Custom (not editable in v1)
            </option>
          )}
          {GENERATED_NUMBERING_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {NUMBERING_LABELS[preset]}
            </option>
          ))}
        </select>
      </label>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Rows</h3>
          <button
            type="button"
            className={`${secondaryButton} px-2 py-1 text-xs`}
            disabled={!editable}
            onClick={addRow}
          >
            Add row
          </button>
        </div>
        {rows.map((row, index) => (
          <RowFields
            key={switch_.layout.rows[index].ports[0].id}
            index={index}
            spec={row.spec}
            editable={editable}
            removable={rows.length > 1}
            onCountChange={(count) => changeCount(index, count)}
            onKindChange={(kind) => changeKind(index, kind)}
            onSpeedChange={(speed) => changeSpeed(index, speed)}
            onNumberingChange={(numbering) => changeNumbering(index, numbering)}
            onRemove={() => removeRow(index)}
          />
        ))}
        {!editable && (
          <p className="text-xs text-muted-foreground">
            This switch carries custom labels, so its rows are read-only. Choose a generated
            convention to edit them.
          </p>
        )}
      </section>

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

interface RowFieldsProps {
  index: number
  spec: RowSpec
  editable: boolean
  removable: boolean
  onCountChange: (count: number) => void
  onKindChange: (kind: PortKind) => void
  onSpeedChange: (speed: PortSpeed) => void
  onNumberingChange: (numbering: RowNumbering) => void
  onRemove: () => void
}

function RowFields({
  index,
  spec,
  editable,
  removable,
  onCountChange,
  onKindChange,
  onSpeedChange,
  onNumberingChange,
  onRemove,
}: RowFieldsProps) {
  const rowNumber = index + 1

  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Row {rowNumber}
        </span>
        <button
          type="button"
          aria-label={`Remove row ${rowNumber}`}
          title={removable ? undefined : 'A switch needs at least one row'}
          className={`${secondaryButton} px-2 py-0.5 text-xs`}
          disabled={!editable || !removable}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CountField
          index={index}
          value={spec.count}
          disabled={!editable}
          onCommit={onCountChange}
        />
        <label className="flex flex-col gap-1">
          <span className={labelText}>Kind</span>
          <select
            className={input}
            aria-label={`Row ${rowNumber} port kind`}
            value={spec.kind}
            disabled={!editable}
            onChange={(event) => onKindChange(event.target.value as PortKind)}
          >
            {PORT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelText}>Speed</span>
          <select
            className={input}
            aria-label={`Row ${rowNumber} port speed`}
            value={spec.speed}
            disabled={!editable}
            onChange={(event) => onSpeedChange(event.target.value as PortSpeed)}
          >
            {PORT_SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}
              </option>
            ))}
          </select>
        </label>
        {index > 0 && (
          <label className="flex flex-col gap-1">
            <span className={labelText}>Numbering</span>
            <select
              className={input}
              aria-label={`Row ${rowNumber} numbering`}
              value={spec.numbering ?? 'continue'}
              disabled={!editable}
              onChange={(event) => onNumberingChange(event.target.value as RowNumbering)}
            >
              <option value="continue">Continue</option>
              <option value="start-over">Start over</option>
            </select>
          </label>
        )}
      </div>
    </div>
  )
}

interface CountFieldProps {
  index: number
  value: number
  disabled: boolean
  onCommit: (count: number) => void
}

/**
 * A count is committed on blur or Enter, not per keystroke: "2" on the way to "24" is a
 * different layout, and each invalid or intermediate value must never reach the document.
 */
function CountField({ index, value, disabled, onCommit }: CountFieldProps) {
  // `draft` holds uncommitted typing; the model value shows through once it clears.
  const [draft, setDraft] = useState<string | null>(null)
  const errorId = useId()
  const text = draft ?? String(value)
  const parsed = /^\d+$/.test(text.trim()) ? Number(text) : null
  const invalid = parsed === null || parsed < COUNT_MIN || parsed > COUNT_MAX

  const commit = () => {
    if (!invalid && parsed !== value) onCommit(parsed)
    setDraft(null)
  }

  return (
    <label className="flex flex-col gap-1">
      <span className={labelText}>Ports</span>
      <input
        type="number"
        min={COUNT_MIN}
        max={COUNT_MAX}
        step={1}
        className={`${input} ${invalid ? 'border-destructive' : ''}`}
        aria-label={`Row ${index + 1} port count`}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        disabled={disabled}
        value={text}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
        }}
      />
      {invalid && (
        <p id={errorId} className="text-xs text-destructive">
          Enter a whole number from {COUNT_MIN} to {COUNT_MAX}.
        </p>
      )}
    </label>
  )
}
