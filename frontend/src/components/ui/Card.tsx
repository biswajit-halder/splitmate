import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ elevation = 1, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`glass-card p-lg ${elevation === 2 ? 'shadow-level-2' : ''} ${className}`}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'
