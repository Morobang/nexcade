import { Skeleton } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="w-24 h-24 rounded-full shrink-0" />
          <div className="flex flex-col gap-3 flex-1 items-center sm:items-start">
            <Skeleton className="h-9 w-48 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-56 rounded" />
            <div className="flex gap-3 mt-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-8 w-10 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <Skeleton className="h-5 w-36 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0">
            <Skeleton className="h-6 w-8 rounded" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-5 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
