import { ButtonHTMLAttributes, forwardRef } from 'react'

interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ active, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`h-10 px-4 font-label-md text-label-md transition-all duration-200 ${active ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'} ${className}`}
        {...props}
      />
    )
  }
)

Tab.displayName = 'Tab'
