const AVATAR_PAIRS = [
  { bg: '#A64B2A', text: '#F1EAE0' },
  { bg: '#6B7A4F', text: '#FBF7F1' },
  { bg: '#D9A441', text: '#2A2620' },
  { bg: '#7E381E', text: '#F1EAE0' },
  { bg: '#4E5A38', text: '#FBF7F1' },
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getAvatarColor(id: string): string {
  return AVATAR_PAIRS[hashString(id) % AVATAR_PAIRS.length].bg
}

export function getAvatarPair(id: string) {
  return AVATAR_PAIRS[hashString(id) % AVATAR_PAIRS.length]
}
