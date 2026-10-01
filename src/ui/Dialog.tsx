import { AlertDialog } from '@base-ui/react/alert-dialog'

import { primaryButton, secondaryButton } from './buttonStyles'

export interface DialogAction {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  actions: DialogAction[]
}

/** A small alert dialog for confirms and error messages (ticket 06's dialog surface). */
export function Dialog({ open, onOpenChange, title, description, actions }: DialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-xl transition-[scale,opacity] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
          <div className="flex flex-col gap-1.5">
            <AlertDialog.Title className="text-base font-semibold">{title}</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          </div>
          <div className="flex justify-end gap-2">
            {actions.map((action) => (
              <AlertDialog.Close
                key={action.label}
                className={action.variant === 'primary' ? primaryButton : secondaryButton}
                onClick={action.onClick}
              >
                {action.label}
              </AlertDialog.Close>
            ))}
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
