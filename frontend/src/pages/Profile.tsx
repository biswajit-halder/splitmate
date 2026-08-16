import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { usersApi } from '../lib/api/users'
import { groupsApi } from '../lib/api/groups'
import { friendsApi } from '../lib/api/friends'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui'
import { Button } from '../components/ui'
import { getToken } from '../lib/api/client'

const AVATAR_BG_OPTIONS = ['bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container', 'bg-error-container']

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, setSession, logout } = useAuth()
  const { addToast } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [avatarBg, setAvatarBg] = useState(user?.avatarBg ?? AVATAR_BG_OPTIONS[0])

  const groups = useApi(() => groupsApi.list())
  const friends = useApi(() => friendsApi.list())

  const stats = useMemo(
    () => ({
      groups: groups.data?.length ?? 0,
      friends: friends.data?.length ?? 0,
    }),
    [groups.data, friends.data],
  )

  const save = useMutation((body: { name: string; avatar_bg: string }) => usersApi.patchMe(body))

  const handleSave = async () => {
    try {
      const res = await save.mutate({ name: name.trim(), avatar_bg: avatarBg })
      const token = getToken()
      if (token) setSession(token, res)
      addToast('Profile updated', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update', 'error' as never)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Profile</h2>

      <div className="bg-surface rounded-xl border border-outline-variant/20 p-xl flex flex-col items-center text-center">
        <div className={`w-20 h-20 rounded-full ${avatarBg} flex items-center justify-center font-headline-sm text-headline-sm text-on-surface mb-md`}>
          {user?.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <p className="font-headline-sm text-headline-sm text-on-surface">{user?.name}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{user?.email}</p>
        <div className="flex gap-lg mt-lg">
          <div className="text-center">
            <p className="font-headline-sm text-headline-sm text-on-surface">{stats.groups}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Groups</p>
          </div>
          <div className="text-center">
            <p className="font-headline-sm text-headline-sm text-on-surface">{stats.friends}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Friends</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex flex-col gap-lg">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Edit Profile</h3>
        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Avatar Color</label>
          <div className="flex gap-sm">
            {AVATAR_BG_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setAvatarBg(opt)}
                className={`w-9 h-9 rounded-full ${opt} ${avatarBg === opt ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={save.loading}>{save.loading ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      <Button variant="danger" onClick={handleLogout}>Log Out</Button>
    </div>
  )
}
