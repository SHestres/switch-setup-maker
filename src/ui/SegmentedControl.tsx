import { cn } from '@/lib/utils'

const optionClass =
  'rounded-sm px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export interface SegmentedControlProps<Option extends string> {
  /** Accessible name of the group, e.g. "Theme". */
  label: string
  value: Option
  options: readonly Option[]
  optionLabel: (option: Option) => string
  onChange: (option: Option) => void
}

/** Segmented app-bar control: exactly one option pressed. */
export function SegmentedControl<Option extends string>({
  label,
  value,
  options,
  optionLabel,
  onChange,
}: SegmentedControlProps<Option>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-0.5 rounded-md border border-border bg-secondary p-0.5"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          className={cn(optionClass, option === value && 'bg-background text-foreground shadow-sm')}
          onClick={() => onChange(option)}
        >
          {optionLabel(option)}
        </button>
      ))}
    </div>
  )
}
