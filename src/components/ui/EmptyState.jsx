import Icon from './Icon'

// Centered empty-state block (icon + title + optional subtitle/action),
// used anywhere a list/table has zero rows instead of a single gray sentence.
export default function EmptyState({ icon = 'inbox', title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
        <Icon name={icon} className="text-[26px] text-slate-400 dark:text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
