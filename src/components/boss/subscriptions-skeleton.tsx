export function SubscriptionsSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* 헤더 스켈레톤 */}
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: '#E9D5FF' }}>
        <div className="h-6 w-32 bg-white/40 rounded mb-2" />
        <div className="h-4 w-56 bg-white/30 rounded" />
      </div>
      {/* 스탯 스켈레톤 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-3.5 animate-pulse" style={{ borderLeftWidth: 4 }}>
            <div className="h-3 w-16 bg-gray-100 rounded mb-3" />
            <div className="h-7 w-10 bg-gray-100 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      {/* 테이블 스켈레톤 */}
      <div className="rounded-xl border bg-white p-4 animate-pulse">
        <div className="h-5 w-24 bg-gray-100 rounded mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded mb-2" />
        ))}
      </div>
    </div>
  );
}
