import { HTMLAttributes, forwardRef } from 'react'

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'primary' | 'success'
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, variant = 'primary', className = '', ...props }, ref) => {
    const percentage = Math.min((value / max) * 100, 100)
    const fillColor = variant === 'primary' ? 'bg-primary-container' : 'bg-green-500'

    return (
      <div
        ref={ref}
        className={`h-2 w-full rounded-full bg-surface-container-high ${className}`}
        {...props}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'
