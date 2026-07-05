'use client';

import { Check, X } from 'lucide-react';

interface PlanComparisonProps {
  showCta?: boolean;
}

interface Row {
  label: string;
  free: boolean | string;
  paid: boolean | string;
}

interface Group {
  category: string;
  rows: Row[];
}

const GROUPS: Group[] = [
  {
    category: '기본',
    rows: [
      { label: '학생 수', free: '5명', paid: '최대 150명' },
      { label: '서비스', free: '둘 다 체험 (보카 3 Day · 내신 1단원)', paid: '올인내신 + 올킬보카 전체' },
    ],
  },
  {
    category: '올인내신',
    rows: [
      { label: '단어 암기', free: true, paid: true },
      { label: '교과서 암기', free: true, paid: true },
      { label: '문법 영상 + AI 챗봇', free: false, paid: true },
      { label: '문제풀이 + AI 채점', free: false, paid: true },
    ],
  },
  {
    category: '올킬보카',
    rows: [
      { label: '1회독 (플래시카드/퀴즈)', free: true, paid: true },
      { label: '2회독 (심화 복습)', free: false, paid: true },
    ],
  },
  {
    category: '학원 관리',
    rows: [
      { label: '통계', free: '기본 숫자', paid: '차트 + 랭킹' },
      { label: '대량 학생 관리', free: false, paid: true },
      { label: '학생 리포트', free: false, paid: true },
    ],
  },
];

function CellValue({ value, highlight = false }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === 'string') {
    return (
      <span className={`text-[13px] font-medium ${highlight ? 'text-[#3182F6]' : 'text-gray-600'}`}>
        {value}
      </span>
    );
  }
  return value ? (
    <div className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${highlight ? 'bg-[#3182F6]/10' : 'bg-emerald-50'}`}>
      <Check className={`h-3.5 w-3.5 ${highlight ? 'text-[#3182F6]' : 'text-emerald-500'}`} />
    </div>
  ) : (
    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-red-50">
      <X className="h-3.5 w-3.5 text-red-400" />
    </div>
  );
}

export function PlanComparison({ showCta: _showCta = false }: PlanComparisonProps) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        {/* 헤더 */}
        <thead>
          <tr>
            <th className="px-5 py-4 text-left text-[13px] font-semibold text-gray-400 w-[45%]">
              기능
            </th>
            <th className="px-4 py-4 text-center text-[13px] font-semibold text-gray-400 w-[27.5%]">
              무료
            </th>
            <th
              className="px-4 py-4 text-center text-[13px] font-bold w-[27.5%]"
              style={{ background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)', color: '#3182F6' }}
            >
              프리미엄
            </th>
          </tr>
        </thead>

        <tbody>
          {GROUPS.map((group) => (
            <>
              {/* 카테고리 헤더 */}
              <tr key={`cat-${group.category}`}>
                <td
                  colSpan={3}
                  className="px-5 pt-5 pb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400"
                  style={{ background: '#FAFAFA' }}
                >
                  {group.category}
                </td>
              </tr>
              {/* 기능 행 */}
              {group.rows.map((row, idx) => (
                <tr
                  key={row.label}
                  className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/50 ${
                    idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'
                  }`}
                >
                  <td className="px-5 py-3.5 text-[13px] text-gray-700">{row.label}</td>
                  <td className="px-4 py-3.5 text-center">
                    <CellValue value={row.free} />
                  </td>
                  <td className="px-4 py-3.5 text-center bg-[#F8FBFF]">
                    <CellValue value={row.paid} highlight />
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
