import { HTMLAttributes, forwardRef } from 'react'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  initials?: string
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 text-label-sm',
  md: 'w-10 h-10 text-label-md',
  lg: 'w-12 h-12 text-body-md',
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ initials = '?', size = 'md', online, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center rounded-full bg-outline-variant font-label-md text-label-md text-on-surface-variant ${sizeClasses[size]} ${className}`}
        {...props}
      >
        <span className="uppercase">{initials}</span>
        {online !== undefined && (
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface ${online ? 'bg-green-500' : 'bg-outline-variant'}`}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'
