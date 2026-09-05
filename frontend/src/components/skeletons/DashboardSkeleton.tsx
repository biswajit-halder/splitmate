import { Skeleton } from '../ui'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-xl max-w-content">
      {/* Header */}
      <div>
        <Skeleton width={200} height={32} />
        <Skeleton width={320} height={20} className="mt-sm" />
      </div>

      {/* Hero balance card */}
      <div className="bg-surface rounded-xl border border-line/40 p-lg md:p-xl">
        <div className="flex items-center gap-md">
          <Skeleton variant="circular" width={56} height={56} />
          <div className="flex-1">
            <Skeleton width={120} height={16} />
            <Skeleton width={160} height={40} className="mt-sm" />
          </div>
        </div>
      </div>

      {/* Supporting cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <div className="bg-surface rounded-xl border border-line/40 p-md">
          <div className="flex items-center gap-md">
            <Skeleton variant="circular" width={40} height={40} />
            <div>
              <Skeleton width={80} height={14} />
              <Skeleton width={100} height={24} className="mt-sm" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-line/40 p-md">
          <div className="flex items-center gap-md">
            <Skeleton variant="circular" width={40} height={40} />
            <div>
              <Skeleton width={80} height={14} />
              <Skeleton width={100} height={24} className="mt-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity + Groups panels */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div className="bg-surface rounded-xl border border-line/40 p-lg">
          <Skeleton width={140} height={24} className="mb-lg" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-md mb-md">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1">
                <Skeleton width="70%" height={16} />
                <Skeleton width="40%" height={14} className="mt-sm" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-surface rounded-xl border border-line/40 p-lg">
          <Skeleton width={120} height={24} className="mb-lg" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-md mb-md">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1">
                <Skeleton width="60%" height={16} />
              </div>
              <Skeleton width={60} height={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
