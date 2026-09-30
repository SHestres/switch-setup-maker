import { useState } from 'react'

import { Canvas } from '@/canvas/Canvas'
import { DEFAULT_CANVAS_SIZE, placeNewSwitch } from '@/canvas/placement'
import type { Size } from '@/canvas/placement'
import { connectionsTouchingSwitch, removeSwitch } from '@/model/connections'
import { moveSwitch, nextSwitchId, resetSetup, setTheme, setViewport } from '@/model/document'
import { applyLayoutEdit, countSeveredConnections, planLayoutEdit } from '@/model/layoutEdit'
import type { LayoutEdit } from '@/model/layoutEdit'
import { switchFromPreset } from '@/model/presets'
import type { LayoutPreset } from '@/model/presets'
import type { Switch } from '@/model/types'
import { useDocument } from '@/model/useDocument'
import { AppBar } from '@/ui/AppBar'
import { Dialog } from '@/ui/Dialog'
import { Inspector } from '@/ui/Inspector'
import { PresetGallery } from '@/ui/PresetGallery'
import { SwitchEditor } from '@/ui/SwitchEditor'

type InspectorState = { mode: 'gallery' } | { mode: 'editor'; switchId: string } | null

/** One confirm surface for every destructive switch edit. */
type PendingConfirm =
  | {
      kind: 'layout'
      switchId: string
      name: string
      connections: number
      edit: LayoutEdit
    }
  | { kind: 'delete'; switchId: string; name: string; connections: number }

function switchLabel(switch_: Switch): string {
  return switch_.name || switch_.model || switch_.id
}

function connectionCount(count: number): string {
  if (count === 0) return 'no connections'
  return count === 1 ? '1 connection' : `${count} connections`
}

export default function App() {
  const { document, setDocument } = useDocument()
  const [inspector, setInspector] = useState<InspectorState>(null)
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)
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

  const requestLayoutEdit = (edit: LayoutEdit) => {
    const switch_ = selectedSwitch
    if (!switch_) return

    const plan = planLayoutEdit(switch_, edit)
    const connections = countSeveredConnections(document.setup, switch_.id, plan.removedPortIds)
    if (connections > 0) {
      setConfirm({
        kind: 'layout',
        switchId: switch_.id,
        name: switchLabel(switch_),
        connections,
        edit,
      })
      return
    }
    setDocument((current) => applyLayoutEdit(current, switch_.id, edit))
  }

  const requestDelete = () => {
    const switch_ = selectedSwitch
    if (!switch_) return
    setConfirm({
      kind: 'delete',
      switchId: switch_.id,
      name: switchLabel(switch_),
      connections: connectionsTouchingSwitch(document.setup, switch_.id).length,
    })
  }

  const applyConfirm = () => {
    if (!confirm) return
    if (confirm.kind === 'layout') {
      setDocument((current) => applyLayoutEdit(current, confirm.switchId, confirm.edit))
      return
    }
    setDocument((current) => ({
      ...current,
      setup: removeSwitch(current.setup, confirm.switchId),
    }))
    closeInspector()
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
            <SwitchEditor
              switch_={selectedSwitch}
              onChange={updateSelectedSwitch}
              onLayoutEdit={requestLayoutEdit}
              onDelete={requestDelete}
            />
          </Inspector>
        )}
      </main>
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null)
        }}
        title={confirm?.kind === 'delete' ? 'Delete switch?' : 'Change layout?'}
        description={
          confirm === null
            ? ''
            : confirm.kind === 'delete'
              ? `Deleting ${confirm.name} severs ${connectionCount(confirm.connections)}.`
              : `Applying this change to ${confirm.name} severs ${connectionCount(confirm.connections)}.`
        }
        actions={[
          { label: 'Cancel', variant: 'secondary' },
          confirm?.kind === 'delete'
            ? { label: 'Delete', variant: 'primary', onClick: applyConfirm }
            : { label: 'Apply', variant: 'primary', onClick: applyConfirm },
        ]}
      />
    </div>
  )
}
