'use client';

import { Check, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PlanComparisonProps {
  showCta?: boolean;
}

const ROWS = [
  { label: '학생 수', free: '5명', paid: '플랜별' },
  { label: '서비스', free: '학원당 1개', paid: '올인내신 + 올킬보카' },
  { label: '내신 단어암기', free: true, paid: true },
  { label: '내신 교과서암기', free: true, paid: true },
  { label: '내신 문법영상', free: false, paid: true },
  { label: '내신 문제풀이', free: false, paid: true },
  { label: '올킬보카 1회독', free: true, paid: true },
  { label: '올킬보카 2회독', free: false, paid: true },
  { label: '통계', free: '기본 숫자', paid: '차트 + 랭킹' },
  { label: '대량 관리', free: false, paid: true },
  { label: '학생 리포트', free: false, paid: true },
] as const;

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-gray-700">{value}</span>;
  }
  return value ? (
    <Check className="h-5 w-5 text-green-500 mx-auto" />
  ) : (
    <X className="h-5 w-5 text-gray-300 mx-auto" />
  );
}

export function PlanComparison({ showCta = true }: PlanComparisonProps) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 font-semibold text-gray-700">기능</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">무료</th>
              <th className="px-4 py-3 text-center font-semibold" style={{ color: '#7C3AED' }}>
                프리미엄
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t">
                <td className="px-4 py-2.5 text-sm text-gray-600">{row.label}</td>
                <td className="px-4 py-2.5 text-center">
                  <CellValue value={row.free} />
                </td>
                <td className="px-4 py-2.5 text-center">
                  <CellValue value={row.paid} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCta && (
        <div className="text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
          >
            <Sparkles className="h-4 w-4" />
            요금제 보기
          </Link>
        </div>
      )}
    </div>
  );
}
