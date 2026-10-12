'use client';

import { useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import { VocaBrandStyle } from '@/components/voca/voca-brand';

/**
 * public 모드 완료 게이트 — 5분 투자를 끝낸 사람에게 "결과 받을 연락처"를 받는다 (value-first).
 * 주 동선 = 이름+휴대폰 (마찰 최소, 리드 확보). 가입은 결과 화면에서 이어서 유도.
 */
export function ContactGateScreen({ onSubmitContact }: { onSubmitContact: (name: string, phone: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const valid = name.trim().length >= 1 && /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmitContact(name.trim(), phone.trim());
    } catch {
      // fetchWithToast already toasted
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <VocaBrandStyle />
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <h2 className="voca-display text-2xl" style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}>
          우리 아이 진단 결과가 준비됐어요
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray, wordBreak: 'keep-all' }}>
          <b style={{ color: VOCA_COLORS.ink }}>지금 시작할 교재</b>와 단어 정답률이 나왔어요.
          <br />
          리포트 받으실 학부모님 연락처를 남겨주세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-left">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="학부모님 성함"
            maxLength={30}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-gray-500"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="학부모님 휴대폰 번호 (010-0000-0000)"
            maxLength={13}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            disabled={!valid || submitting}
            className="w-full rounded-full py-3.5 text-center text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: VOCA_COLORS.blue }}
          >
            {submitting ? '결과 확인 중…' : '진단 결과 바로 보기'}
          </button>
        </form>
        <p className="mt-3 text-xs" style={{ color: VOCA_COLORS.gray }}>
          연락처는 진단 리포트 안내와 학습 상담 목적으로만 사용해요.
        </p>
      </div>
      <Link
        href="/signup?next=/student/voca/diagnostic"
        onClick={() => track('diagnostic_gate_signup_click')}
        className="inline-block text-sm font-semibold text-gray-500 underline underline-offset-4 hover:text-gray-700"
      >
        또는 10초 가입하고 결과 보기
      </Link>
    </div>
  );
}
