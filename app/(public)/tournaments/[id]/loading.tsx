import { Skeleton } from '@/components/ui/Skeleton';

export default function TournamentDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
        <div className="h-2 w-full bg-zinc-800" />
        <div className="p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-9 w-3/4 rounded" />
            </div>
            <Skeleton className="h-7 w-16 rounded-full shrink-0" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-zinc-800/50 rounded-xl p-3 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
            ))}
          </div>

          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>

      {/* Details sections */}
      <div className="flex flex-col gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
