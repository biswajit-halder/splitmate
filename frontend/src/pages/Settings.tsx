import { Card, Button, Input } from '../components/ui'

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-xl">
      <div><h1 className="font-headline-lg text-headline-lg text-on-surface">Settings</h1><p className="font-body-md text-body-md text-on-surface-variant">Manage your account and preferences.</p></div>
      <Card><h3 className="mb-lg font-headline-sm text-headline-sm text-on-surface">Profile</h3><div className="flex flex-col gap-lg"><Input label="Name" type="text" defaultValue="Alex" /><Input label="Email" type="email" defaultValue="alex@example.com" /><Button className="w-fit">Save Changes</Button></div></Card>
      <Card><h3 className="mb-lg font-headline-sm text-headline-sm text-on-surface">Notifications</h3><div className="flex flex-col gap-md">{[{ label: 'Expense added', description: 'When someone adds an expense to a group' },{ label: 'Settlement reminder', description: 'When a settlement is due' },{ label: 'Group invitation', description: 'When you are invited to a group' }].map((n, i) => (<div key={i} className="flex items-center justify-between"><div><p className="font-label-md text-label-md text-on-surface">{n.label}</p><p className="font-label-sm text-label-sm text-on-surface-variant">{n.description}</p></div><input type="checkbox" defaultChecked className="h-5 w-5 rounded border-outline text-primary focus:ring-primary" /></div>))}</div></Card>
      <Card><h3 className="mb-lg font-headline-sm text-headline-sm text-on-surface">Danger Zone</h3><div className="flex items-center justify-between"><div><p className="font-label-md text-label-md text-on-surface">Delete Account</p><p className="font-label-sm text-label-sm text-on-surface-variant">Permanently delete your account and all data</p></div><Button variant="danger">Delete Account</Button></div></Card>
    </div>
  )
}
