import { THEMES } from '@/model/types'
import type { Theme } from '@/model/types'
import { cn } from '@/lib/utils'

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  blueprint: 'Blueprint',
}

const optionClass =
  'rounded-sm px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

interface ThemeControlProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

/** Segmented app-bar control for the document's theme. */
export function ThemeControl({ theme, onThemeChange }: ThemeControlProps) {
  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-md border border-border bg-secondary p-0.5"
    >
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === theme}
          className={cn(optionClass, option === theme && 'bg-background text-foreground shadow-sm')}
          onClick={() => onThemeChange(option)}
        >
          {THEME_LABELS[option]}
        </button>
      ))}
    </div>
  )
}
