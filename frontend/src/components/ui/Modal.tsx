import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-surface p-xl shadow-level-2">
        {title && (
          <h2 className="mb-lg font-headline-sm text-headline-sm text-on-surface">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
