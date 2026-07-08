import { useEffect } from 'react'
import Button from './Button'
import IconButton from './IconButton'

// MD3-style modal dialog. Controlled via `open`; renders nothing when closed.
// Closes on Escape or backdrop click (unless `preventClose` is set).
export function Dialog({ open, onClose, title, children, footer, preventClose = false }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape' && !preventClose) onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose, preventClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] animate-fade-in"
        onClick={() => !preventClose && onClose?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className="relative w-full max-w-md animate-scale-in rounded-2xl bg-white p-5 shadow-e4 dark:bg-slate-800 sm:p-6"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
          {!preventClose && (
            <IconButton icon="close" label="Close dialog" onClick={onClose} className="-mr-1 -mt-1" />
          )}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// Convenience confirmation dialog replacing window.confirm() calls throughout
// the app, e.g. deleting a transaction/holding/project/comment. Usage:
//   const [pending, setPending] = useState(null)
//   <ConfirmDialog open={!!pending} title="Delete?" message="..." onConfirm={...} onCancel={() => setPending(null)} />
export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel, loading = false }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="text" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'filled'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Dialog>
  )
}

export default Dialog
