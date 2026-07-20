'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, UserPlus, KeyRound } from 'lucide-react';

// 구글 스타일 규격: 색면 그라데이션 대신 흰 카드 + 블루 틴트 포인트
export function InviteCodeCard({ code, academyName }: { code: string; academyName: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-lg p-1.5" style={{ background: '#E8F0FE', color: '#1A73E8' }}>
          <KeyRound className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {academyName} · 초대 코드
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="rounded-xl px-4 py-2 text-2xl font-mono font-bold tracking-[0.3em]" style={{ background: '#E8F0FE', color: '#174EA6' }}>
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="inline-flex items-center rounded-full px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1A73E8' }}
        >
          {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">학생 가입 시 이 코드를 알려주세요.</p>
        <Link
          href="/admin/guide/students"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors hover:bg-[#D2E3FC]"
          style={{ background: '#E8F0FE', color: '#1A73E8' }}
        >
          <UserPlus className="h-3.5 w-3.5" />
          학생 등록 가이드
        </Link>
      </div>
    </div>
  );
}
