import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ elevation = 1, className = '', ...props }, ref) => {
    const shadowClass = elevation === 1 ? 'shadow-level-1' : 'shadow-level-2'
    
    return (
      <div
        ref={ref}
        className={`rounded-lg border border-outline-variant bg-surface p-lg ${shadowClass} ${className}`}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'
