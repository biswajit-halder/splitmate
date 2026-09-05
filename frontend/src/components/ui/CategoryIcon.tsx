interface CategoryIconProps {
  category: string
  size?: number
  className?: string
}

const ICON_CONFIGS: Record<string, { color: string; wobble: number; path: string }> = {
  trip: {
    color: 'var(--color-primary)',
    wobble: -2,
    path: '<path d="M6 30 L18 8 L24 8 L34 30 Z"/><path d="M15 22 L26 22"/><circle cx="21" cy="15" r="2.2" fill="var(--color-primary)" stroke="none"/>',
  },
  home: {
    color: 'var(--color-secondary)',
    wobble: 1.5,
    path: '<path d="M6 20 L20 7 L34 20"/><path d="M10 18 L10 33 L30 33 L30 18"/><path d="M17 33 L17 23 L23 23 L23 33"/>',
  },
  food: {
    color: 'var(--color-tertiary)',
    wobble: -1,
    path: '<circle cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="6"/>',
  },
  social: {
    color: 'var(--color-on-primary-container)',
    wobble: 2,
    path: '<path d="M20 6 L23 15 L32 15 L25 21 L28 30 L20 24 L12 30 L15 21 L8 15 L17 15 Z"/>',
  },
  office: {
    color: 'var(--color-outline)',
    wobble: -0.5,
    path: '<rect x="8" y="10" width="24" height="22" rx="2"/><path d="M8 18 L32 18"/><circle cx="20" cy="24" r="2.5" fill="var(--color-outline)" stroke="none"/>',
  },
}

const FALLBACK = ICON_CONFIGS.home

export function CategoryIcon({ category, size = 40, className = '' }: CategoryIconProps) {
  const cfg = ICON_CONFIGS[category] ?? FALLBACK

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke={cfg.color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ transform: `rotate(${cfg.wobble}deg)` }}
      dangerouslySetInnerHTML={{ __html: cfg.path }}
    />
  )
}
