import type { Metadata } from 'next';
import Link from 'next/link';
import FooterSection from './allkill/_sections/FooterSection';

export const metadata: Metadata = {
  title: '올킬보카 | 영어 단어, 알아서 전부 외워집니다',
  description:
    '중간고사부터 수능까지, 7단계 통과 시스템으로 진짜 내 단어를 만드세요. 실제 기출 문장으로 외우고, 학부모 리포트로 확인합니다.',
  alternates: { canonical: 'https://www.allrounderenglish.co.kr/allkill' },
  openGraph: {
    title: '올킬보카 | 영어 단어, 알아서 전부 외워집니다',
    description: '7단계 통과 시스템 + 실제 기출 문장. 영어 단어, 이번엔 진짜 끝내요.',
    url: 'https://www.allrounderenglish.co.kr/allkill',
    siteName: '올킬보카',
    locale: 'ko_KR',
    type: 'website',
  },
};

/**
 * 올킬보카 전용 레이아웃 — 학원(올라영) 메뉴 없이 미니 헤더만.
 * 랜딩 방문자가 학원 사이트로 새지 않고 체험/구매 동선에 머물게 한다.
 */
export default function AllkillLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', background: 'white' }}>
      {/* 원비온다 패밀리 제목 폰트 — 본문은 Pretendard 유지 */}
      <style suppressHydrationWarning>{`
        @font-face {
          font-family: 'GmarketSans';
          font-weight: 700;
          src: url('/fonts/GmarketSansBold.woff') format('woff');
          font-display: swap;
        }
        @font-face {
          font-family: 'GmarketSans';
          font-weight: 500;
          src: url('/fonts/GmarketSansMedium.woff') format('woff');
          font-display: swap;
        }
        .ak-display { font-family: 'GmarketSans', 'Pretendard', sans-serif; font-weight: 700; }
      `}</style>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* 원비온다 패밀리 멀티컬러 워드마크 */}
          <Link href="/allkill" className="ak-display" style={{ fontSize: 22, letterSpacing: '-0.5px', textDecoration: 'none' }}>
            <span style={{ color: '#1A73E8' }}>올</span>
            <span style={{ color: '#D93025' }}>킬</span>
            <span style={{ color: '#F9AB00' }}>보</span>
            <span style={{ color: '#188038' }}>카</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href="https://voca.allrounderenglish.co.kr/login"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, fontWeight: 700, color: '#5F6368', padding: '10px 14px', borderRadius: 12, textDecoration: 'none' }}
            >
              로그인
            </a>
            <Link
              href="/signup"
              style={{ fontSize: 14, fontWeight: 800, color: '#1F1F1F', background: '#FDD663', padding: '10px 18px', borderRadius: 12, textDecoration: 'none' }}
            >
              무료 체험
            </Link>
          </div>
        </div>
      </header>
      {children}
      <FooterSection />
      <a
        href="http://pf.kakao.com/_iLxcLG/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE500] shadow-lg hover:shadow-xl transition-shadow"
        aria-label="카카오톡 문의"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36-.14.49-.88 3.13-.91 3.35 0 0-.02.17.09.23.1.07.23.03.23.03.3-.04 3.52-2.3 4.07-2.7.7.1 1.42.15 2.16.15 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#3C1E1E"/>
        </svg>
      </a>
    </main>
  );
}
