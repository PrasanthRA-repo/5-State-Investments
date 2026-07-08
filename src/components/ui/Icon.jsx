// Thin wrapper around the Material Symbols Outlined icon font loaded in
// index.html. Usage: <Icon name="dashboard" />. `name` must be a valid
// Material Symbols icon name (see fonts.google.com/icons).
export default function Icon({ name, className = '', style, filled = false }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined, ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
