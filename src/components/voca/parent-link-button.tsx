'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Heart, Loader2 } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { withShareVersion } from '@/lib/share-url';

/**
 * 학부모 리포트 링크 버튼 — 학생이 직접 발급 (셀프스터디 핵심 기능).
 * get-or-create라 여러 번 눌러도 같은 링크 (부모가 저장한 링크 유지).
 */
export function ParentLinkButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const data = await fetchWithToast<{ token: string | null }>('/api/parent-share', {
        body: {},
        errorMessage: '링크 발급에 실패했어요. 잠시 후 다시 시도해주세요.',
      });
      if (!data.token) throw new Error('no token');
      // 보카 홈에서 발급하는 링크 → 올킬보카 탭이 바로 열리고 카톡 미리보기도 올킬보카 이미지
      const url = withShareVersion(`${window.location.origin}/parent/${data.token}?tab=voca`);

      // 모바일: 공유 시트 / 데스크탑: 클립보드 복사
      if (navigator.share) {
        try {
          await navigator.share({ title: '올킬보카 성적표', url });
          return;
        } catch { /* 공유 취소 → 복사로 폴백 */ }
      }
      await navigator.clipboard.writeText(url);
      toast.success('학부모 리포트 링크가 복사됐어요 — 엄마·아빠께 보내주세요! 💌', { duration: 5000 });
    } catch {
      // fetchWithToast가 에러 토스트 표시
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-accent disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Heart className="h-3 w-3" />}
      학부모 리포트
    </button>
  );
}
