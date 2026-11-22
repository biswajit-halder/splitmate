const AVATAR_PAIRS = [
  { bg: '#FF6B5E', text: '#241016', gradient: ['#FF6B5E', '#FFC857'] },
  { bg: '#5FE0C0', text: '#12241F', gradient: ['#5FE0C0', '#B69CFF'] },
  { bg: '#FFC857', text: '#2A2010', gradient: ['#FFC857', '#FF6B5E'] },
  { bg: '#B69CFF', text: '#1C1426', gradient: ['#B69CFF', '#5FE0C0'] },
  { bg: '#FF8E7E', text: '#241016', gradient: ['#FF8E7E', '#B69CFF'] },
  { bg: '#7FF0D4', text: '#12241F', gradient: ['#7FF0D4', '#FFC857'] },
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

/** "Demo User 1" -> "D1", "Alice Johnson" -> "AJ". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  const number = words.find(w => /^\d+$/.test(w))
  const meaningful = words.filter(w => !/^(user|the)$/i.test(w) && !/^\d+$/.test(w))
  const first = (meaningful[0] ?? words[0])[0]
  if (meaningful[1]) return (first + meaningful[1][0]).toUpperCase()
  if (number) return (first + number).toUpperCase()
  return (first + (meaningful[0]?.[1] ?? '')).toUpperCase()
}
