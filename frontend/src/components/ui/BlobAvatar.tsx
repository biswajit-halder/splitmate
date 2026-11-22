import { getAvatarPair, getInitials } from '../../lib/avatarColors'

interface BlobAvatarProps {
  userId: string
  name: string
  size?: number
  className?: string
  rounded?: 'blob' | 'circle' | 'square'
}

const BLOB_PATH = 'M50 6C68 6 88 20 92 42C96 64 82 88 58 93C34 98 10 82 6 58C2 34 22 6 50 6Z'

export function BlobAvatar({ userId, name, size = 40, className = '', rounded = 'blob' }: BlobAvatarProps) {
  const { gradient, text } = getAvatarPair(userId)
  const initials = getInitials(name)
  const gradientId = `avatar-gradient-${userId.replace(/[^a-zA-Z0-9]/g, '')}`
  const shape = rounded === 'circle'
    ? <circle cx="50" cy="50" r="46" fill={`url(#${gradientId})`} />
    : rounded === 'square'
      ? <rect x="4" y="4" width="92" height="92" rx="22" fill={`url(#${gradientId})`} />
      : <path d={BLOB_PATH} fill={`url(#${gradientId})`} />

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label={name}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      {shape}
      <text
        x="50"
        y="57"
        textAnchor="middle"
        fontFamily="'Karla', sans-serif"
        fontWeight="700"
        fontSize={initials.length > 2 ? 21 : 27}
        fill={text}
      >
        {initials}
      </text>
    </svg>
  )
}
