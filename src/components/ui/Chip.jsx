const TONE_CLASSES = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

// Small pill used for statuses/categories/badges. Pass either `tone` (one of
// the presets above) or a raw `color` hex for a custom-colored chip (e.g.
// per-category colors already defined in constants.js).
export default function Chip({ children, tone = 'neutral', color, icon, className = '' }) {
  if (color) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
        style={{ backgroundColor: `${color}1a`, color }}
      >
        {icon}
        {children}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        TONE_CLASSES[tone] || TONE_CLASSES.neutral
      } ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}
