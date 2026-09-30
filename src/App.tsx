import { resetSetup } from '@/model/document'
import { useDocument } from '@/model/useDocument'
import { AppBar } from '@/ui/AppBar'
import { SetupSummary } from '@/ui/SetupSummary'

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
        <SetupSummary setup={document.setup} />
      </main>
    </div>
  )
}
