'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { C, rollingWords, wordColors } from '../_data';

/**
 * 원비온다 패밀리 히어로 — 롤링 워드가 구글 4색으로 순환 + 4색 점 인디케이터.
 * 한 화면 한 메시지 + 문 두 개 (가벼운 문: 무료 체험 / 큰 문: 시작하기).
 */
// 배경 장식 — 화이트 알파벳 대소문자를 골고루. 가장자리(모바일에도 노출)를 앞에,
// 가운데 쪽은 뒤에 두고 투명도를 낮춰 헤드라인을 방해하지 않게.
const HERO_LETTERS = [
  { ch: 'A', top: '8%', left: '4%', size: 120, rot: -12, op: 0.8 },
  { ch: 'R', top: '35%', left: '7%', size: 84, rot: -8, op: 0.8 },
  { ch: 'b', top: '58%', left: '2%', size: 96, rot: 8, op: 0.8 },
  { ch: 'C', top: '80%', left: '11%', size: 110, rot: 14, op: 0.8 },
  { ch: 'V', top: '16%', left: '87%', size: 140, rot: 10, op: 0.8 },
  { ch: 'K', top: '48%', left: '92%', size: 100, rot: -10, op: 0.8 },
  { ch: 'o', top: '72%', left: '89%', size: 82, rot: -6, op: 0.8 },
  { ch: 'E', top: '4%', left: '30%', size: 72, rot: 16, op: 0.6 },
  { ch: 'd', top: '7%', left: '57%', size: 64, rot: -8, op: 0.6 },
  { ch: 'u', top: '38%', left: '23%', size: 58, rot: -14, op: 0.5 },
  { ch: 'Q', top: '43%', left: '73%', size: 66, rot: 12, op: 0.5 },
  { ch: 'w', top: '88%', left: '38%', size: 72, rot: 6, op: 0.7 },
  { ch: 'a', top: '90%', left: '61%', size: 66, rot: -12, op: 0.7 },
  { ch: 'y', top: '86%', left: '81%', size: 88, rot: -14, op: 0.8 },
];

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
    <section className="ak-hero" style={{ background: C.sky, padding: '100px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* 배경 알파벳 레이어 — 화이트로 살짝만 */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {HERO_LETTERS.map((letter, i) => (
          <span
            key={i}
            className="ak-display ak-hero-letter"
            style={{
              position: 'absolute',
              top: letter.top,
              left: letter.left,
              fontSize: letter.size,
              color: `rgba(255,255,255,${letter.op})`,
              transform: `rotate(${letter.rot}deg)`,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {letter.ch}
          </span>
        ))}
      </div>
      <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 'clamp(15px, 1.6vw, 19px)', fontWeight: 700, color: C.gray, marginBottom: 20 }}>
          중고등 영어 단어 암기, 올킬보카
        </p>

        <h1 className="ak-hero-title ak-display" style={{ fontSize: 'clamp(34px, 5.5vw, 62px)', color: C.ink, lineHeight: 1.3, letterSpacing: '-1px', marginBottom: 28, wordBreak: 'keep-all' }}>
          <span
            style={{
              display: 'inline-block',
              color: wordColors[index],
              transition: 'opacity 0.22s ease, transform 0.22s ease',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(14px)',
            }}
          >
            {rollingWords[index]}
          </span>{' '}
          단어,<br />
          알아서 전부 외워집니다<span style={{ color: C.blue }}>.</span>
        </h1>

        <p className="ak-subfont" style={{ fontSize: 'clamp(17px, 2vw, 23px)', color: C.gray, lineHeight: 1.75, marginBottom: 44, wordBreak: 'keep-all' }}>
          <b style={{ color: C.ink, fontWeight: 700 }}>진짜 시험에 나온 문장</b>으로 외우고,<br />
          통과 못 하면 다음 단계로 못 넘어가요.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#price" className="ak-btn ak-btn-primary">
            지금 시작하기
          </a>
          <Link href="/signup" className="ak-btn ak-btn-ghost">
            7일 무료 체험
          </Link>
        </div>

        <p style={{ marginTop: 18, fontSize: 13, color: C.grayLight }}>
          가입 후 7일간 보카 전체 무료 · 카드 등록 없음
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
