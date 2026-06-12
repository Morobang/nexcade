import { Skeleton } from '@/components/ui/Skeleton';

export default function LeaderboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <Skeleton className="h-12 w-64 rounded mb-3" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-lg" />
        ))}
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 sm:gap-6 mb-12 overflow-x-auto min-w-[480px]">
        {/* 2nd */}
        <div className="flex-1 max-w-[220px] bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center gap-3 sm:mb-4">
          <Skeleton className="w-7 h-7 rounded-full" />
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-8 w-12 rounded mt-1" />
        </div>
        {/* 1st */}
        <div className="flex-1 max-w-[220px] bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center gap-3 sm:scale-105">
          <Skeleton className="w-7 h-7 rounded-full" />
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-8 w-12 rounded mt-1" />
        </div>
        {/* 3rd */}
        <div className="flex-1 max-w-[220px] bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center gap-3 sm:mb-4">
          <Skeleton className="w-7 h-7 rounded-full" />
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-8 w-12 rounded mt-1" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <Skeleton className="h-3 w-48 rounded" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0"
          >
            <Skeleton className="h-7 w-8 rounded" />
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="hidden sm:block h-4 w-16 rounded" />
            <Skeleton className="hidden sm:block h-4 w-10 rounded" />
            <Skeleton className="hidden sm:block h-4 w-8 rounded" />
            <Skeleton className="hidden sm:block h-4 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
