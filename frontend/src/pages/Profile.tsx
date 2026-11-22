/**
 * Personal Info Save Flow
 * =======================
 *
 * ```mermaid
 * flowchart TD
 *     A[User clicks Save] --> B[handleSaveProfile]
 *     B --> C[PATCH /api/users/me with name + avatar_bg]
 *     C --> D{API returns User object}
 *     D -->|Response missing email| E["setSession({...user, ...res})"]
 *     D -->|Response has email| E
 *     E --> F["AuthContext: setUser(merged)"]
 *     F --> G[React re-render]
 *     G --> H["emailChanged = email.trim() !== user?.email"]
 *     H -->|Same email| I[Password field stays hidden]
 *     H -->|Different email| J[Password field shown for confirmation]
 *
 *     K[User edits Email field] --> L[emailChanged becomes true]
 *     L --> M[Password confirmation field appears]
 *     M --> N[User enters current password]
 *     N --> O[Clicks Save Email]
 *     O --> P[POST /api/users/me/email with email + password]
 *     P --> Q[setSession + setEmail from response]
 *     Q --> R[emailChanged returns to false]
 *     R --> I
 * ```
 */
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { usersApi } from '../lib/api/users'
import { groupsApi } from '../lib/api/groups'
import { friendsApi } from '../lib/api/friends'
import { useAuth } from '../context/AuthContext'
import { useToast, Button, BlobAvatar, PasswordInput, AccentSwitcher } from '../components/ui'
import { getAvatarPair } from '../lib/avatarColors'

type AvatarBgOption = { label: string; className: string; preview: string }

const AVATAR_BG_OPTIONS: AvatarBgOption[] = [
  { label: 'Clay', className: 'bg-[#A64B2A]', preview: '#A64B2A' },
  { label: 'Olive', className: 'bg-[#6B7A4F]', preview: '#6B7A4F' },
  { label: 'Gold', className: 'bg-[#D9A441]', preview: '#D9A441' },
  { label: 'Default', className: 'bg-primary', preview: '' },
]

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, setSession, logout } = useAuth()
  const { addToast } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [avatarBg, setAvatarBg] = useState(user?.avatarBg ?? AVATAR_BG_OPTIONS[0].className)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('')
  const [digestEnabled, setDigestEnabled] = useState(true)

  useEffect(() => {
    setEmail(user?.email ?? '')
  }, [user?.email])

  const groups = useApi(() => groupsApi.list())
  const friends = useApi(() => friendsApi.list())

  const stats = useMemo(
    () => ({
      groups: groups.data?.length ?? 0,
      friends: friends.data?.length ?? 0,
    }),
    [groups.data, friends.data],
  )

  const saveProfile = useMutation((body: { name: string; avatar_bg: string }) => usersApi.patchMe(body))
  const saveEmail = useMutation((body: { email: string; password: string }) => usersApi.changeEmail(body))
  const savePassword = useMutation((body: { currentPassword: string; newPassword: string }) => usersApi.changePassword(body))

  const emailChanged = email.trim() !== (user?.email ?? '')

  const handleSaveProfile = async () => {
    try {
      const res = await saveProfile.mutate({ name: name.trim(), avatar_bg: avatarBg })
      setSession({ ...user!, ...res })
      addToast('Profile updated', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update', 'error')
    }
  }

  const handleSaveEmail = async () => {
    if (!email.trim()) {
      addToast('Email cannot be empty', 'error')
      return
    }
    if (!emailConfirmPassword) {
      addToast('Enter your password to change email', 'error')
      return
    }
    try {
      const res = await saveEmail.mutate({ email: email.trim(), password: emailConfirmPassword })
      setSession(res)
      setEmail(res.email ?? '')
      setEmailConfirmPassword('')
      addToast('Email updated', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to change email', 'error')
    }
  }

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      addToast('Both password fields are required', 'error')
      return
    }
    try {
      await savePassword.mutate({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      addToast('Password updated', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to change password', 'error')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Profile & Settings</h1>

      {/* Section 1: Profile Header */}
      <div className="bg-surface rounded-xl border border-line/40 p-xl flex flex-col items-center text-center">
        <BlobAvatar userId={user?.id ?? ''} name={user?.name ?? ''} size={80} className="mb-md" />
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

      {/* Section 2: Personal Info */}
      <div className="bg-surface rounded-xl border border-line/40 p-lg flex flex-col gap-lg">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Personal Info</h3>
        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface"
          />
          {emailChanged && (
            <div className="flex flex-col gap-sm mt-sm">
              <PasswordInput
                id="email-password"
                label="Current Password (required to change email)"
                value={emailConfirmPassword}
                onChange={setEmailConfirmPassword}
                placeholder="Enter your password"
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveEmail} disabled={saveEmail.loading}>{saveEmail.loading ? 'Saving…' : 'Save Email'}</Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Avatar Color</label>
          <div className="flex gap-sm">
            {AVATAR_BG_OPTIONS.map(opt => (
              <button
                key={opt.className}
                type="button"
                onClick={() => setAvatarBg(opt.className)}
                title={opt.label}
                className={`relative flex items-center justify-center w-10 h-10 text-xs font-medium transition-shadow ${
                  avatarBg === opt.className ? 'ring-2 ring-offset-2 ring-primary shadow-md' : ''
                }`}
                style={{
                  borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                  backgroundColor: opt.preview || undefined,
                  color: opt.preview ? getAvatarPair(user?.id ?? 'default').text : 'var(--color-on-primary)',
                }}
              >
                {(user?.name ?? '?')[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saveProfile.loading}>{saveProfile.loading ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      {/* Section 3: Change Password */}
      <div className="bg-surface rounded-xl border border-line/40 p-lg flex flex-col gap-lg">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Change Password</h3>
        <PasswordInput
          id="current-password"
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Enter current password"
        />
        <PasswordInput
          id="new-password"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Enter new password"
          showStrength
        />
        <div className="flex justify-end">
          <Button onClick={handleSavePassword} disabled={savePassword.loading}>{savePassword.loading ? 'Updating…' : 'Update Password'}</Button>
        </div>
      </div>

      {/* Section 4: Preferences */}
      <div className="glass-card flex flex-col gap-lg p-lg">
        <h3 className="font-headline-sm text-on-surface">Preferences</h3>
        <div className="flex flex-col gap-sm">
          <p className="micro-label">Accent signal</p>
          <AccentSwitcher />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-md">
          <span className="font-label-md text-on-surface">Currency</span>
          <span className="num font-label-md text-on-surface-variant">INR (₹)</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-md">
          <span className="font-label-md text-on-surface">Theme</span>
          <span className="font-label-md text-on-surface-variant">Night Market / Daylight</span>
        </div>
        <label className="flex items-center justify-between rounded-xl bg-surface-container-low p-md">
          <span className="font-label-md text-on-surface">Monthly email digest</span>
          <input
            type="checkbox"
            checked={digestEnabled}
            onChange={async e => {
              const next = e.target.checked
              setDigestEnabled(next)
              try {
                await usersApi.patchMe({ digest_enabled: next })
                addToast('Digest preference saved', 'success')
              } catch {
                setDigestEnabled(!next)
                addToast('Could not save preference', 'error')
              }
            }}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
        </label>
      </div>

      {/* Section 5: Log Out */}
      <Button variant="danger" onClick={handleLogout}>Log Out</Button>
    </div>
  )
}
