import { HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger'
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary-container text-on-primary-container',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-error-container text-on-error-container',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex h-6 items-center rounded-full px-2 font-label-sm text-label-sm ${variantClasses[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
