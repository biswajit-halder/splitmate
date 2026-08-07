import { Card, Avatar, Badge, Button } from '../components/ui'

const mockGroups = [
  { id: '1', name: 'Europe Summer 2025', icon: 'flight', balance: 240.00, type: 'owed', members: 3, lastActivity: 'Train to Paris • 2h ago' },
  { id: '2', name: 'Apartment 4B', icon: 'home', balance: -45.00, type: 'owe', members: 2, lastActivity: 'Electric Bill • 1d ago' },
  { id: '3', name: 'Weekend Getaway', icon: 'restaurant', balance: 0, type: 'settled', members: 4, lastActivity: "Dinner at Mario's • 3d ago" },
]

export function GroupsPage() {
  return (
    <div className="flex flex-col gap-xl">
      <div className="flex items-center justify-between"><div><h1 className="font-headline-lg text-headline-lg text-on-surface">Groups</h1><p className="font-body-md text-body-md text-on-surface-variant">Manage shared expenses and settle up.</p></div><Button><span className="material-symbols-outlined mr-sm">add</span>Create Group</Button></div>
      <div className="flex gap-sm"><Badge variant="primary">All Groups</Badge><Badge>Active</Badge><Badge>Archived</Badge></div>
      <div className="flex flex-col gap-lg">
        {mockGroups.map(group => (<Card key={group.id} className="flex items-center justify-between"><div className="flex items-center gap-lg"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low"><span className="material-symbols-outlined text-primary-container">{group.icon}</span></div><div><p className="font-label-md text-label-md text-on-surface">{group.name}</p><p className="font-label-sm text-label-sm text-on-surface-variant">{group.lastActivity}</p></div></div><div className="flex items-center gap-lg"><div className="flex -space-x-2">{Array.from({ length: group.members }).map((_, i) => (<Avatar key={i} initials={String.fromCharCode(65 + i)} size="sm" />))}</div><div className="text-right"><p className={`font-label-md text-label-md ${group.type === 'owed' ? 'text-green-600' : group.type === 'owe' ? 'text-error' : 'text-on-surface-variant'}`}>{group.type === 'owed' ? `+$${group.balance.toFixed(2)}` : group.type === 'owe' ? `You owe $${Math.abs(group.balance).toFixed(2)}` : 'Settled Up'}</p><p className="font-label-sm text-label-sm text-on-surface-variant">Your Balance</p></div></div></Card>))}
      </div>
    </div>
  )
}
