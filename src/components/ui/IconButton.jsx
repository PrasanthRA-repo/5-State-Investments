import Icon from './Icon'

const VARIANTS = {
  standard: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
  filled: 'bg-primary-600 text-white hover:bg-primary-700',
  tonal: 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-200',
  danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
}

// Icon-only circular button. `label` is required and becomes the
// accessible name (aria-label) since there's no visible text.
export default function IconButton({ icon, label, variant = 'standard', size = 22, className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full p-2 transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:pointer-events-none ${
        VARIANTS[variant] || VARIANTS.standard
      } ${className}`}
      {...rest}
    >
      <Icon name={icon} style={{ fontSize: size }} />
    </button>
  )
}
