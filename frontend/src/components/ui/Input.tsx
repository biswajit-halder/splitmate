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
          <label htmlFor={inputId} className="micro-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-11 rounded-xl border border-line bg-surface-container-low/80 px-md font-body-md text-body-md text-on-surface outline-none backdrop-blur transition-all placeholder:text-on-surface-variant/60 hover:border-outline focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,94,0.12)] ${error ? 'border-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="font-label-sm text-error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
