import { Skeleton } from '@/components/ui/Skeleton';

export default function ArcadeProfileLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-28 rounded" />
      </div>

      {/* Hero banner */}
      <Skeleton className="h-48 sm:h-64 w-full rounded-2xl mb-6" />

      {/* Game badges */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-8 w-10 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            ))}
          </div>

          {/* About */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>

          {/* Tournaments header */}
          <div>
            <Skeleton className="h-9 w-60 rounded mb-6" />
            <div className="flex flex-col gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex gap-4">
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-16 rounded" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                  </div>
                  <div className="sm:border-l border-zinc-800 sm:pl-4 flex sm:flex-col gap-4 items-center sm:min-w-[90px]">
                    <Skeleton className="h-8 w-14 rounded" />
                    <Skeleton className="h-8 w-14 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
            <Skeleton className="h-5 w-20 rounded" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-44 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
