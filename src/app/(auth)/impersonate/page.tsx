'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ImpersonatePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // createBrowserClient가 URL hash의 access_token을 자동 감지하여 세션 설정
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/student');
      }
    });

    // 5초 내 로그인 안 되면 실패 처리
    const timeout = setTimeout(() => setError(true), 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">로그인 처리에 실패했습니다. 링크를 다시 생성해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
      <p className="text-muted-foreground">학생 계정으로 로그인 중...</p>
    </div>
  );
}
