'use client';

import { CountUp } from './motion';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}

export function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* top accent bar — 구글 스타일: 솔리드 컬러바 */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
        style={{ background: color }}
      />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <span
          className="inline-flex items-center justify-center rounded-lg p-1.5"
          style={{ background: `${color}14`, color }}
        >
          {icon}
        </span>
      </div>

      <div className="text-2xl font-bold tracking-tight">
        {typeof value === 'number' ? <CountUp to={value} /> : value}
      </div>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
