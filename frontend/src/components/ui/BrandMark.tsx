interface BrandMarkProps {
  size?: number
  className?: string
}

/** Two nested arcs: one whole, one split — the SplitMate mark. */
export function BrandMark({ size = 36, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="#B69CFF" />
        </linearGradient>
      </defs>
      <path
        d="M20 4a16 16 0 1 0 16 16"
        stroke="url(#brand-gradient)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M20 11a9 9 0 0 1 9 9"
        stroke="url(#brand-gradient)"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="20" cy="20" r="2.6" fill="url(#brand-gradient)" />
    </svg>
  )
}
