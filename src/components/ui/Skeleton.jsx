// Shimmering placeholder block shown while data is loading, instead of a
// plain "Loading…" sentence. `variant="text"` gives a short rounded bar,
// `variant="card"` gives a full card-sized block.
export default function Skeleton({ variant = 'text', className = '', width, height }) {
  const base = 'skeleton animate-shimmer rounded-lg'
  if (variant === 'card') {
    return <div className={`${base} rounded-2xl ${className}`} style={{ width, height: height || 96 }} />
  }
  if (variant === 'circle') {
    return <div className={`${base} rounded-full ${className}`} style={{ width: width || 40, height: height || 40 }} />
  }
  return <div className={`${base} ${className}`} style={{ width: width || '100%', height: height || 14 }} />
}

export function SkeletonGrid({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-2 gap-4 lg:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" height={92} />
      ))}
    </div>
  )
}
