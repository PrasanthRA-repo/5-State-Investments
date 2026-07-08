import { createContext, useCallback, useContext, useState, useRef } from 'react'
import Icon from '../components/ui/Icon'

const SnackbarContext = createContext(null)
let idCounter = 0

// Lightweight MD3-style snackbar/toast queue, replacing every alert()/confirm()
// error message in the app. Call `showSnackbar('message', { type: 'error' })`
// from anywhere. Auto-dismisses after a few seconds, stacks if more than one
// fires close together.
export function SnackbarProvider({ children }) {
  const [items, setItems] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const showSnackbar = useCallback(
    (message, opts = {}) => {
      const id = ++idCounter
      const type = opts.type || 'info'
      const duration = opts.duration ?? (type === 'error' ? 6000 : 3500)
      setItems((prev) => [...prev, { id, message, type }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const value = { showSnackbar, dismiss }

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div
        className="fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-4 sm:items-end sm:pb-6 sm:pr-6"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {items.map((item) => (
          <SnackbarItem key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </SnackbarContext.Provider>
  )
}

function SnackbarItem({ item, onDismiss }) {
  const styles = {
    info: 'bg-slate-800 text-white dark:bg-slate-700',
    success: 'bg-secondary-700 text-white',
    error: 'bg-red-600 text-white',
  }
  const icons = { info: 'info', success: 'check_circle', error: 'error' }

  return (
    <div
      role="status"
      className={`animate-slide-up flex w-full max-w-sm items-start gap-2 rounded-xl px-4 py-3 shadow-e4 ${
        styles[item.type] || styles.info
      }`}
    >
      <Icon name={icons[item.type] || 'info'} className="mt-0.5 shrink-0 text-[20px]" />
      <p className="flex-1 text-sm leading-snug break-words">{item.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 shrink-0 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </div>
  )
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider')
  return ctx
}
