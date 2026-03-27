'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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
      style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
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
      <p className="mt-2 text-xs text-white/60">
        학생 가입 시 이 코드를 알려주세요.
      </p>
    </div>
  );
}
