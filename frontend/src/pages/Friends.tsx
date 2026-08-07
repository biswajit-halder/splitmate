import { Card, Avatar, Badge, Button } from '../components/ui'

const mockFriends = [
  { id: '1', name: 'Sarah Jenkins', email: 'sarah.j@example.com', balance: 124.50, type: 'owed', mutualGroups: ['R', 'T'], lastActivity: "Dinner at Luigi's • 4h ago" },
  { id: '2', name: 'Marcus Reed', email: 'm.reed@example.com', balance: -85.00, type: 'owe', mutualGroups: ['H'], lastActivity: 'Concert Tickets • 2d ago' },
  { id: '3', name: 'David Chen', email: 'david.c@example.com', balance: 0, type: 'settled', mutualGroups: [], lastActivity: 'Settled Balance • 1w ago' },
]

export function FriendsPage() {
  return (
    <div className="flex flex-col gap-xl">
      <div className="flex items-center justify-between"><div><h1 className="font-headline-lg text-headline-lg text-on-surface">Friends</h1><p className="font-body-md text-body-md text-on-surface-variant">Manage your connections and mutual balances.</p></div><Button><span className="material-symbols-outlined mr-sm">person_add</span>Add Friend</Button></div>
      <div className="flex gap-sm"><Badge variant="primary">All Friends</Badge><Badge>You Owe</Badge><Badge>Owe You</Badge><Badge>Settled</Badge></div>
      <div className="flex flex-col gap-md">
        {mockFriends.map(friend => (<Card key={friend.id}><div className="flex items-center justify-between"><div className="flex items-center gap-lg"><Avatar initials={friend.name.split(' ').map(n => n[0]).join('')} /><div><p className="font-label-md text-label-md text-on-surface">{friend.name}</p><p className="font-label-sm text-label-sm text-on-surface-variant">{friend.email}</p></div></div><div className="text-right"><p className={`font-label-md text-label-md ${friend.type === 'owed' ? 'text-green-600' : friend.type === 'owe' ? 'text-error' : 'text-on-surface-variant'}`}>{friend.type === 'owed' ? `Owes you $${friend.balance.toFixed(2)}` : friend.type === 'owe' ? `You owe $${Math.abs(friend.balance).toFixed(2)}` : 'Settled up'}</p></div></div></Card>))}
      </div>
    </div>
  )
}
