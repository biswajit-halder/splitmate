import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Settings</h2>

      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex flex-col gap-md">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Account</h3>
        <div className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
          <span className="font-label-md text-label-md text-on-surface">Email</span>
          <span className="font-label-md text-label-md text-on-surface-variant">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
          <span className="font-label-md text-label-md text-on-surface">Name</span>
          <span className="font-label-md text-label-md text-on-surface-variant">{user?.name}</span>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex flex-col gap-md">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Preferences</h3>
        <div className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
          <span className="font-label-md text-label-md text-on-surface">Currency</span>
          <span className="font-label-md text-label-md text-on-surface-variant">INR (₹)</span>
        </div>
        <div className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
          <span className="font-label-md text-label-md text-on-surface">Theme</span>
          <span className="font-label-md text-label-md text-on-surface-variant">System</span>
        </div>
      </div>

      <Button variant="danger" onClick={handleLogout}>Log Out</Button>
    </div>
  )
}
