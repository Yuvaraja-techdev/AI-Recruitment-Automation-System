import { Users, User, BarChart3 } from 'lucide-react'

const LoadingSkeleton = ({ type = 'table' }) => {
  if (type === 'details') {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl">
        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-surface-100 shadow-card">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-surface-200 flex-shrink-0" />
            <div className="flex-1 w-full space-y-2.5">
              <div className="h-6 bg-surface-200 rounded-md w-1/3" />
              <div className="h-4 bg-surface-200 rounded-md w-1/2" />
            </div>
          </div>
        </div>

        {/* Decision Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 w-2/3">
            <div className="h-4 bg-surface-200 rounded-md w-1/4" />
            <div className="h-3 bg-surface-200 rounded-md w-full" />
          </div>
          <div className="h-10 bg-surface-200 rounded-xl w-32 flex-shrink-0" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-card space-y-4">
            <div className="h-5 bg-surface-200 rounded-md w-1/3 mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-200 flex-shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-3 bg-surface-200 rounded-md w-1/4" />
                  <div className="h-4 bg-surface-200 rounded-md w-3/4" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-card space-y-4">
            <div className="h-5 bg-surface-200 rounded-md w-1/3 mb-4" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5, 6].map((i) => (
                <div key={i} className="h-8 bg-surface-200 rounded-lg w-20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'analytics') {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-200" />
          <div className="space-y-2">
            <div className="h-6 bg-surface-200 rounded-md w-32" />
            <div className="h-4 bg-surface-200 rounded-md w-48" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-surface-100 shadow-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-200 flex-shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-5 bg-surface-200 rounded-md w-1/2" />
                <div className="h-3 bg-surface-200 rounded-md w-2/3" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-surface-100 shadow-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-200" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-surface-200 rounded-md w-28" />
                  <div className="h-3 bg-surface-200 rounded-md w-40" />
                </div>
              </div>
              <div className="h-64 bg-surface-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-surface-150 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-surface-200" />
              <div className="w-16 h-5 bg-surface-200 rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-surface-200 rounded-md w-3/4" />
              <div className="h-3 bg-surface-200 rounded-md w-full" />
            </div>
            <div className="h-4 bg-surface-200 rounded-md w-1/4 pt-2 border-t border-surface-100" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'timeline') {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl">
        <div className="bg-white border border-surface-150 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-surface-100">
            <div className="space-y-2 w-1/2">
              <div className="h-5 bg-surface-200 rounded-md w-1/3" />
              <div className="h-4 bg-surface-200 rounded-md w-1/2" />
            </div>
            <div className="h-8 bg-surface-200 rounded-lg w-24" />
          </div>
          <div className="space-y-6 relative pl-6">
            <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-surface-100" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 relative">
                <div className="absolute -left-7 top-0.5 w-3.5 h-3.5 rounded-full bg-surface-200" />
                <div className="space-y-1.5 w-full">
                  <div className="h-4 bg-surface-200 rounded-md w-32" />
                  <div className="h-3 bg-surface-200 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Default: Table skeleton
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-surface-200 w-10 h-10" />
        <div className="space-y-1.5">
          <div className="h-6 bg-surface-200 rounded-md w-32" />
          <div className="h-4 bg-surface-200 rounded-md w-24" />
        </div>
      </div>

      {/* Filter bar Skeleton */}
      <div className="flex gap-3">
        <div className="h-10 bg-surface-200 rounded-xl flex-1" />
        <div className="h-10 bg-surface-200 rounded-xl w-44" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
        <div className="border-b border-surface-100 p-4 bg-surface-50/50">
          <div className="h-4 bg-surface-200 rounded-md w-full" />
        </div>
        <div className="divide-y divide-surface-100 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-8 h-8 rounded-full bg-surface-200 flex-shrink-0" />
                <div className="h-4 bg-surface-200 rounded-md w-full" />
              </div>
              <div className="h-4 bg-surface-200 rounded-md w-1/5" />
              <div className="h-4 bg-surface-200 rounded-md w-1/6" />
              <div className="h-6 bg-surface-200 rounded-full w-16" />
              <div className="h-8 bg-surface-200 rounded-lg w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingSkeleton
