'use client';

import { useEffect } from 'react';

/** 무활동 자동 로그아웃 기준 — 3시간 (2026-08-09 사장님 요청, 전 역할 공통) */
const IDLE_MS = 3 * 60 * 60 * 1000;
const KEY = 'olra:last_activity_at';
/** 활동 기록은 30초에 한 번만 저장 — 이벤트마다 쓰면 낭비 */
const WRITE_THROTTLE_MS = 30_000;

/**
 * 무활동 자동 로그아웃 — 학원 공용 기기에 계정이 열린 채 방치되는 것 방지.
 * 클릭/키보드/터치 활동 시각을 localStorage에 기록(탭 간 공유)하고,
 * 1분마다 + 탭 복귀 시 검사해 3시간 넘게 활동이 없으면 로그아웃 후 /login으로.
 */
export function IdleLogout() {
  useEffect(() => {
    let lastWrite = 0;
    const touch = () => {
      const now = Date.now();
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;
      try { localStorage.setItem(KEY, String(now)); } catch { /* ignore */ }
    };

    let loggingOut = false;
    const check = async () => {
      if (loggingOut) return;
      let last = 0;
      try { last = Number(localStorage.getItem(KEY)) || 0; } catch { /* ignore */ }
      if (!last) { touch(); return; }
      if (Date.now() - last <= IDLE_MS) return;
      loggingOut = true;
      try {
        const { createClient } = await import('@/lib/supabase/client');
        await createClient().auth.signOut();
      } catch { /* 로그아웃 실패해도 이동 — 미들웨어가 재차 막는다 */ }
      window.location.href = '/login';
    };

    touch();
    check();
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
    for (const e of events) window.addEventListener(e, touch, { passive: true });
    const interval = setInterval(check, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      for (const e of events) window.removeEventListener(e, touch);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
