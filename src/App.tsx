import { Canvas } from '@/canvas/Canvas'
import { moveSwitch, resetSetup, setViewport } from '@/model/document'
import { useDocument } from '@/model/useDocument'
import { AppBar } from '@/ui/AppBar'

export default function App() {
  const { document, setDocument } = useDocument()

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <AppBar
        document={document}
        onReplace={(next) => setDocument(next)}
        onNewSetup={() => setDocument((current) => resetSetup(current))}
      />
      <main className="relative flex-1 overflow-hidden">
        <Canvas
          document={document}
          onMoveSwitch={(switchId, position) =>
            setDocument((current) => moveSwitch(current, switchId, position))
          }
          onViewportChange={(viewport) => setDocument((current) => setViewport(current, viewport))}
        />
      </main>
    </div>
  )
}
