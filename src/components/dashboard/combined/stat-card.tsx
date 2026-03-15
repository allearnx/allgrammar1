'use client';

export function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border bg-white p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
