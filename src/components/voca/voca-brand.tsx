'use client';

/**
 * 학생 올킬보카 화면 공용 브랜드 요소 — /allkill 랜딩 톤.
 * - GmarketSans 제목 폰트(.voca-display) + 노란 CTA(.voca-cta) 클래스 주입
 * - VocaHeroLetters: 파스텔 하늘 카드 위에 흩뿌리는 화이트 알파벳
 *   (auth-brand-bg의 축소판 — 히어로 카드 높이에 맞게 밀도를 낮춤)
 * 위치/회전 고정값이라 hydration 안전.
 */

// 색 토큰은 서버 안전 모듈에 정의 — 여기서는 클라이언트 편의용 re-export.
// ⚠️ 서버 컴포넌트는 '@/lib/voca/brand-tokens'에서 직접 임포트할 것
// ('use client' 모듈 경유 임포트는 값이 아닌 클라이언트 참조가 되어 undefined).
export { VOCA_COLORS, VOCA_STEP_THEMES } from '@/lib/voca/brand-tokens';

export function VocaBrandStyle() {
  return (
    <style suppressHydrationWarning>{`
      @font-face { font-family: 'GmarketSans'; font-weight: 700; src: url('/fonts/GmarketSansBold.woff') format('woff'); font-display: swap; }
      @font-face { font-family: 'GmarketSans'; font-weight: 500; src: url('/fonts/GmarketSansMedium.woff') format('woff'); font-display: swap; }
      .voca-display { font-family: 'GmarketSans', 'Pretendard', sans-serif; }
      .voca-cta { background: #FDD663; color: #1F1F1F; box-shadow: 0 4px 14px rgba(253,214,99,0.5); transition: transform 0.15s ease, box-shadow 0.15s ease; }
      .voca-cta:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(253,214,99,0.6); }
      .voca-letter { position: absolute; font-family: 'GmarketSans', sans-serif; font-weight: 700; color: rgba(255,255,255,0.85); user-select: none; pointer-events: none; line-height: 1; }
    `}</style>
  );
}

// 히어로 카드용 알파벳 (가장자리 위주 — 제목을 가리지 않게)
const HERO_LETTERS = [
  { ch: 'A', top: '-8%', left: '2%', size: 88, rot: -12, op: 0.8 },
  { ch: 'V', top: '52%', left: '-1%', size: 72, rot: 9, op: 0.7 },
  { ch: 'K', top: '8%', left: '88%', size: 96, rot: 10, op: 0.8 },
  { ch: 'o', top: '62%', left: '93%', size: 58, rot: -8, op: 0.7 },
  { ch: 'b', top: '68%', left: '72%', size: 48, rot: -14, op: 0.5 },
  { ch: 'E', top: '-4%', left: '55%', size: 44, rot: 14, op: 0.5 },
];

// 전체 화면(첫 진입 가이드)용 알파벳 — 골고루 흩뿌림
const FULL_LETTERS = [
  { ch: 'A', top: '4%', left: '5%', size: 96, rot: -12, op: 0.75 },
  { ch: 'V', top: '8%', left: '88%', size: 104, rot: 9, op: 0.75 },
  { ch: 'E', top: '2%', left: '46%', size: 56, rot: 14, op: 0.5 },
  { ch: 'R', top: '32%', left: '3%', size: 72, rot: -8, op: 0.65 },
  { ch: 'Q', top: '38%', left: '91%', size: 80, rot: 10, op: 0.6 },
  { ch: 'b', top: '58%', left: '2%', size: 84, rot: 8, op: 0.65 },
  { ch: 'y', top: '55%', left: '94%', size: 66, rot: -12, op: 0.55 },
  { ch: 'C', top: '82%', left: '7%', size: 88, rot: 14, op: 0.65 },
  { ch: 'w', top: '86%', left: '42%', size: 62, rot: 6, op: 0.5 },
  { ch: 'K', top: '80%', left: '85%', size: 78, rot: -10, op: 0.6 },
];

export function VocaHeroLetters({ variant = 'hero' }: { variant?: 'hero' | 'full' }) {
  const letters = variant === 'full' ? FULL_LETTERS : HERO_LETTERS;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {letters.map((l, i) => (
        <span
          key={i}
          className="voca-letter"
          style={{ top: l.top, left: l.left, fontSize: l.size, transform: `rotate(${l.rot}deg)`, opacity: l.op }}
        >
          {l.ch}
        </span>
      ))}
    </div>
  );
}
