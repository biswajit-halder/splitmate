import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]',
  secondary: 'bg-transparent border border-outline text-on-surface hover:bg-surface-container-high',
  danger: 'bg-error text-on-error hover:opacity-90 active:scale-[0.98]',
  ghost: 'bg-transparent text-primary hover:bg-primary/5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`px-6 py-3 rounded-lg font-label-md text-label-md transition-all duration-200 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
