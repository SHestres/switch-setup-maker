import { useEffect, useState } from 'react'

import { Canvas } from '@/canvas/Canvas'
import { DEFAULT_CANVAS_SIZE, placeNewSwitch } from '@/canvas/placement'
import type { Size } from '@/canvas/placement'
import { WIRE_HINT_MS } from '@/canvas/wiring'
import type { WireHintState } from '@/canvas/wiring'
import { connect, connectionsTouchingSwitch, disconnect, removeSwitch } from '@/model/connections'
import {
  findPort,
  moveSwitch,
  nextSwitchId,
  resetSetup,
  setCableLayer,
  setTheme,
  setViewport,
  switchLabel,
} from '@/model/document'
import { applyLayoutEdit, countSeveredConnections, planLayoutEdit } from '@/model/layoutEdit'
import type { LayoutEdit } from '@/model/layoutEdit'
import { switchFromPreset } from '@/model/presets'
import type { LayoutPreset } from '@/model/presets'
import type { Connection, PortRef } from '@/model/types'
import { useDocument } from '@/model/useDocument'
import { AppBar } from '@/ui/AppBar'
import { Dialog } from '@/ui/Dialog'
import { DraftSwitchBuilder } from '@/ui/DraftSwitchBuilder'
import type { DraftSwitch } from '@/ui/draftSwitch'
import { createDraftSwitch, draftIsEdited, draftToSwitch } from '@/ui/draftSwitch'
import { Inspector } from '@/ui/Inspector'
import { PresetGallery } from '@/ui/PresetGallery'
import { SwitchEditor } from '@/ui/SwitchEditor'

type InspectorState =
  { mode: 'gallery' } | { mode: 'draft' } | { mode: 'editor'; switchId: string } | null

/** Where the inspector should end up once a draft (if any) is out of the way. */
type InspectorExit = 'close' | 'gallery' | { switchId: string }

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
  | { kind: 'draft'; exit: InspectorExit }

function inspectorFor(exit: InspectorExit): InspectorState {
  if (exit === 'close') return null
  if (exit === 'gallery') return { mode: 'gallery' }
  return { mode: 'editor', switchId: exit.switchId }
}

function connectionCount(count: number): string {
  if (count === 0) return 'no connections'
  return count === 1 ? '1 connection' : `${count} connections`
}

export default function App() {
  const { document, setDocument } = useDocument()
  const [inspector, setInspector] = useState<InspectorState>(null)
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)
  const [draft, setDraft] = useState<DraftSwitch | null>(null)
  const [canvasSize, setCanvasSize] = useState<Size>(DEFAULT_CANVAS_SIZE)
  /** The Port a pending wire starts from; ephemeral UI state, never persisted. */
  const [pendingPort, setPendingPort] = useState<PortRef | null>(null)
  /** The selected cable, by unordered pair; ephemeral UI state, never persisted. */
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  /** A connection refusal near its offending Port; fades on its own. */
  const [wireHint, setWireHint] = useState<WireHintState | null>(null)

  useEffect(() => {
    if (!wireHint) return
    const timer = setTimeout(() => setWireHint(null), WIRE_HINT_MS)
    return () => clearTimeout(timer)
  }, [wireHint])

  // Escape abandons a pending wire (and its hint) and drops the cable selection.
  // An open confirm owns the key.
  useEffect(() => {
    if ((!pendingPort && !wireHint && !selectedConnection) || confirm) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPendingPort(null)
      setWireHint(null)
      setSelectedConnection(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pendingPort, wireHint, selectedConnection, confirm])

  // Delete/Backspace removes the selected cable. Text fields keep their own keys,
  // so an edit in the inspector never severs a connection.
  useEffect(() => {
    if (!selectedConnection || confirm) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return
      }
      event.preventDefault()
      setDocument((current) => ({
        ...current,
        setup: disconnect(current.setup, selectedConnection.a, selectedConnection.b),
      }))
      setSelectedConnection(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedConnection, confirm, setDocument])

  const selectedSwitchId = inspector?.mode === 'editor' ? inspector.switchId : null
  const selectedSwitch = selectedSwitchId
    ? document.setup.switches.find((switch_) => switch_.id === selectedSwitchId)
    : undefined

  /**
   * ✕, Esc, empty-canvas clicks, the gallery and switch selection all leave through here;
   * a draft follows the discard rules first. An open confirm owns Escape, so the panel
   * must not act on the same keypress that closes the dialog.
   */
  const leaveInspector = (exit: InspectorExit = 'close') => {
    if (confirm) return
    if (inspector?.mode === 'draft' && draft && draftIsEdited(draft)) {
      setConfirm({ kind: 'draft', exit })
      return
    }
    setDraft(null)
    setInspector(inspectorFor(exit))
  }
  const closeInspector = () => leaveInspector('close')
  const openGallery = () => leaveInspector('gallery')
  const selectSwitch = (switchId: string) => {
    setSelectedConnection(null)
    leaveInspector({ switchId })
  }

  /** Removing the Connection frees both Ports; the selection is ephemeral. */
  const deleteConnection = (connection: Connection) => {
    setDocument((current) => ({
      ...current,
      setup: disconnect(current.setup, connection.a, connection.b),
    }))
    setSelectedConnection(null)
  }

  const startBlank = () => {
    setDraft(
      createDraftSwitch(placeNewSwitch(document.ui.viewport, canvasSize, document.setup.switches)),
    )
    setInspector({ mode: 'draft' })
  }

  const updateDraft = (next: DraftSwitch) => setDraft(next)

  const commitDraft = () => {
    if (!draft) return
    const id = nextSwitchId(document.setup.switches)
    const switch_ = draftToSwitch(draft, id)
    setDocument((current) => ({
      ...current,
      setup: { ...current.setup, switches: [...current.setup.switches, switch_] },
    }))
    setDraft(null)
    setInspector({ mode: 'editor', switchId: id })
  }

  const addFromPreset = (preset: LayoutPreset) => {
    const id = nextSwitchId(document.setup.switches)
    const position = placeNewSwitch(document.ui.viewport, canvasSize, document.setup.switches)
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

  const handlePortClick = (ref: PortRef) => {
    // Only Ports that exist in the document are wireable; draft-switch ports are not.
    if (!findPort(document.setup, ref)) return

    const from = pendingPort && findPort(document.setup, pendingPort) ? pendingPort : null
    if (!from) {
      setWireHint(null)
      setPendingPort(ref)
      return
    }

    const result = connect(document.setup, from, ref)
    if (!result.ok) {
      // The refusal keeps the pending wire: only the target end was the problem.
      setWireHint({ port: result.problem.port ?? ref, message: result.problem.message })
      return
    }

    setDocument((current) => ({ ...current, setup: result.setup }))
    setPendingPort(null)
    setWireHint(null)
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
    if (confirm.kind === 'draft') {
      setDraft(null)
      setInspector(inspectorFor(confirm.exit))
      return
    }
    setDocument((current) => ({
      ...current,
      setup: removeSwitch(current.setup, confirm.switchId),
    }))
    setDraft(null)
    setInspector(null)
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <AppBar
        document={document}
        onReplace={(next) => {
          setDocument(next)
          setDraft(null)
          setInspector(null)
          setPendingPort(null)
          setSelectedConnection(null)
          setWireHint(null)
        }}
        onNewSetup={() => {
          setDocument((current) => resetSetup(current))
          setDraft(null)
          setInspector(null)
          setPendingPort(null)
          setSelectedConnection(null)
          setWireHint(null)
        }}
        onAddSwitch={openGallery}
        onThemeChange={(theme) => setDocument((current) => setTheme(current, theme))}
        onCableLayerChange={(cableLayer) =>
          setDocument((current) => setCableLayer(current, cableLayer))
        }
      />
      <main className="relative flex-1 overflow-hidden">
        <Canvas
          document={document}
          draft={draft ? draftToSwitch(draft) : null}
          selectedSwitchId={selectedSwitchId}
          onMoveSwitch={(switchId, position) =>
            setDocument((current) => moveSwitch(current, switchId, position))
          }
          onViewportChange={(viewport) => setDocument((current) => setViewport(current, viewport))}
          onCanvasSizeChange={setCanvasSize}
          onSelectSwitch={selectSwitch}
          onClearSelection={() => {
            closeInspector()
            setPendingPort(null)
            setSelectedConnection(null)
            setWireHint(null)
          }}
          onPortClick={handlePortClick}
          selectedConnection={selectedConnection}
          onSelectConnection={setSelectedConnection}
          onDeleteConnection={deleteConnection}
          pendingPort={pendingPort}
          hint={wireHint}
        />
        {inspector?.mode === 'gallery' && (
          <Inspector title="Add a switch" onClose={() => closeInspector()}>
            <PresetGallery onPick={addFromPreset} onStartBlank={startBlank} />
          </Inspector>
        )}
        {inspector?.mode === 'draft' && draft && (
          <Inspector title="New switch" onClose={() => closeInspector()}>
            <DraftSwitchBuilder draft={draft} onChange={updateDraft} onAdd={commitDraft} />
          </Inspector>
        )}
        {inspector?.mode === 'editor' && selectedSwitch && (
          <Inspector title="Edit switch" onClose={() => closeInspector()}>
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
        title={
          confirm?.kind === 'delete'
            ? 'Delete switch?'
            : confirm?.kind === 'draft'
              ? 'Discard this switch?'
              : 'Change layout?'
        }
        description={
          confirm === null
            ? ''
            : confirm.kind === 'delete'
              ? `Deleting ${confirm.name} severs ${connectionCount(confirm.connections)}.`
              : confirm.kind === 'draft'
                ? 'The draft switch has not been added to the setup yet.'
                : `Applying this change to ${confirm.name} severs ${connectionCount(confirm.connections)}.`
        }
        actions={[
          { label: 'Cancel', variant: 'secondary' },
          confirm?.kind === 'delete'
            ? { label: 'Delete', variant: 'primary', onClick: applyConfirm }
            : confirm?.kind === 'draft'
              ? { label: 'Discard', variant: 'primary', onClick: applyConfirm }
              : { label: 'Apply', variant: 'primary', onClick: applyConfirm },
        ]}
      />
    </div>
  )
}
