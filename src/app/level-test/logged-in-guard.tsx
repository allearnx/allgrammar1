'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 로그인된 재원생이 공개 레벨테스트에 들어오면 학생용 진단으로 자동 이동.
 *
 * 공개 진단 기록은 리드 테이블(voca_diagnostic_leads)로 빠져 학생 계정 기록과
 * 분리된다 — "진단을 봤는데 기록이 안 보여요" 혼란의 원인 (박태욱, 2026-08-09).
 * 페이지가 ISR 캐시라 서버에서 쿠키를 읽을 수 없어 클라이언트에서 검사한다.
 * 학생 역할만 이동 — 선생님/보스는 퍼널 미리보기를 위해 그대로 둔다.
 */
export function LoggedInStudentGuard() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const sb = createClient();
        const { data } = await sb.auth.getUser();
        if (cancelled || !data.user) return;
        const { data: profile } = await sb.from('users').select('role').eq('id', data.user.id).single();
        if (!cancelled && profile?.role === 'student') {
          router.replace('/student/voca/diagnostic');
        }
      } catch {
        // 비로그인·조회 실패 시 공개 진단 그대로 진행
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  return null;
}
