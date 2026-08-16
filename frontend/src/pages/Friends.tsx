import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { friendsApi } from '../lib/api/friends'
import { formatMoney } from '../lib/money'
import { Modal, Button, Skeleton, Badge } from '../components/ui'
import { useToast } from '../components/ui'

type Tab = 'friends' | 'requests'

function initial(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function FriendsPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [tab, setTab] = useState<Tab>('friends')
  const [addOpen, setAddOpen] = useState(false)
  const [email, setEmail] = useState('')

  const friends = useApi(() => friendsApi.list())
  const requests = useApi(() => friendsApi.requests())

  const send = useMutation((e: string) => friendsApi.send(e))
  const accept = useMutation((rid: string) => friendsApi.accept(rid))
  const reject = useMutation((rid: string) => friendsApi.reject(rid))

  const handleSend = async () => {
    if (!email.trim()) return
    try {
      await send.mutate(email.trim())
      addToast('Friend request sent', 'success')
      setEmail('')
      setAddOpen(false)
      requests.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to send', 'error' as never)
    }
  }

  const doAccept = async (rid: string) => {
    try {
      await accept.mutate(rid)
      addToast('Friend request accepted', 'success')
      requests.refetch()
      friends.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error' as never)
    }
  }

  const doReject = async (rid: string) => {
    try {
      await reject.mutate(rid)
      requests.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error' as never)
    }
  }

  const incoming = (requests.data?.incoming ?? []).map(r => ({ ...r, direction: 'incoming' as const }))
  const outgoing = (requests.data?.outgoing ?? []).map(r => ({ ...r, direction: 'outgoing' as const }))
  const allRequests = [...incoming, ...outgoing]

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div className="flex items-start justify-between flex-wrap gap-md">
        <div>
          <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Friends</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your connections and settle up easily.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <span className="material-symbols-outlined text-[18px]">person_add</span> Add Friend
        </Button>
      </div>

      <div className="flex gap-md border-b border-outline-variant/30">
        <button
          onClick={() => setTab('friends')}
          className={`pb-md font-label-md text-label-md ${tab === 'friends' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}`}
        >
          Friends ({friends.data?.length ?? 0})
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`pb-md font-label-md text-label-md ${tab === 'requests' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}`}
        >
          Requests {incoming.length > 0 && <Badge variant="warning">{incoming.length}</Badge>}
        </button>
      </div>

      {tab === 'friends' && (
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
          {friends.loading && <Skeleton height={120} />}
          {(friends.data ?? []).map(f => (
            <div key={f.id} className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
              <div className="flex items-center gap-md mb-md">
                <div className={`w-12 h-12 rounded-full ${f.avatarBg ?? 'bg-surface-container'} flex items-center justify-center font-label-md text-label-md text-on-surface`}>
                  {f.initials}
                </div>
                <div className="min-w-0">
                  <p className="font-headline-sm text-headline-sm text-on-surface truncate">{f.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{f.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-label-md text-label-md ${f.balancePaise > 0 ? 'text-success' : f.balancePaise < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                  {formatMoney(f.balancePaise)}
                </span>
                <Button variant="secondary" onClick={() => navigate('/settlements')}>Settle Up</Button>
              </div>
            </div>
          ))}
          {!friends.loading && (friends.data?.length ?? 0) === 0 && (
            <div className="bg-surface rounded-xl border border-outline-variant/20 p-xl text-center col-span-full">
              <p className="font-headline-sm text-headline-sm text-on-surface mb-xs">No friends yet</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Add friends to split expenses together.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="flex flex-col gap-md">
          {requests.loading && <Skeleton height={80} />}
          {allRequests.map(r => (
            <div key={r.id} className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-label-md text-label-md text-on-surface">
                  {initial(r.name)}
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{r.name}</p>
                  <Badge variant={r.direction === 'incoming' ? 'primary' : 'warning'}>{r.direction}</Badge>
                </div>
              </div>
              {r.direction === 'incoming' ? (
                <div className="flex gap-sm">
                  <Button variant="secondary" onClick={() => doReject(r.id)}>Decline</Button>
                  <Button onClick={() => doAccept(r.id)}>Accept</Button>
                </div>
              ) : (
                <span className="font-body-sm text-body-sm text-on-surface-variant">Pending</span>
              )}
            </div>
          ))}
          {!requests.loading && allRequests.length === 0 && (
            <div className="bg-surface rounded-xl border border-outline-variant/20 p-xl text-center">
              <p className="font-headline-sm text-headline-sm text-on-surface">No requests</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Friend">
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Friend's email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface"
            />
          </div>
          <div className="flex justify-end gap-md">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={send.loading}>Send Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
