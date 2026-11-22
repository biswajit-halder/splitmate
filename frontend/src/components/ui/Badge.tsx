import { HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  glow?: boolean
}

const variantClasses: Record<BadgeProps['variant'] & string, string> = {
  primary: 'tint-lilac',
  success: 'tint-mint',
  warning: 'tint-saffron',
  danger: 'tint-coral',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', glow, className = '', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 font-label-sm ${variantClasses[variant]} ${glow ? 'shadow-[0_0_18px_rgba(95,224,192,0.18)]' : ''} ${className}`}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
