/**
 * 인증 페이지(가입/로그인) 공용 브랜드 배경 — /allkill 톤.
 * - GmarketSans 제목 폰트 + 노란 CTA 클래스 (auth-display / auth-cta) 주입
 * - 파스텔 하늘 위에 알파벳을 전체에 골고루 흩뿌려 "알파벳 카펫" 느낌
 *   (카드는 이 레이어 위에 z-index로 올라간다)
 * 위치/회전 고정값이라 hydration 안전.
 */

// 페이지 전체에 흩뿌리는 알파벳 (상·중·하단 골고루, 카드 아래에도 보이도록)
const LETTERS = [
  { ch: 'A', top: '5%', left: '6%', size: 108, rot: -12, op: 0.7 },
  { ch: 'V', top: '9%', left: '86%', size: 122, rot: 9, op: 0.7 },
  { ch: 'E', top: '3%', left: '46%', size: 66, rot: 14, op: 0.55 },
  { ch: 'k', top: '17%', left: '24%', size: 58, rot: -10, op: 0.5 },
  { ch: 'o', top: '20%', left: '68%', size: 70, rot: -6, op: 0.55 },
  { ch: 'R', top: '31%', left: '4%', size: 84, rot: -8, op: 0.7 },
  { ch: 'Q', top: '35%', left: '90%', size: 92, rot: 10, op: 0.65 },
  { ch: 'a', top: '30%', left: '52%', size: 54, rot: 16, op: 0.4 },
  { ch: 'b', top: '52%', left: '2%', size: 96, rot: 8, op: 0.7 },
  { ch: 'y', top: '48%', left: '94%', size: 78, rot: -12, op: 0.6 },
  { ch: 'd', top: '46%', left: '38%', size: 52, rot: -8, op: 0.35 },
  { ch: 'C', top: '70%', left: '8%', size: 104, rot: 14, op: 0.7 },
  { ch: 'V', top: '66%', left: '78%', size: 72, rot: -6, op: 0.55 },
  { ch: 'u', top: '64%', left: '48%', size: 50, rot: 12, op: 0.35 },
  { ch: 'w', top: '84%', left: '30%', size: 76, rot: 6, op: 0.6 },
  { ch: 'K', top: '82%', left: '64%', size: 92, rot: -10, op: 0.65 },
  { ch: 'o', top: '90%', left: '12%', size: 66, rot: -14, op: 0.55 },
  { ch: 'A', top: '92%', left: '88%', size: 84, rot: 10, op: 0.6 },
  { ch: 'e', top: '94%', left: '48%', size: 58, rot: -8, op: 0.45 },
];

export function AuthBrandBg() {
  return (
    <>
      <style suppressHydrationWarning>{`
        @font-face { font-family: 'GmarketSans'; font-weight: 700; src: url('/fonts/GmarketSansBold.woff') format('woff'); font-display: swap; }
        @font-face { font-family: 'GmarketSans'; font-weight: 500; src: url('/fonts/GmarketSansMedium.woff') format('woff'); font-display: swap; }
        .auth-display { font-family: 'GmarketSans', 'Pretendard', sans-serif; }
        .auth-cta { background: #FDD663; color: #1F1F1F; box-shadow: 0 6px 20px rgba(253,214,99,0.5); }
        .auth-cta:hover:not(:disabled) { transform: translateY(-2px); }
        .auth-letter { position: absolute; font-family: 'GmarketSans', sans-serif; font-weight: 700; color: rgba(255,255,255,0.9); user-select: none; pointer-events: none; line-height: 1; }
      `}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {LETTERS.map((l, i) => (
          <span
            key={i}
            className="auth-letter"
            style={{ top: l.top, left: l.left, fontSize: l.size, transform: `rotate(${l.rot}deg)`, opacity: l.op }}
          >
            {l.ch}
          </span>
        ))}
      </div>
    </>
  );
}
