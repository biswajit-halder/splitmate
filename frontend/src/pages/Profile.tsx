import { Card, Avatar } from '../components/ui'

export function ProfilePage() {
  return (
    <div className="flex flex-col gap-xl">
      <div><h1 className="font-headline-lg text-headline-lg text-on-surface">Profile</h1><p className="font-body-md text-body-md text-on-surface-variant">Your account information.</p></div>
      <Card className="flex flex-col items-center gap-lg"><Avatar initials="A" size="lg" /><div className="text-center"><h2 className="font-headline-md text-headline-md text-on-surface">Alex</h2><p className="font-body-md text-body-md text-on-surface-variant">alex@example.com</p></div></Card>
      <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
        <Card className="text-center"><p className="font-label-md text-label-md text-on-surface-variant">Total Balance</p><p className="font-headline-md text-headline-md text-on-surface">$452.80</p></Card>
        <Card className="text-center"><p className="font-label-md text-label-md text-on-surface-variant">Groups</p><p className="font-headline-md text-headline-md text-on-surface">5</p></Card>
        <Card className="text-center"><p className="font-label-md text-label-md text-on-surface-variant">Friends</p><p className="font-headline-md text-headline-md text-on-surface">12</p></Card>
      </div>
      <Card><h3 className="mb-lg font-headline-sm text-headline-sm text-on-surface">Recent Activity</h3><div className="flex flex-col gap-md">{[{ icon: 'check_circle', text: 'Mike R. paid you $45.00', time: '2 hours ago' },{ icon: 'arrow_outward', text: 'You paid Tahoe Trip Group $120.00', time: 'Yesterday' },{ icon: 'add_circle', text: 'Added expense "Dinner at Gusto\'s"', time: '2 days ago' }].map((a, i) => (<div key={i} className="flex items-center gap-md rounded-md bg-surface-container-low p-md"><span className="material-symbols-outlined text-on-surface-variant">{a.icon}</span><div className="flex-1"><p className="font-label-md text-label-md text-on-surface">{a.text}</p><p className="font-label-sm text-label-sm text-on-surface-variant">{a.time}</p></div></div>))}</div></Card>
    </div>
  )
}
