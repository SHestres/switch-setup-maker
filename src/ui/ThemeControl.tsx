import { THEMES } from '@/model/types'
import type { Theme } from '@/model/types'

import { SegmentedControl } from './SegmentedControl'

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  blueprint: 'Blueprint',
}

interface ThemeControlProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

/** Segmented app-bar control for the document's theme. */
export function ThemeControl({ theme, onThemeChange }: ThemeControlProps) {
  return (
    <SegmentedControl
      label="Theme"
      value={theme}
      options={THEMES}
      optionLabel={(option) => THEME_LABELS[option]}
      onChange={onThemeChange}
    />
  )
}
