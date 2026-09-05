interface BlobAvatarProps {
  userId: string
  name: string
  size?: number
  className?: string
}

const AVATAR_PAIRS = [
  { bg: '#A64B2A', text: '#F1EAE0' },
  { bg: '#6B7A4F', text: '#FBF7F1' },
  { bg: '#D9A441', text: '#2A2620' },
  { bg: '#7E381E', text: '#F1EAE0' },
  { bg: '#4E5A38', text: '#FBF7F1' },
]

function getAvatarPair(userId: string) {
  const hash = [...userId].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_PAIRS[hash % AVATAR_PAIRS.length]
}

const BLOB_PATH = 'M50 6C68 6 88 20 92 42C96 64 82 88 58 93C34 98 10 82 6 58C2 34 22 6 50 6Z'

export function BlobAvatar({ userId, name, size = 40, className = '' }: BlobAvatarProps) {
  const { bg, text } = getAvatarPair(userId)
  const initials = name.slice(0, 2).toUpperCase()
  const filterId = `grain-${userId}`

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feColorMatrix in="noise" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0" />
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
      </defs>
      <path
        d={BLOB_PATH}
        fill={bg}
        filter={`url(#${filterId})`}
      />
      <text x="50" y="57" textAnchor="middle" fontFamily="'Karla', sans-serif" fontWeight="700" fontSize="26" fill={text}>
        {initials}
      </text>
    </svg>
  )
}
