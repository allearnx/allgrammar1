'use client';

/**
 * 학생 수 선택 → 가격 → 결제 박스 (클래스카드식 모달 선택, 2026-07-20 사장님 지시).
 * 박스에는 현재 선택(학생 수·월 요금)과 [학생 수 변경] 버튼만 — 누르면 라디오 목록 모달.
 * 구글 팔레트(디자인 정책: 보라 금지) — /pricing(공개)과 /admin/billing 공용.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { track } from '@vercel/analytics';

export interface SeatPlan {
  id: string;
  min_students: number | null;
  price_per_unit: number;
}

const KAKAO_URL = 'http://pf.kakao.com/_iLxcLG/chat';
const G = { blue: '#1A73E8', blueLight: '#E8F0FE', yellow: '#FDD663', ink: '#1F1F1F' };

export function SeatPicker({ plans, cta }: { plans: SeatPlan[]; cta: 'signup' | 'upgrade' | 'contact' }) {
  const sorted = plans
    .filter((p): p is SeatPlan & { min_students: number } => p.price_per_unit > 0 && p.min_students != null)
    .sort((a, b) => a.min_students - b.min_students);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? '');
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState(selectedId);
  const selected = sorted.find((p) => p.id === selectedId) ?? sorted[0];

  // 모달 열릴 때 현재 선택으로 초기화 + ESC 닫기
  useEffect(() => {
    if (!open) return;
    setPendingId(selectedId);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!selected) return null;

  const perStudent = Math.round(selected.price_per_unit / selected.min_students);

  function confirmSelection() {
    setSelectedId(pendingId);
    setOpen(false);
    const p = sorted.find((x) => x.id === pendingId);
    if (p) track('academy_seat_pick', { seats: p.min_students });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* 현재 선택 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">학생 수</span>
        <span className="flex items-center gap-3">
          <span className="brand-display text-lg font-extrabold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {selected.min_students}명
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors hover:bg-[#E8F0FE]"
            style={{ borderColor: G.blue, color: G.blue }}
          >
            학생 수 변경
          </button>
        </span>
      </div>

      <div className="mt-4 flex items-baseline justify-between rounded-xl px-5 py-4" style={{ background: G.blueLight }}>
        <span className="text-sm font-semibold text-gray-600">월 요금</span>
        <span className="text-right">
          <span className="brand-display text-2xl font-extrabold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {selected.price_per_unit.toLocaleString()}원
          </span>
          <span className="block text-xs text-gray-500">1인당 {perStudent.toLocaleString()}원</span>
        </span>
      </div>

      <div className="mt-5">
        {cta === 'signup' && (
          <Link
            href="/signup?role=admin&next=/pricing"
            className="block w-full rounded-full py-3.5 text-center text-base font-bold transition-opacity hover:opacity-90"
            style={{ background: G.yellow, color: G.ink }}
          >
            가입하고 이 플랜으로 시작하기
          </Link>
        )}
        {cta === 'upgrade' && (
          <Link
            href={`/admin/upgrade?planId=${selected.id}`}
            className="block w-full rounded-full py-3.5 text-center text-base font-bold transition-opacity hover:opacity-90"
            style={{ background: G.yellow, color: G.ink }}
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

      {/* 학생 수 선택 모달 (클래스카드식 라디오 목록) */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="학생 수 선택"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="relative px-6 pt-6 pb-3 text-center">
              <h3 className="text-lg font-bold" style={{ color: G.ink }}>이용할 학생 수를 선택하세요</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-5 overflow-hidden rounded-xl border border-gray-200">
              <div className="grid grid-cols-2 px-5 py-2.5 text-sm font-bold text-white" style={{ background: G.blue }}>
                <span>학생 수</span>
                <span className="text-right">월 요금</span>
              </div>
              <div className="max-h-[380px] overflow-y-auto">
                {sorted.map((p) => {
                  const active = p.id === pendingId;
                  return (
                    <label
                      key={p.id}
                      className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-gray-100 px-5 py-3 text-[15px] transition-colors ${active ? '' : 'hover:bg-gray-50'}`}
                      style={active ? { background: G.blueLight } : undefined}
                    >
                      <input
                        type="radio"
                        name="seat-plan"
                        checked={active}
                        onChange={() => setPendingId(p.id)}
                        className="h-4 w-4 accent-[#1A73E8]"
                      />
                      <span className={`font-semibold ${active ? 'text-gray-900' : 'text-gray-700'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {p.min_students}명
                      </span>
                      <span className={`text-right font-bold ${active ? 'text-gray-900' : 'text-gray-700'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {p.price_per_unit.toLocaleString()}원
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-5">
              <button
                type="button"
                onClick={confirmSelection}
                className="block w-full rounded-full py-3 text-center text-base font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: G.blue }}
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
