import { Card, Badge } from '../components/ui'

export function NotificationsPage() {
  return (
    <div className="flex flex-col gap-xl">
      <div><h1 className="font-headline-lg text-headline-lg text-on-surface">Notifications</h1><p className="font-body-md text-body-md text-on-surface-variant">Stay updated on your financial activity.</p></div>
      <div className="flex gap-sm"><Badge variant="primary">All</Badge><Badge>Unread</Badge></div>
      <div className="flex flex-col gap-md">
        {[{ icon: 'receipt_long', text: 'New expense "Dinner at Mario\'s" added to Europe Summer 2025', time: '2 hours ago', read: false },{ icon: 'check_circle', text: 'Mike R. paid you $45.00 via Venmo', time: '5 hours ago', read: false },{ icon: 'group', text: 'You were added to "Apartment 4B"', time: '1 day ago', read: true },{ icon: 'payments', text: 'Settlement reminder: Sarah J. owes you $120.00', time: '2 days ago', read: true },{ icon: 'person_add', text: 'David Chen accepted your friend request', time: '3 days ago', read: true }].map((n, i) => (<Card key={i} className={`flex items-center gap-md ${!n.read ? 'border-l-4 border-primary' : ''}`}><span className="material-symbols-outlined text-on-surface-variant">{n.icon}</span><div className="flex-1"><p className="font-label-md text-label-md text-on-surface">{n.text}</p><p className="font-label-sm text-label-sm text-on-surface-variant">{n.time}</p></div>{!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}</Card>))}
      </div>
    </div>
  )
}
