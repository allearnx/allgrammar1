'use client';

import { useEffect, useState } from 'react';

/** 결제선생식 롤링 워드 — 단어가 주기적으로 페이드 전환 */
export function RollingWord({ words, color }: { words: string[]; color: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setVisible(true);
      }, 220);
    }, 2000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <span
      style={{
        display: 'inline-block',
        color,
        minWidth: '4ch',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
      }}
    >
      {words[index]}
    </span>
  );
}
