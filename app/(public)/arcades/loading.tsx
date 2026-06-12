import { Skeleton } from '@/components/ui/Skeleton';

function ArcadeCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-full rounded" />
      <Skeleton className="h-3.5 w-4/5 rounded" />
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-5 w-16 rounded-full" />
        ))}
      </div>
      <div className="pt-3 border-t border-zinc-800">
        <Skeleton className="h-3.5 w-44 rounded" />
      </div>
    </div>
  );
}

export default function ArcadesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Skeleton className="h-12 w-40 rounded mb-3" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-lg" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArcadeCardSkeleton key={i} />
          ))}
        </div>

        {/* Map placeholder */}
        <div className="hidden lg:block">
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
