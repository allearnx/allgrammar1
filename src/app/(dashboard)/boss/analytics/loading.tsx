export default function BossAnalyticsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header skeleton */}
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: '#E9E1FC' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/50" />
          <div className="space-y-2">
            <div className="h-5 w-24 rounded bg-white/50" />
            <div className="h-3 w-48 rounded bg-white/30" />
          </div>
        </div>
      </div>
      {/* Stat cards skeleton */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-white p-3.5 animate-pulse"
            style={{ borderLeftWidth: 4, borderLeftColor: '#E5E7EB' }}
          >
            <div className="h-3 w-16 rounded bg-gray-100 mb-3" />
            <div className="h-7 w-12 rounded bg-gray-100 mb-1" />
            <div className="h-3 w-20 rounded bg-gray-50" />
          </div>
        ))}
      </div>
      {/* Subscription pills skeleton */}
      <div className="rounded-xl border bg-white p-5 animate-pulse">
        <div className="h-4 w-24 rounded bg-gray-100 mb-4" />
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-gray-50" />
          ))}
        </div>
      </div>
      {/* Academy table skeleton */}
      <div className="rounded-xl border bg-white p-5 animate-pulse">
        <div className="h-4 w-28 rounded bg-gray-100 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-50" />
            <div className="ml-auto h-2.5 w-24 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="rounded-xl border bg-white p-5 animate-pulse">
        <div className="h-4 w-28 rounded bg-gray-100 mb-4" />
        <div className="h-52 w-full rounded-lg bg-gray-50" />
      </div>
    </div>
  );
}
