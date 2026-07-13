'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { C, rollingWords, wordColors } from '../_data';

/**
 * 원비온다 패밀리 히어로 — 롤링 워드가 구글 4색으로 순환 + 4색 점 인디케이터.
 * 한 화면 한 메시지 + 문 두 개 (가벼운 문: 무료 체험 / 큰 문: 시작하기).
 */
export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % rollingWords.length);
        setVisible(true);
      }, 220);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="ak-hero" style={{ background: C.sky, padding: '100px 24px 80px', textAlign: 'center' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <p style={{ fontSize: 'clamp(15px, 1.6vw, 19px)', fontWeight: 700, color: C.gray, marginBottom: 20 }}>
          중고등 영어 단어 암기, 올킬보카
        </p>

        <h1 className="ak-hero-title" style={{ fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 900, color: C.ink, lineHeight: 1.22, letterSpacing: '-1px', marginBottom: 28, wordBreak: 'keep-all' }}>
          <span
            style={{
              display: 'inline-block',
              color: wordColors[index],
              minWidth: '4ch',
              transition: 'opacity 0.22s ease, transform 0.22s ease',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(14px)',
            }}
          >
            {rollingWords[index]}
          </span>{' '}
          단어,<br />
          이제 올킬<span style={{ color: C.blue }}>.</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 1.8vw, 21px)', color: C.gray, lineHeight: 1.7, marginBottom: 44, wordBreak: 'keep-all' }}>
          <b style={{ color: C.ink }}>진짜 시험에 나온 문장</b>으로 외우고,<br />
          통과 못 하면 다음 단계로 못 넘어가요.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#price" className="ak-btn ak-btn-primary">
            지금 시작하기
          </a>
          <Link href="/signup" className="ak-btn ak-btn-ghost">
            Day 3개 무료 체험
          </Link>
        </div>

        <p style={{ marginTop: 18, fontSize: 13, color: C.grayLight }}>
          가입만 하면 바로 체험 · 카드 등록 없음
        </p>

        {/* 롤링 워드 인디케이터 — 구글 4색 점 */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 28 }}>
          {rollingWords.map((word, i) => (
            <span
              key={word}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: wordColors[i],
                opacity: i === index ? 1 : 0.3,
                transition: 'opacity 0.3s',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
