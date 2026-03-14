'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: { date: string; score: number; label?: string }[];
  title: string;
  color?: string;
  height?: number;
}

export function ScoreTrendChart({ data, title, color = '#7C3AED', height = 280 }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8" style={{ height }}>
        <p className="text-2xl mb-2">📊</p>
        <p className="text-sm text-gray-400">아직 데이터가 없어요</p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    dateLabel: d.date.slice(5), // MM-DD
  }));

  const gradientId = `gradient-${color.replace('#', '')}`;

  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
            formatter={(value) => [`${value}점`, '점수']}
            labelFormatter={(label) => `${label}`}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
