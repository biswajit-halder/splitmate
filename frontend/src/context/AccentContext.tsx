import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Accent = 'ember' | 'violet' | 'mint'

interface AccentContextValue {
  accent: Accent
  setAccent: (accent: Accent) => void
}

const AccentContext = createContext<AccentContextValue>({
  accent: 'ember',
  setAccent: () => {},
})

const STORAGE_KEY = 'splitmate-accent'

function getInitialAccent(): Accent {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'violet' || stored === 'mint' ? stored : 'ember'
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<Accent>(getInitialAccent)

  useEffect(() => {
    document.documentElement.dataset.accent = accent
    localStorage.setItem(STORAGE_KEY, accent)
  }, [accent])

  return (
    <AccentContext.Provider value={{ accent, setAccent: setAccentState }}>
      {children}
    </AccentContext.Provider>
  )
}

export function useAccent() {
  return useContext(AccentContext)
}

export const ACCENTS: Array<{ key: Accent; label: string; color: string }> = [
  { key: 'ember', label: 'Ember', color: '#FF6B5E' },
  { key: 'violet', label: 'Ultra', color: '#B69CFF' },
  { key: 'mint', label: 'Mint', color: '#5FE0C0' },
]
