'use client';

/**
 * 학생 수 선택 → 가격 표시 → 결제 위젯 (클래스카드식, 2026-07-20 사장님 지시).
 * 구글 팔레트(디자인 정책: 보라 금지) — /pricing(공개)과 /admin/billing 공용.
 * cta:
 *  - 'signup': 비로그인 → 가입으로 (가입 후 /pricing 복귀)
 *  - 'upgrade': 무료 학원장 → 해당 플랜 결제 페이지로
 *  - 'contact': 이미 유료 → 플랜 변경은 카톡 문의
 */
import { useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';

export interface SeatPlan {
  id: string;
  min_students: number | null;
  price_per_unit: number;
}

const KAKAO_URL = 'http://pf.kakao.com/_iLxcLG/chat';

export function SeatPicker({ plans, cta }: { plans: SeatPlan[]; cta: 'signup' | 'upgrade' | 'contact' }) {
  const sorted = plans
    .filter((p): p is SeatPlan & { min_students: number } => p.price_per_unit > 0 && p.min_students != null)
    .sort((a, b) => a.min_students - b.min_students);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? '');
  const selected = sorted.find((p) => p.id === selectedId) ?? sorted[0];

  if (!selected) return null;

  const perStudent = Math.round(selected.price_per_unit / selected.min_students);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <label htmlFor="seat-select" className="block text-sm font-bold text-gray-800 mb-2">
        이용할 학생 수를 선택하세요
      </label>
      <select
        id="seat-select"
        value={selected.id}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-base font-semibold text-gray-900 focus:border-[#1A73E8] focus:outline-none focus:ring-4 focus:ring-[#E8F0FE]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {sorted.map((p) => (
          <option key={p.id} value={p.id}>
            {p.min_students}명 — 월 {p.price_per_unit.toLocaleString()}원
          </option>
        ))}
      </select>

      <div className="mt-5 flex items-baseline justify-between rounded-xl px-5 py-4" style={{ background: '#E8F0FE' }}>
        <span className="text-sm font-semibold text-gray-600">월 요금</span>
        <span className="text-right">
          <span className="text-2xl font-extrabold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {selected.price_per_unit.toLocaleString()}원
          </span>
          <span className="block text-xs text-gray-500">1인당 {perStudent.toLocaleString()}원</span>
        </span>
      </div>

      <div className="mt-5">
        {cta === 'signup' && (
          <Link
            href="/signup?role=admin&next=/pricing"
            onClick={() => track('academy_seat_pick', { seats: selected.min_students })}
            className="block w-full rounded-full py-3.5 text-center text-base font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#1A73E8' }}
          >
            가입하고 이 플랜으로 시작하기
          </Link>
        )}
        {cta === 'upgrade' && (
          <Link
            href={`/admin/upgrade?planId=${selected.id}`}
            onClick={() => track('academy_seat_pick', { seats: selected.min_students })}
            className="block w-full rounded-full py-3.5 text-center text-base font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#1A73E8' }}
          >
            {selected.min_students}명 · 월 {selected.price_per_unit.toLocaleString()}원 결제하기
          </Link>
        )}
        {cta === 'contact' && (
          <a
            href={KAKAO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-full py-3.5 text-center text-base font-bold transition-opacity hover:opacity-90"
            style={{ background: '#FEE500', color: '#3C1E1E' }}
          >
            플랜 변경은 카톡으로 문의하기
          </a>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">부가세 포함 월 구독 · 언제든 플랜 변경/해지 가능</p>
    </div>
  );
}
