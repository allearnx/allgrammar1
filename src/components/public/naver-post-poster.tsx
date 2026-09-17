/**
 * 네이버 블로그 글 카드용 생성 썸네일 (16:9).
 *
 * 네이버 RSS 썸네일은 인스타 정사각형(365×365, 글자 박힌 이미지)이라 16:9 칸에서 위아래 글자가
 * 잘린다 (2026-09-17 사장님 피드백). 원본 이미지 대신 제목·카테고리로 포스터를 그려 카드 톤을
 * 통일한다 — 코드로 그리므로 새 글도 자동으로 같은 디자인.
 *
 * 색은 카테고리별로 구글 4색 라이트 틴트 순환 (같은 카테고리 = 같은 색).
 */

const THEMES = [
  { bg: '#E8F0FE', ink: '#174EA6', accent: '#1A73E8', letter: 'rgba(26,115,232,0.10)' },   // 파랑
  { bg: '#FEF7E0', ink: '#B06000', accent: '#F9AB00', letter: 'rgba(249,171,0,0.14)' },    // 노랑
  { bg: '#E6F4EA', ink: '#0D652D', accent: '#188038', letter: 'rgba(24,128,56,0.10)' },    // 초록
  { bg: '#FCE8E6', ink: '#A50E0E', accent: '#D93025', letter: 'rgba(217,48,37,0.09)' },    // 빨강
];

// 배경 장식 알파벳 — 히어로 카펫과 같은 문법, 카드 크기에 맞춰 3개만
const LETTERS = [
  { ch: 'A', top: '-18%', left: '-4%', size: 150, rot: -12 },
  { ch: 'b', top: '40%', left: '78%', size: 120, rot: 10 },
  { ch: 'y', top: '55%', left: '38%', size: 90, rot: -8 },
];

function hashCategory(category: string): number {
  let h = 0;
  for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % THEMES.length;
}

interface NaverPostPosterProps {
  title: string;
  category: string;
}

export function NaverPostPoster({ title, category }: NaverPostPosterProps) {
  const theme = THEMES[hashCategory(category)];
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: theme.bg }}
      aria-hidden
    >
      {LETTERS.map((l, i) => (
        <span
          key={i}
          className="brand-display absolute select-none font-bold leading-none"
          style={{
            top: l.top,
            left: l.left,
            fontSize: l.size,
            color: theme.letter,
            transform: `rotate(${l.rot}deg)`,
          }}
        >
          {l.ch}
        </span>
      ))}

      {/* 네이버 배지 + 카테고리 — 상단 한 줄 (제목과 안 겹치게) */}
      <div className="absolute top-3.5 left-4 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#03C75A] text-white shadow-sm">
          <span className="font-black">N</span> 네이버
        </span>
        {category && (
          <span
            className="inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white/85"
            style={{ color: theme.ink }}
          >
            {category}
          </span>
        )}
      </div>

      {/* 제목 — 포스터 본체 */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-10">
        <p
          className="brand-display font-bold text-[1.25rem] leading-[1.35] tracking-[-0.3px] line-clamp-3 break-keep"
          style={{ color: '#1F1F1F' }}
        >
          {title}
        </p>
      </div>

      {/* 워드마크 */}
      <span className="brand-display absolute top-3.5 right-4 text-[13px] font-bold tracking-tight">
        <span style={{ color: '#1A73E8' }}>올</span>
        <span style={{ color: '#D93025' }}>라</span>
        <span style={{ color: '#188038' }}>영</span>
      </span>

      {/* 하단 액센트 라인 */}
      <span className="absolute left-0 right-0 bottom-0 h-1" style={{ background: theme.accent }} />
    </div>
  );
}
