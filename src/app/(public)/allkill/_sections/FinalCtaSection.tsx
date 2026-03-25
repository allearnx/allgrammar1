import AllkillPayButton from '@/components/public/allkill-pay-button';
import { C } from '../_data';

export default function FinalCtaSection({ vocaCourseId, vocaCoursePrice }: { vocaCourseId?: string; vocaCoursePrice?: number }) {
  return (
    <section className="allkill-final-cta" style={{ background: C.lavender, padding: '100px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(91,33,182,0.2)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, color: 'white', marginBottom: 16, lineHeight: 1.3 }}>
          지금 바로<br /><span style={{ color: '#FEF08A' }}>올킬보카 시작</span>하세요
        </h2>
        <p style={{ fontSize: 'clamp(16px, 1.5vw, 20px)', color: 'rgba(255,255,255,0.75)', marginBottom: 40, lineHeight: 1.7 }}>
          언제든 취소 가능.<br />수능 영어 단어, 이번엔 진짜로 끝냅니다.
        </p>
        <div style={{ maxWidth: 320, margin: '0 auto' }}>
          <AllkillPayButton courseId={vocaCourseId} price={vocaCoursePrice} />
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          이미 구독 중이신가요?{' '}
          <a href="https://voca.allrounderenglish.co.kr/login" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}>바로 접속하기</a>
        </p>
      </div>
    </section>
  );
}
