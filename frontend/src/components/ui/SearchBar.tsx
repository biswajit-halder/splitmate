import { InputHTMLAttributes, forwardRef } from 'react'

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
          search
        </span>
        <input
          ref={ref}
          type="search"
          className={`h-12 w-full rounded-md border border-outline bg-surface-container-low pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-2 focus:border-primary focus:outline-none ${className}`}
          {...props}
        />
      </div>
    )
  }
)

SearchBar.displayName = 'SearchBar'
