// MD3 "elevated surface" card. accentColor draws a 3px top border (used for
// category performance cards / project status), hoverable adds the subtle
// lift-on-hover motion used for clickable cards.
export default function Card({ children, className = '', accentColor, hoverable = false, padding = 'p-4 sm:p-6', as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-e1 transition-all duration-250 ${
        hoverable ? 'hover:shadow-e3 hover:-translate-y-0.5' : ''
      } ${padding} ${className}`}
      style={accentColor ? { borderTopWidth: 3, borderTopColor: accentColor } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
