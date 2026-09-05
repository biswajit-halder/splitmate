import { Skeleton } from '../ui'

export function GroupsSkeleton() {
  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton width={160} height={32} />
          <Skeleton width={280} height={20} className="mt-sm" />
        </div>
        <Skeleton width={120} height={40} className="rounded-xl" />
      </div>

      <div className="flex items-center gap-md">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton variant="circular" width={40} height={40} />
      </div>

      <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface rounded-xl border border-line/40 p-lg">
            <div className="flex items-center gap-md mb-md">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1">
                <Skeleton width="70%" height={20} />
                <Skeleton width="40%" height={14} className="mt-sm" />
              </div>
            </div>
            <Skeleton width="50%" height={16} />
          </div>
        ))}
      </div>
    </div>
  )
}
