import { useId, useState } from 'react'
import type { ReactNode } from 'react'

import { resolveSectionStarts, sectionLabelRange } from '@/model/layout'
import type { SectionSpec } from '@/model/layout'
import type { SectionEdit } from '@/model/layoutEdit'
import type { PortKind, SectionNumbering, SectionStartMode } from '@/model/types'
import { PORT_KINDS, PORT_SPEEDS, SECTION_NUMBERINGS, SECTION_START_MODES } from '@/model/types'

const input =
  'w-full min-w-0 rounded-md border border-border bg-background px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const labelText = 'text-xs font-medium text-muted-foreground'

const cardButton =
  'rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const DIMENSION_MIN = 1
const DIMENSION_MAX = 48
const START_MIN = 0
const START_MAX = 100000

/** What a hand-added section starts as: the presets' most common bank. */
const NEW_SECTION: SectionSpec = {
  rows: 2,
  columns: 8,
  kind: 'rj45',
  speed: '1G',
  numbering: 'alternating-top-first',
  startMode: 'auto',
}

const NUMBERING_LABELS: Record<SectionNumbering, string> = {
  'alternating-top-first': 'Alternating (top first)',
  'alternating-bottom-first': 'Alternating (bottom first)',
  sequential: 'Sequential',
}

const START_MODE_LABELS: Record<SectionStartMode, string> = {
  auto: 'Auto (end of previous)',
  custom: 'Custom',
}

const KIND_LABELS: Record<PortKind, string> = { rj45: 'RJ45', sfp: 'SFP', 'sfp+': 'SFP+' }

export interface SwitchFieldsProps {
  name: string
  model: string
  sections: readonly SectionEdit[]
  onNameChange: (name: string) => void
  onModelChange: (model: string) => void
  onSectionsChange: (sections: SectionEdit[]) => void
  /** Mode-specific copy under the identity fields. */
  notes?: ReactNode
  /** The mode's action, e.g. `Add switch` or `Delete switch`. */
  action?: ReactNode
}

/**
 * The identity fields and the row of Section cards shared by the switch editor and
 * the draft builder. Sections keep their `source` identity so the editor can preserve
 * port ids, and each edit is a complete new list of section specs.
 */
export function SwitchFields({
  name,
  model,
  sections,
  onNameChange,
  onModelChange,
  onSectionsChange,
  notes,
  action,
}: SwitchFieldsProps) {
  const starts = resolveSectionStarts(sections.map((section) => section.spec))

  const changeSection = (index: number, changes: Partial<SectionSpec>) =>
    onSectionsChange(
      sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, spec: { ...section.spec, ...changes } } : section,
      ),
    )

  const changeStartMode = (index: number, startMode: SectionStartMode) => {
    const current = sections[index].spec
    // Flipping to Custom pins the number the section shows right now, so it never jumps.
    changeSection(
      index,
      startMode === 'custom' && current.startMode === 'auto'
        ? { startMode, start: starts[index] }
        : { startMode },
    )
  }

  const addSection = () =>
    onSectionsChange([...sections, { source: null, spec: { ...NEW_SECTION } }])

  const removeSection = (index: number) =>
    onSectionsChange(sections.filter((_section, sectionIndex) => sectionIndex !== index))

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const [section] = next.splice(index, 1)
    next.splice(target, 0, section)
    onSectionsChange(next)
  }

  return (
    <div className="flex min-h-0 flex-1 items-stretch gap-5">
      <div className="flex w-[205px] shrink-0 flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Name</span>
          <input
            className={input}
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Model</span>
          <input
            className={input}
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
          />
        </label>
        {notes}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Sections render left → right, each centered vertically. Same-kind neighbours sit 6px apart;
          different kinds 16px.
        </p>
        {action}
      </div>

      <div className="flex min-w-0 flex-1 items-start gap-3 overflow-x-auto px-1 pt-1 pb-3">
        {sections.map((section, index) => (
          <SectionCard
            key={section.source === null ? `new-${index}` : `s-${section.source}`}
            index={index}
            spec={section.spec}
            start={starts[index]}
            last={index === sections.length - 1}
            removable={sections.length > 1}
            onSpecChange={(changes) => changeSection(index, changes)}
            onStartModeChange={(startMode) => changeStartMode(index, startMode)}
            onMoveLeft={() => moveSection(index, -1)}
            onMoveRight={() => moveSection(index, 1)}
            onRemove={() => removeSection(index)}
          />
        ))}
        <button
          type="button"
          aria-label="Add section"
          className="flex min-h-[150px] w-[120px] shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={addSection}
        >
          + Add section
        </button>
      </div>
    </div>
  )
}

interface SectionCardProps {
  index: number
  spec: SectionSpec
  start: number
  last: boolean
  removable: boolean
  onSpecChange: (changes: Partial<SectionSpec>) => void
  onStartModeChange: (startMode: SectionStartMode) => void
  onMoveLeft: () => void
  onMoveRight: () => void
  onRemove: () => void
}

function SectionCard({
  index,
  spec,
  start,
  last,
  removable,
  onSpecChange,
  onStartModeChange,
  onMoveLeft,
  onMoveRight,
  onRemove,
}: SectionCardProps) {
  const sectionNumber = index + 1
  const pinnedStart = spec.startMode === 'custom' ? (spec.start ?? start) : start

  return (
    <div className="flex min-w-[186px] max-w-[280px] flex-1 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Section {sectionNumber}
        </span>
        <span className="text-xs text-muted-foreground">{sectionLabelRange(spec, start)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label={`Section ${sectionNumber} rows`}
          text="rows"
          value={spec.rows}
          min={DIMENSION_MIN}
          max={DIMENSION_MAX}
          onCommit={(rows) => onSpecChange({ rows })}
        />
        <NumberField
          label={`Section ${sectionNumber} columns`}
          text="columns"
          value={spec.columns}
          min={DIMENSION_MIN}
          max={DIMENSION_MAX}
          onCommit={(columns) => onSpecChange({ columns })}
        />
        <SelectField
          label={`Section ${sectionNumber} port kind`}
          text="Kind"
          value={spec.kind}
          options={PORT_KINDS}
          optionLabel={(kind) => KIND_LABELS[kind]}
          onChange={(kind) => onSpecChange({ kind })}
        />
        <SelectField
          label={`Section ${sectionNumber} port speed`}
          text="Speed"
          value={spec.speed}
          options={PORT_SPEEDS}
          optionLabel={(speed) => speed}
          onChange={(speed) => onSpecChange({ speed })}
        />
        <div className="col-span-2">
          <SelectField
            label={`Section ${sectionNumber} numbering`}
            text="Numbering"
            value={spec.numbering}
            options={SECTION_NUMBERINGS}
            optionLabel={(numbering) => NUMBERING_LABELS[numbering]}
            onChange={(numbering) => onSpecChange({ numbering })}
          />
        </div>
        <div className="col-span-2">
          <SelectField
            label={`Section ${sectionNumber} start mode`}
            text="Start at"
            value={spec.startMode}
            options={SECTION_START_MODES}
            optionLabel={(startMode) => START_MODE_LABELS[startMode]}
            onChange={onStartModeChange}
          />
        </div>
        <div className="col-span-2">
          <NumberField
            label={`Section ${sectionNumber} start number`}
            text="start number"
            value={pinnedStart}
            min={START_MIN}
            max={START_MAX}
            disabled={spec.startMode !== 'custom'}
            onCommit={(value) => onSpecChange({ start: value })}
          />
        </div>
      </div>
      <div className="mt-auto flex items-center justify-end gap-1">
        <button
          type="button"
          aria-label={`Move section ${sectionNumber} left`}
          className={`${cardButton} disabled:opacity-40`}
          disabled={index === 0}
          onClick={onMoveLeft}
        >
          ←
        </button>
        <button
          type="button"
          aria-label={`Move section ${sectionNumber} right`}
          className={`${cardButton} disabled:opacity-40`}
          disabled={last}
          onClick={onMoveRight}
        >
          →
        </button>
        <button
          type="button"
          aria-label={`Remove section ${sectionNumber}`}
          title={removable ? undefined : 'A switch needs at least one section'}
          className={`${cardButton} disabled:opacity-40`}
          disabled={!removable}
          onClick={onRemove}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface SelectFieldProps<T extends string> {
  /** The accessible name, e.g. `Section 2 port kind`. */
  label: string
  /** The visible short label. */
  text: string
  value: T
  options: readonly T[]
  optionLabel: (option: T) => string
  onChange: (value: T) => void
}

function SelectField<T extends string>({
  label,
  text,
  value,
  options,
  optionLabel,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelText}>{text}</span>
      <select
        className={input}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

interface NumberFieldProps {
  /** The accessible name, e.g. `Section 2 rows`. */
  label: string
  /** The visible short label. */
  text: string
  value: number
  min: number
  max: number
  disabled?: boolean
  onCommit: (value: number) => void
}

/**
 * A number is committed on blur or Enter, not per keystroke: "2" on the way to "24" is a
 * different layout, and each invalid or intermediate value must never reach the document.
 */
function NumberField({
  label,
  text,
  value,
  min,
  max,
  disabled = false,
  onCommit,
}: NumberFieldProps) {
  // `draft` holds uncommitted typing; the model value shows through once it clears.
  const [draft, setDraft] = useState<string | null>(null)
  const errorId = useId()
  const shown = draft ?? String(value)
  const parsed = /^\d+$/.test(shown.trim()) ? Number(shown) : null
  const invalid = parsed === null || parsed < min || parsed > max

  const commit = () => {
    if (!invalid && parsed !== value) onCommit(parsed)
    setDraft(null)
  }

  return (
    <label className="flex flex-col gap-1">
      <span className={labelText}>{text}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        className={`${input} ${invalid ? 'border-destructive' : ''}`}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        disabled={disabled}
        value={shown}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
        }}
      />
      {invalid && (
        <p id={errorId} className="text-xs text-destructive">
          Enter a whole number from {min} to {max}.
        </p>
      )}
    </label>
  )
}
