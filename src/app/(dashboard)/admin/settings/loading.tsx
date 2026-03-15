export default function AdminSettingsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header skeleton */}
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: '#E9E1FC' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/50" />
          <div className="space-y-2">
            <div className="h-5 w-24 rounded bg-white/50" />
            <div className="h-3 w-40 rounded bg-white/30" />
          </div>
        </div>
      </div>
      {/* Invite code skeleton */}
      <div className="max-w-2xl rounded-2xl p-6 animate-pulse" style={{ background: '#E9E1FC' }}>
        <div className="h-3 w-16 rounded bg-white/40 mb-3" />
        <div className="h-10 w-48 rounded-lg bg-white/40 mb-2" />
        <div className="h-3 w-60 rounded bg-white/30" />
      </div>
      {/* Form skeleton */}
      <div className="max-w-2xl rounded-xl border bg-white p-5 animate-pulse space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-gray-100" />
          <div className="h-5 w-20 rounded bg-gray-100" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-12 rounded bg-gray-100" />
            <div className="h-10 w-full rounded-lg bg-gray-50" />
          </div>
        ))}
        <div className="h-10 w-24 rounded-[10px] bg-gray-100" />
      </div>
    </div>
  );
}
