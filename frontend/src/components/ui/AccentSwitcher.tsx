import { useAccent, ACCENTS } from '../../context/AccentContext'

/** Three-swatch accent switcher for the sidebar and settings. */
export function AccentSwitcher({ compact = false }: { compact?: boolean }) {
  const { accent, setAccent } = useAccent()

  return (
    <div className="flex flex-col gap-xs">
      {!compact && <p className="eyebrow">Accent signal</p>}
      <div className="flex min-w-0 gap-xs">
        {ACCENTS.map(a => (
          <button
            key={a.key}
            type="button"
            onClick={() => setAccent(a.key)}
            title={`${a.label} accent`}
            aria-label={`${a.label} accent`}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-[11px] leading-none transition-all ${
              accent === a.key
                ? 'border-[color:var(--accent)] text-on-surface glow-shadow'
                : 'border-line text-on-surface-variant hover:border-outline'
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: a.color, boxShadow: `0 0 8px ${a.color}` }}
            />
            {!compact && a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
