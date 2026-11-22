import { useState, useRef, useEffect, useCallback } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Select({ value, onChange, options, placeholder = 'Select an option', className, disabled }: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(o => o.value === value)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
  }, [])
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [handleClickOutside, handleEscape])

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-line bg-surface-container-low/80 px-md text-left font-body-md text-on-surface backdrop-blur transition-colors hover:border-outline focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={`truncate ${!selectedOption ? 'text-on-surface-variant' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`material-symbols-outlined shrink-0 text-[20px] text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && options.length > 0 && (
        <div className="animate-scale-in glass-card absolute z-50 mt-1.5 max-h-60 w-full origin-top overflow-auto p-1 shadow-level-2">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-lg px-md py-2.5 text-left font-body-md transition-colors ${
                option.value === value
                  ? 'bg-primary/15 font-semibold text-primary'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <span className="material-symbols-outlined text-[18px]">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
