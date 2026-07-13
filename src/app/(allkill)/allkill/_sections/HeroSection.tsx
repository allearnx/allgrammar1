import Link from 'next/link';
import { C, rollingWords } from '../_data';
import { RollingWord } from './RollingWord';

/** 한 화면 한 메시지 — 한 줄 약속 + 문 두 개 (가벼운 문: 무료 체험 / 큰 문: 시작하기) */
export default function HeroSection() {
  return (
    <section className="ak-hero" style={{ background: C.sky, padding: '110px 24px 90px', textAlign: 'center' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <p style={{ fontSize: 'clamp(15px, 1.6vw, 19px)', fontWeight: 700, color: C.gray, marginBottom: 20 }}>
          중고등 영어 단어 암기 프로그램 올킬보카
        </p>

        <h1 className="ak-hero-title" style={{ fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 900, color: C.ink, lineHeight: 1.22, letterSpacing: '-1px', marginBottom: 28, wordBreak: 'keep-all' }}>
          <RollingWord words={rollingWords} color={C.blue} /> 단어,<br />
          이제 올킬.
        </h1>

        <p style={{ fontSize: 'clamp(16px, 1.8vw, 21px)', color: C.gray, lineHeight: 1.7, marginBottom: 44, wordBreak: 'keep-all' }}>
          외울 때까지 안 놓아주는 7단계 통과 시스템.<br />
          진짜 시험에 나온 문장으로 외웁니다.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" className="ak-btn ak-btn-ghost">
            Day 3개 무료 체험
          </Link>
          <a href="#price" className="ak-btn ak-btn-primary">
            지금 시작하기
          </a>
        </div>

        <p style={{ marginTop: 18, fontSize: 13, color: C.grayLight }}>
          가입만 하면 바로 체험 · 카드 등록 없음
        </p>
      </div>
    </section>
  );
}
