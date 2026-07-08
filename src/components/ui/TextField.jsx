import { useId, useState } from 'react'
import Icon from './Icon'

// MD3-style outlined text field with a floating label. Works as a controlled
// input -- pass value/onChange like a normal <input>. `type="password"` gets
// an automatic show/hide toggle.
export default function TextField({
  label,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  placeholder,
  className = '',
  full = false,
  ...rest
}) {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type
  const hasValue = value !== undefined && value !== null && String(value).length > 0

  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''} ${className}`} htmlFor={id}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      )}
      <span className="relative block">
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100 ${
            error
              ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500'
              : 'border-slate-300 focus:ring-primary-500/40 focus:border-primary-500 dark:border-slate-600 dark:focus:border-primary-400'
          } ${isPassword ? 'pr-10' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[19px]" />
          </button>
        )}
      </span>
      {error && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  )
}
