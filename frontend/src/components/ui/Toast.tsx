import { createContext, useContext, useState, ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, variant?: Toast['variant']) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const variants: Record<Toast['variant'], { icon: string; className: string }> = {
  success: { icon: 'check_circle', className: 'tint-mint' },
  error: { icon: 'error', className: 'tint-coral' },
  warning: { icon: 'warning', className: 'tint-saffron' },
  info: { icon: 'info', className: 'tint-lilac' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const addToast = (message: string, variant: Toast['variant'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-2), { id, message, variant }])
    setTimeout(() => removeToast(id), 4500)
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-md right-md z-[60] flex flex-col items-center gap-sm md:bottom-6 md:left-auto md:right-6 md:items-end">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`animate-toast-in glass-card pointer-events-auto flex max-w-sm items-center gap-sm px-md py-sm shadow-level-2 ${variants[toast.variant].className}`}
            role="status"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {variants[toast.variant].icon}
            </span>
            <span className="font-body-sm">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss"
              className="ml-1 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
