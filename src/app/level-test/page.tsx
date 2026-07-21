import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBandBooks } from '@/lib/voca/diagnostic-sampling';
import { BAND_KEYS } from '@/lib/voca/diagnostic-bands';
import { DiagnosticClient } from '@/app/(dashboard)/student/voca/diagnostic/diagnostic-client';

export const metadata: Metadata = {
  title: '어휘 레벨 진단 | 올킬보카',
  description: '가입 없이 5분 만에 내 어휘 레벨과 학년 단어를 몇 % 아는지 확인하세요.',
};

// 밴드 구성은 자주 안 바뀐다 — 5분 ISR (문항은 클라이언트에서 매 라운드 동적 요청)
export const revalidate = 300;

/**
 * 비로그인 어휘 레벨 진단 (value-first 퍼널).
 * 학년 선택 → 진단 완주까지 가입 없음. 결과 직전 게이트에서만 가입 유도 —
 * 5분을 투자한 사람은 결과를 보려고 가입한다. 완료분은 가입 후 자동 제출된다.
 */
export default async function LevelTestPage() {
  const admin = createAdminClient();
  const bandBooks = await getBandBooks(admin);
  const activeBands = BAND_KEYS.filter((k) => bandBooks[k].length > 0);

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/allkill" className="text-lg font-extrabold" style={{ color: '#1A73E8' }}>
            올킬보카
          </Link>
          <span className="text-sm font-semibold text-gray-400">무료 어휘 레벨 진단</span>
        </div>
      </header>
      <main className="px-4 py-8 md:py-12">
        <DiagnosticClient
          mode="public"
          activeBands={activeBands}
          bandBooks={bandBooks}
          latest={null}
          tookToday={false}
          prevVocabIds={[]}
          isFree
        />
      </main>
    </div>
  );
}
