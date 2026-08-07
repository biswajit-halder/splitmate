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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, variant: Toast['variant'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => removeToast(id), 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 flex flex-col gap-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 shadow-level-2 font-body-md text-body-md ${toast.variant === 'success' ? 'bg-green-100 text-green-800' : toast.variant === 'error' ? 'bg-error-container text-on-error-container' : toast.variant === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-primary-container text-on-primary-container'}`}
          >
            {toast.message}
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
