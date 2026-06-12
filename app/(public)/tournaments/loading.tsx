import { Skeleton } from '@/components/ui/Skeleton';

function TournamentCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <div className="h-1 w-full bg-zinc-800" />
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-5 w-4/5 rounded" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full shrink-0" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-48 rounded" />
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-8 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TournamentsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Skeleton className="h-12 w-64 rounded mb-3" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      <div className="mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-wrap gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-lg" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <TournamentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
