import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-zinc-800 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-none mx-1" />
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-8 w-10 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Loyalty card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-3.5 w-full rounded mb-1" />
        <Skeleton className="h-3.5 w-3/4 rounded mb-4" />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="flex-1 h-2 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
