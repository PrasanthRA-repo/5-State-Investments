import { useId } from 'react'
import Icon from './Icon'

// MD3-style outlined select. Pass <option> children exactly like a native
// <select> -- this just wraps it with the shared label/border/focus styling
// and a chevron icon.
export default function Select({ label, className = '', full = false, children, ...rest }) {
  const id = useId()
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''} ${className}`} htmlFor={id}>
      {label && <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>}
      <span className="relative block">
        <select
          id={id}
          className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:focus:border-primary-400"
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"
        />
      </span>
    </label>
  )
}
