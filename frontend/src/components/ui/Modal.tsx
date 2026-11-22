import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, subtitle, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="animate-enter absolute inset-0 bg-[#0D0914]/70 backdrop-blur-md" onClick={onClose} />
      <div className={`animate-scale-in glass-card relative z-10 max-h-[92vh] w-full overflow-y-auto p-xl sm:max-w-lg ${className}`}>
        {(title || subtitle) && (
          <div className="mb-lg pr-8">
            {title && <h2 className="font-headline-sm text-on-surface">{title}</h2>}
            {subtitle && <p className="mt-xs font-body-sm text-on-surface-variant">{subtitle}</p>}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-lg top-lg rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        {children}
      </div>
    </div>
  )
}
