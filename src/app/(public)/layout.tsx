import type { Metadata } from 'next';
import PublicHeader from '@/components/public/header';
import PublicFooter from '@/components/public/footer';
import { ConsultationModalProvider } from '@/components/public/consultation-modal-context';
import { getUser } from '@/lib/auth/helpers';

export const metadata: Metadata = {
  title: '올라영 | 중고등·국제학교 영어 내신·어휘·문법 AI 학습',
  description:
    '중고등·국제학교 영어 완전 정복. 내신·어휘·문법 AI 맞춤 학습 + 25년 경력 원장 직강. 강남 기출 분석 기반으로 1등급 도전하세요.',
  alternates: { canonical: 'https://www.allrounderenglish.co.kr' },
  openGraph: {
    title: '올라영 | 중고등·국제학교 영어 내신·어휘·문법 AI 학습',
    description: '중고등·국제학교 영어 완전 정복. 내신·어휘·문법 AI 맞춤 학습.',
    url: 'https://www.allrounderenglish.co.kr',
    siteName: '올라영',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser().catch(() => null);

  return (
    <ConsultationModalProvider>
      <main className="min-h-screen bg-white">
        <PublicHeader isLoggedIn={!!user} />
        {children}
        <PublicFooter />
      </main>
      <a
        href="http://pf.kakao.com/_iLxcLG/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE500] shadow-lg hover:shadow-xl transition-shadow"
        aria-label="카카오톡 문의"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36-.14.49-.88 3.13-.91 3.35 0 0-.02.17.09.23.1.07.23.03.23.03.3-.04 3.52-2.3 4.07-2.7.7.1 1.42.15 2.16.15 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#3C1E1E"/>
        </svg>
      </a>
    </ConsultationModalProvider>
  );
}
