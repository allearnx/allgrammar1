'use client';

import {
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip,
} from 'recharts';

interface Props {
  data: { date: string; score: number }[];
  color?: string;
  height?: number;
}

export function MiniScoreTrend({ data, color = '#7C3AED', height = 64 }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed" style={{ height }}>
        <p className="text-xs text-gray-400">아직 데이터가 없어요</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, padding: '4px 8px' }}
          formatter={(value) => [`${value}점`]}
          labelFormatter={() => ''}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color.replace('#', '')})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
