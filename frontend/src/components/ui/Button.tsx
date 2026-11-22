import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-br from-primary to-[var(--accent-2)] text-on-primary glow-shadow hover:brightness-110',
  secondary: 'glass-card text-on-surface hover:border-outline',
  danger: 'bg-gradient-to-br from-error to-error/70 text-on-error shadow-level-1 hover:brightness-110',
  ghost: 'bg-transparent text-primary hover:bg-primary/10',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex h-11 items-center justify-center gap-sm rounded-xl px-lg font-label-md transition-interactive pressable disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
