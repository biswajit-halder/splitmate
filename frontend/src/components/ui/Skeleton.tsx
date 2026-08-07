import { HTMLAttributes, forwardRef } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', width, height, className = '', ...props }, ref) => {
    const variantClasses = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-md',
    }

    return (
      <div
        ref={ref}
        className={`animate-pulse bg-outline-variant ${variantClasses[variant]} ${className}`}
        style={{ width, height }}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'
