import { useId, useState } from 'react'

import { generateSectionLabels, resolveSectionStarts } from '@/model/layout'
import type { SectionSpec } from '@/model/layout'
import type { SectionEdit } from '@/model/layoutEdit'
import type { PortKind, PortSpeed, SectionNumbering, SectionStartMode } from '@/model/types'
import { PORT_KINDS, PORT_SPEEDS, SECTION_NUMBERINGS, SECTION_START_MODES } from '@/model/types'

import { secondaryButton } from './buttonStyles'

export interface SwitchFieldsProps {
  name: string
  model: string
  sections: readonly SectionEdit[]
  onNameChange: (name: string) => void
  onModelChange: (model: string) => void
  onSectionsChange: (sections: SectionEdit[]) => void
}

const input =
  'rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const labelText = 'text-xs font-medium text-muted-foreground'

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

/** The labels a section covers at its resolved start, e.g. `1–16`. */
function labelRange(spec: SectionSpec, start: number): string {
  const labels = generateSectionLabels(spec, start).flat()
  const first = labels[0]
  const last = labels[labels.length - 1]
  return first === last ? first : `${first}–${last}`
}

/**
 * The identity and section fields shared by the switch editor and the draft builder.
 * Sections keep their `source` identity so the editor can preserve port ids, and each
 * edit is a complete new list of section specs.
 */
export function SwitchFields({
  name,
  model,
  sections,
  onNameChange,
  onModelChange,
  onSectionsChange,
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
    <div className="flex flex-col gap-5">
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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Sections</h3>
          <button
            type="button"
            className={`${secondaryButton} px-2 py-1 text-xs`}
            onClick={addSection}
          >
            Add section
          </button>
        </div>
        {sections.map((section, index) => (
          <SectionFields
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
        {sections.length === 0 && (
          <p className="text-xs text-muted-foreground">Add a section to give the switch ports.</p>
        )}
      </section>
    </div>
  )
}

interface SectionFieldsProps {
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

function SectionFields({
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
}: SectionFieldsProps) {
  const sectionNumber = index + 1
  const pinnedStart = spec.startMode === 'custom' ? (spec.start ?? start) : start

  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Section {sectionNumber}
          </span>
          <span className="text-xs text-muted-foreground">{labelRange(spec, start)}</span>
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Move section ${sectionNumber} left`}
            className={`${secondaryButton} px-2 py-0.5 text-xs`}
            disabled={index === 0}
            onClick={onMoveLeft}
          >
            ←
          </button>
          <button
            type="button"
            aria-label={`Move section ${sectionNumber} right`}
            className={`${secondaryButton} px-2 py-0.5 text-xs`}
            disabled={last}
            onClick={onMoveRight}
          >
            →
          </button>
          <button
            type="button"
            aria-label={`Remove section ${sectionNumber}`}
            title={removable ? undefined : 'A switch needs at least one section'}
            className={`${secondaryButton} px-2 py-0.5 text-xs`}
            disabled={!removable}
            onClick={onRemove}
          >
            Remove
          </button>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label={`Section ${sectionNumber} rows`}
          value={spec.rows}
          min={DIMENSION_MIN}
          max={DIMENSION_MAX}
          onCommit={(rows) => onSpecChange({ rows })}
        />
        <NumberField
          label={`Section ${sectionNumber} columns`}
          value={spec.columns}
          min={DIMENSION_MIN}
          max={DIMENSION_MAX}
          onCommit={(columns) => onSpecChange({ columns })}
        />
        <label className="flex flex-col gap-1">
          <span className={labelText}>Kind</span>
          <select
            className={input}
            aria-label={`Section ${sectionNumber} port kind`}
            value={spec.kind}
            onChange={(event) => onSpecChange({ kind: event.target.value as PortKind })}
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
            aria-label={`Section ${sectionNumber} port speed`}
            value={spec.speed}
            onChange={(event) => onSpecChange({ speed: event.target.value as PortSpeed })}
          >
            {PORT_SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className={labelText}>Numbering</span>
          <select
            className={input}
            aria-label={`Section ${sectionNumber} numbering`}
            value={spec.numbering}
            onChange={(event) =>
              onSpecChange({ numbering: event.target.value as SectionNumbering })
            }
          >
            {SECTION_NUMBERINGS.map((numbering) => (
              <option key={numbering} value={numbering}>
                {NUMBERING_LABELS[numbering]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelText}>Start at</span>
          <select
            className={input}
            aria-label={`Section ${sectionNumber} start mode`}
            value={spec.startMode}
            onChange={(event) => onStartModeChange(event.target.value as SectionStartMode)}
          >
            {SECTION_START_MODES.map((startMode) => (
              <option key={startMode} value={startMode}>
                {START_MODE_LABELS[startMode]}
              </option>
            ))}
          </select>
        </label>
        <NumberField
          label={`Section ${sectionNumber} start number`}
          value={pinnedStart}
          min={START_MIN}
          max={START_MAX}
          disabled={spec.startMode !== 'custom'}
          onCommit={(value) => onSpecChange({ start: value })}
        />
      </div>
    </div>
  )
}

interface NumberFieldProps {
  label: string
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
function NumberField({ label, value, min, max, disabled = false, onCommit }: NumberFieldProps) {
  // `draft` holds uncommitted typing; the model value shows through once it clears.
  const [draft, setDraft] = useState<string | null>(null)
  const errorId = useId()
  const text = draft ?? String(value)
  const parsed = /^\d+$/.test(text.trim()) ? Number(text) : null
  const invalid = parsed === null || parsed < min || parsed > max

  const commit = () => {
    if (!invalid && parsed !== value) onCommit(parsed)
    setDraft(null)
  }

  return (
    <label className="flex flex-col gap-1">
      <span className={labelText}>{label.replace(/^Section \d+ /, '')}</span>
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
        value={text}
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
