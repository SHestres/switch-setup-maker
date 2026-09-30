import { CABLE_LAYERS } from '@/model/types'
import type { CableLayer } from '@/model/types'
import { cn } from '@/lib/utils'

const CABLE_LAYER_LABELS: Record<CableLayer, string> = {
  above: 'Cables above',
  behind: 'Cables behind',
}

const optionClass =
  'rounded-sm px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

interface CableLayerControlProps {
  cableLayer: CableLayer
  onCableLayerChange: (cableLayer: CableLayer) => void
}

/** Segmented app-bar control for whether cables draw above or behind the switches. */
export function CableLayerControl({ cableLayer, onCableLayerChange }: CableLayerControlProps) {
  return (
    <div
      role="group"
      aria-label="Cable layer"
      className="flex items-center gap-0.5 rounded-md border border-border bg-secondary p-0.5"
    >
      {CABLE_LAYERS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === cableLayer}
          className={cn(
            optionClass,
            option === cableLayer && 'bg-background text-foreground shadow-sm',
          )}
          onClick={() => onCableLayerChange(option)}
        >
          {CABLE_LAYER_LABELS[option]}
        </button>
      ))}
    </div>
  )
}
