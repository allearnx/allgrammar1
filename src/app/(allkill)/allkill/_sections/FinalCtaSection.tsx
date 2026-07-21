import Link from 'next/link';
import { C } from '../_data';

/** 최종 CTA — 히어로와 같은 문 두 개를 한 번 더 */
export default function FinalCtaSection() {
  return (
    <section style={{ background: C.blue, padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 className="ak-display" style={{ fontSize: 'clamp(28px, 3.8vw, 48px)', color: 'white', marginBottom: 16, lineHeight: 1.35, wordBreak: 'keep-all' }}>
          영어 단어,<br />이번엔 진짜 끝내요.
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.6vw, 19px)', color: 'rgba(255,255,255,0.8)', marginBottom: 40, lineHeight: 1.7 }}>
          언제든 취소 가능 · 첫 7일 보카 전체 무료
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" className="ak-btn" style={{ background: 'rgba(255,255,255,0.14)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            7일 무료 체험
          </Link>
          <a href="#price" className="ak-btn ak-btn-primary">
            지금 시작하기
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
          이미 구독 중이신가요?{' '}
          <a href="https://voca.allrounderenglish.co.kr/login" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}>바로 접속하기</a>
        </p>
      </div>
    </section>
  );
}
