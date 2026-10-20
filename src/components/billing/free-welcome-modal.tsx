'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Gift, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FREE_SERVICE_INFO, otherFreeService, type FreeServiceKey } from '@/lib/billing/free-service-info';

/** 학생·서비스별로 한 번만 — 기기를 바꾸면 한 번 더 뜰 수 있다 (다른 안내 팝업과 같은 방식) */
export function freeWelcomeSeenKey(service: FreeServiceKey, userId: string) {
  return `free-welcome-seen:${service}:${userId}`;
}

/**
 * 무료 학생이 서비스에 처음 들어왔을 때 환영 + 사용법 + 무료 범위 + 다른 서비스 추천.
 * 시작한 서비스(올킬보카/올인내신)에 맞는 문구가 뜬다.
 */
export function FreeWelcomeModal({ service, userId, userName }: {
  service: FreeServiceKey;
  userId: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const info = FREE_SERVICE_INFO[service];
  const other = FREE_SERVICE_INFO[otherFreeService(service)];
  const key = freeWelcomeSeenKey(service, userId);

  useEffect(() => {
    try {
      if (!localStorage.getItem(key)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(true);
      }
    } catch { /* 저장소를 못 쓰면 띄우지 않는다 */ }
  }, [key]);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {info.label}에 오신 걸 환영해요, {userName}님! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">{info.tagline}</DialogDescription>
        </DialogHeader>

        <ol className="space-y-2 my-1">
          {info.steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3 rounded-lg bg-brand-50 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <Gift className="h-3.5 w-3.5" /> 무료로 이만큼 쓸 수 있어요
          </p>
          <ul className="mt-1.5 space-y-0.5 text-xs text-amber-900">
            {info.freeScopeDetail.map((line) => <li key={line}>· {line}</li>)}
          </ul>
        </div>

        <Link
          href={other.href}
          onClick={close}
          className="group flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary/40 hover:bg-gray-50"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-gray-800">{other.label}도 무료로 써 보세요</span>
            <span className="block text-xs text-gray-500">{other.freeScope}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Button onClick={close} className="w-full">
          {info.label} 시작하기
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
