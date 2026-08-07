import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className="flex flex-col gap-xs">
        {label && (
          <label htmlFor={inputId} className="font-label-sm text-label-sm text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-12 rounded-md border border-outline bg-surface px-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${error ? 'border-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="font-label-sm text-label-sm text-error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
