import { useState } from 'react'

import { LAYOUT_PRESETS } from '@/model/presets'
import type { LayoutPreset } from '@/model/presets'

import { secondaryButton } from './buttonStyles'

export interface PresetGalleryProps {
  /** A hardware chip: creates and selects the switch in one click. */
  onPick: (preset: LayoutPreset) => void
  /** `Start blank` starts the draft flow (ticket 20). */
  onStartBlank: () => void
}

export function PresetGallery({ onPick, onStartBlank }: PresetGalleryProps) {
  const [previewed, setPreviewed] = useState<LayoutPreset | null>(null)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Pick a preset to place a fully configured switch on the canvas.
      </p>
      <div className="flex flex-wrap gap-2">
        {LAYOUT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={secondaryButton}
            title={preset.details}
            onClick={() => onPick(preset)}
            onMouseEnter={() => setPreviewed(preset)}
            onMouseLeave={() => setPreviewed(null)}
            onFocus={() => setPreviewed(preset)}
            onBlur={() => setPreviewed(null)}
          >
            {preset.label}
          </button>
        ))}
        <button type="button" className={secondaryButton} onClick={onStartBlank}>
          Start blank
        </button>
      </div>
      {previewed && (
        <p className="max-w-3xl rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          {previewed.details}
        </p>
      )}
    </div>
  )
}
