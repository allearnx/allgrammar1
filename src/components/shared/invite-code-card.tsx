'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, UserPlus } from 'lucide-react';

export function InviteCodeCard({ code, academyName }: { code: string; academyName: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white"
      style={{ background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 50%, #174EA6 100%)' }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
        {academyName} · 초대 코드
      </span>
      <div className="mt-2 flex items-center gap-3">
        <code className="text-2xl font-mono font-bold tracking-[0.3em]">{code}</code>
        <button
          onClick={handleCopy}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        >
          {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-white/60">
          학생 가입 시 이 코드를 알려주세요.
        </p>
        <Link
          href="/admin/guide/students"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:bg-white/25"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        >
          <UserPlus className="h-3.5 w-3.5" />
          학생 등록 가이드
        </Link>
      </div>
    </div>
  );
}
