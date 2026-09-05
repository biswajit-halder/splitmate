import { useState } from 'react'

interface PasswordInputProps {
  id: string
  name?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  label?: string
  showStrength?: boolean
}

function getStrength(pw: string): { level: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length >= 12) score++
  
  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-error' }
  if (score <= 3) return { level: 2, label: 'Medium', color: 'bg-yellow-500' }
  return { level: 3, label: 'Strong', color: 'bg-success' }
}

export function PasswordInput({ id, name, value, onChange, placeholder = '••••••••', error, label = 'Password', showStrength = false }: PasswordInputProps) {
  const [show, setShow] = useState(false)
  const strength = showStrength && value ? getStrength(value) : null

  return (
    <div className="flex flex-col gap-sm">
      <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor={id}>{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lock</span>
        </div>
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-12 pl-11 pr-12 rounded-lg border border-outline/40 bg-transparent text-on-background placeholder:text-outline/60 font-body-md text-body-md focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all duration-200 outline-none"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-background transition-colors focus:outline-none"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {show ? 'visibility' : 'visibility_off'}
          </span>
        </button>
      </div>
      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      {strength && (
        <div className="flex items-center gap-sm">
          <div className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: `${(strength.level / 3) * 100}%` }} />
          </div>
          <span className="font-label-xs text-xs text-on-surface-variant">{strength.label}</span>
        </div>
      )}
    </div>
  )
}
