import { CABLE_LAYERS } from '@/model/types'
import type { CableLayer } from '@/model/types'

import { SegmentedControl } from './SegmentedControl'

const CABLE_LAYER_LABELS: Record<CableLayer, string> = {
  above: 'Cables above',
  behind: 'Cables behind',
}

interface CableLayerControlProps {
  cableLayer: CableLayer
  onCableLayerChange: (cableLayer: CableLayer) => void
}

/** Segmented app-bar control for whether cables draw above or behind the switches. */
export function CableLayerControl({ cableLayer, onCableLayerChange }: CableLayerControlProps) {
  return (
    <SegmentedControl
      label="Cable layer"
      value={cableLayer}
      options={CABLE_LAYERS}
      optionLabel={(option) => CABLE_LAYER_LABELS[option]}
      onChange={onCableLayerChange}
    />
  )
}
