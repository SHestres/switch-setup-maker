import type { Setup } from '@/model/types'

/**
 * A temporary stand-in for the canvas (ticket 11): it makes the live model visible
 * so autosave, import and restore can be exercised before switches render.
 */
export function SetupSummary({ setup }: { setup: Setup }) {
  const { switches, connections } = setup

  return (
    <div className="grid h-full place-items-center p-8">
      {switches.length === 0 && connections.length === 0 ? (
        <div className="max-w-md rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">No switches yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The switch builder and canvas land in the next tickets; import a setup to watch the
            model restore here.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">
            {switches.length} {switches.length === 1 ? 'switch' : 'switches'} · {connections.length}{' '}
            {connections.length === 1 ? 'connection' : 'connections'}
          </h2>
          <ul className="mt-3 space-y-1">
            {switches.map((switch_) => (
              <li key={switch_.id} className="text-sm">
                {switch_.name || switch_.model || switch_.id}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Restored from browser storage — the canvas renders these switches in a later ticket.
          </p>
        </div>
      )}
    </div>
  )
}
