import { useState } from 'react'

import { Canvas } from '@/canvas/Canvas'
import { DEFAULT_CANVAS_SIZE, placeNewSwitch } from '@/canvas/placement'
import type { Size } from '@/canvas/placement'
import { moveSwitch, nextSwitchId, resetSetup, setTheme, setViewport } from '@/model/document'
import { switchFromPreset } from '@/model/presets'
import type { LayoutPreset } from '@/model/presets'
import { useDocument } from '@/model/useDocument'
import { AppBar } from '@/ui/AppBar'
import { Inspector } from '@/ui/Inspector'
import { PresetGallery } from '@/ui/PresetGallery'
import { SwitchEditor } from '@/ui/SwitchEditor'

type InspectorState = { mode: 'gallery' } | { mode: 'editor'; switchId: string } | null

export default function App() {
  const { document, setDocument } = useDocument()
  const [inspector, setInspector] = useState<InspectorState>(null)
  const [canvasSize, setCanvasSize] = useState<Size>(DEFAULT_CANVAS_SIZE)

  const selectedSwitchId = inspector?.mode === 'editor' ? inspector.switchId : null
  const selectedSwitch = selectedSwitchId
    ? document.setup.switches.find((switch_) => switch_.id === selectedSwitchId)
    : undefined

  const closeInspector = () => setInspector(null)
  const openGallery = () => setInspector({ mode: 'gallery' })
  const selectSwitch = (switchId: string) => setInspector({ mode: 'editor', switchId })

  const addFromPreset = (preset: LayoutPreset) => {
    const id = nextSwitchId(document.setup.switches)
    const position = placeNewSwitch(
      document.ui.viewport,
      canvasSize,
      document.setup.switches.length,
    )
    const switch_ = switchFromPreset(preset, id, position)
    setDocument((current) => ({
      ...current,
      setup: { ...current.setup, switches: [...current.setup.switches, switch_] },
    }))
    selectSwitch(id)
  }

  const updateSelectedSwitch = (changes: { name?: string; model?: string }) => {
    if (!selectedSwitchId) return
    setDocument((current) => ({
      ...current,
      setup: {
        ...current.setup,
        switches: current.setup.switches.map((switch_) =>
          switch_.id === selectedSwitchId ? { ...switch_, ...changes } : switch_,
        ),
      },
    }))
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <AppBar
        document={document}
        onReplace={(next) => {
          setDocument(next)
          closeInspector()
        }}
        onNewSetup={() => {
          setDocument((current) => resetSetup(current))
          closeInspector()
        }}
        onAddSwitch={openGallery}
        onThemeChange={(theme) => setDocument((current) => setTheme(current, theme))}
      />
      <main className="relative flex-1 overflow-hidden">
        <Canvas
          document={document}
          selectedSwitchId={selectedSwitchId}
          onMoveSwitch={(switchId, position) =>
            setDocument((current) => moveSwitch(current, switchId, position))
          }
          onViewportChange={(viewport) => setDocument((current) => setViewport(current, viewport))}
          onCanvasSizeChange={setCanvasSize}
          onSelectSwitch={selectSwitch}
          onClearSelection={closeInspector}
        />
        {inspector?.mode === 'gallery' && (
          <Inspector title="Add a switch" onClose={closeInspector}>
            <PresetGallery onPick={addFromPreset} />
          </Inspector>
        )}
        {inspector?.mode === 'editor' && selectedSwitch && (
          <Inspector title="Edit switch" onClose={closeInspector}>
            <SwitchEditor switch_={selectedSwitch} onChange={updateSelectedSwitch} />
          </Inspector>
        )}
      </main>
    </div>
  )
}
