interface BrandMarkProps {
  size?: number
  className?: string
}

/**
 * Two nested arcs: one whole, one split — the SplitMate mark.
 * Uses currentColor so it stays visible inside the coloured logo tile;
 * callers pass a contrasting text colour (dark on the bright gradient).
 */
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
      <path
        d="M20 4a16 16 0 1 0 16 16"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M20 11a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="20" cy="20" r="2.6" fill="currentColor" />
    </svg>
  )
}
