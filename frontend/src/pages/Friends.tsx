import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { friendsApi } from '../lib/api/friends'
import { formatMoney } from '../lib/money'
import { Modal, Button, Skeleton, Badge, EmptyState, BlobAvatar } from '../components/ui'
import { useToast } from '../components/ui'

type Tab = 'friends' | 'requests'

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
  const removeFriend = useMutation((uid: string) => friendsApi.removeFriend(uid))
  const cancelRequest = useMutation((rid: string) => friendsApi.cancelRequest(rid))

  const handleSend = async () => {
    if (!email.trim()) return
    try {
      await send.mutate(email.trim())
      addToast('Friend request sent', 'success')
      setEmail('')
      setAddOpen(false)
      requests.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to send', 'error')
    }
  }

  const doAccept = async (rid: string) => {
    try {
      await accept.mutate(rid)
      addToast('Friend request accepted', 'success')
      requests.refetch()
      friends.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const doReject = async (rid: string) => {
    try {
      await reject.mutate(rid)
      requests.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const doRemoveFriend = async (uid: string) => {
    try {
      await removeFriend.mutate(uid)
      addToast('Friend removed', 'success')
      friends.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to remove friend', 'error')
    }
  }

  const doCancelRequest = async (rid: string) => {
    try {
      await cancelRequest.mutate(rid)
      addToast('Request cancelled', 'success')
      requests.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to cancel request', 'error')
    }
  }

  const incoming = (requests.data?.incoming ?? []).map(r => ({ ...r, direction: 'incoming' as const }))
  const outgoing = (requests.data?.outgoing ?? []).map(r => ({ ...r, direction: 'outgoing' as const }))
  const allRequests = [...incoming, ...outgoing]

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div className="flex items-start justify-between flex-wrap gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Friends</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your connections and settle up easily.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] leading-none">person_add</span> Add Friend
        </Button>
      </div>

      <div className="flex gap-md border-b border-line/40">
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
            <div key={f.id} className="glass-card pressable p-lg">
              <div className="flex items-center gap-md mb-md">
                <BlobAvatar userId={f.id} name={f.name} size={48} />
                <div className="min-w-0">
                  <p className="font-headline-sm text-headline-sm text-on-surface truncate">{f.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{f.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`num rounded-full px-2.5 py-1 font-label-md ${f.balancePaise > 0 ? 'tint-mint' : f.balancePaise < 0 ? 'tint-coral' : 'tint-lilac'}`}>
                  {formatMoney(f.balancePaise)}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => navigate(`/settlements?new=1&payTo=${f.id}&payToName=${encodeURIComponent(f.name)}`)}>Settle Up</Button>
                  <Button variant="danger" onClick={() => doRemoveFriend(f.id)}>Remove</Button>
                </div>
              </div>
            </div>
          ))}
          {!friends.loading && (friends.data?.length ?? 0) === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon="person_add"
                title="No friends yet"
                description="Add friends to start splitting expenses together."
                action={{ label: 'Add Friend', onClick: () => setAddOpen(true) }}
              />
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="flex flex-col gap-md">
          {requests.loading && <Skeleton height={80} />}
          {allRequests.map(r => (
            <div key={r.id} className="bg-surface rounded-xl border border-line/40 p-lg flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
              <div className="flex items-center gap-md">
                <BlobAvatar userId={r.userId} name={r.name} size={40} />
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
                <Button variant="danger" className="px-3 py-1.5 text-[12px]" onClick={() => doCancelRequest(r.id)}>Cancel</Button>
              )}
            </div>
          ))}
          {!requests.loading && allRequests.length === 0 && (
            <div className="bg-surface rounded-xl border border-line/40 p-xl text-center">
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
              className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface"
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
