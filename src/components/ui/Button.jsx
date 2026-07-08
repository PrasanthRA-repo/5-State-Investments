import Icon from './Icon'
import Spinner from './Spinner'

const VARIANTS = {
  filled: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-e1 hover:shadow-e2',
  tonal:
    'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-200 dark:hover:bg-primary-900/60',
  outlined:
    'bg-transparent text-primary-700 border border-slate-300 hover:bg-primary-50 dark:text-primary-300 dark:border-slate-600 dark:hover:bg-slate-800',
  text: 'bg-transparent text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-e1 hover:shadow-e2',
  'danger-text': 'bg-transparent text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
}

const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1',
  md: 'text-sm px-4 py-2.5 gap-1.5',
  lg: 'text-base px-5 py-3 gap-2',
}

// MD3-style button. variant: filled | tonal | outlined | text | danger | danger-text
export default function Button({
  children,
  variant = 'filled',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap ${
        VARIANTS[variant] || VARIANTS.filled
      } ${SIZES[size] || SIZES.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <Spinner size={16} className={variant === 'filled' || variant === 'danger' ? 'text-white' : ''} />
      ) : (
        icon && <Icon name={icon} className="text-[18px]" />
      )}
      {children}
    </button>
  )
}
