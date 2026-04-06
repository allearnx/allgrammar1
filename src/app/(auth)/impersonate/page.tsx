'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ImpersonatePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function handleImpersonate() {
      const hash = window.location.hash;
      if (!hash) {
        setError(true);
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setError(true);
        return;
      }

      const supabase = createClient();
      const { error: err } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (err) {
        setError(true);
      } else {
        router.replace('/student');
      }
    }

    handleImpersonate();
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
