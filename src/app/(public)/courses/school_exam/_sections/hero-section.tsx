import Link from 'next/link';

// 알파벳 카펫 — 올킬보카 히어로와 동일 배치 (거긴 하늘색, 여긴 연노랑).
// 가장자리(모바일에도 노출)를 앞에, 가운데 쪽은 뒤에 두고 투명도를 낮춰 헤드라인을 방해하지 않게.
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

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center text-center pt-[110px] md:pt-[130px] px-5 md:px-6 pb-16 md:pb-20 bg-[#FDF0C8]">
      {/* 배경 알파벳 레이어 — 화이트로 살짝만 (올킬보카와 동일 문법) */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {HERO_LETTERS.map((letter, i) => (
          <span
            key={i}
            className="brand-display sinaesin-hero-letter absolute select-none font-bold"
            style={{
              top: letter.top,
              left: letter.left,
              fontSize: letter.size,
              color: `rgba(255, 255, 255, ${letter.op})`,
              transform: `rotate(${letter.rot}deg)`,
              lineHeight: 1,
            }}
          >
            {letter.ch}
          </span>
        ))}
      </div>

      <div className="max-w-[880px] relative z-[1]">
        <div className="sinaesin-anim inline-flex items-center gap-1.5 bg-white text-[#1F1F1F] px-6 py-2.5 rounded-full text-[0.9rem] font-extrabold mb-9 shadow-[0_4px_14px_rgba(31,31,31,0.08)]">
          ✦ 올라영 × 올인내신
        </div>

        <p className="brand-display sinaesin-anim font-medium text-[clamp(1.05rem,1.9vw,1.4rem)] text-[#3C4043] mb-4 [animation-delay:0.08s]">
          온라인으로 내신이 된다고요?
        </p>
        <h1 className="brand-display sinaesin-anim font-bold text-[clamp(3.2rem,8vw,5.5rem)] leading-[1.1] tracking-[-2px] text-[#1F1F1F] mb-2 [animation-delay:0.12s]">
          됩니다<span className="text-[#1A73E8]">.</span>
        </h1>
        <p className="brand-display sinaesin-anim font-bold text-[clamp(1.5rem,3.5vw,2.4rem)] tracking-[-1px] text-[#1A73E8] mb-11 [animation-delay:0.16s]">
          그것도 아주 잘.
        </p>

        {/* 성과 밴드 — 구글 색 숫자 (원비온다 스타일) */}
        <div className="sinaesin-anim flex flex-col md:flex-row items-center justify-center gap-5 md:gap-14 mb-11 [animation-delay:0.2s]">
          <div className="flex flex-col items-center gap-0.5">
            <span className="brand-display font-bold text-[clamp(1.5rem,2.6vw,2rem)] text-[#1A73E8]">수강생 95% · 95점</span>
            <span className="text-[0.85rem] font-semibold text-[#3C4043]">내신 성적 달성</span>
          </div>
          <div className="hidden md:block w-px h-10 bg-[#1F1F1F]/10" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="brand-display font-bold text-[clamp(1.5rem,2.6vw,2rem)] text-[#188038]">동탄국제고 합격</span>
            <span className="text-[0.85rem] font-semibold text-[#3C4043]">2026학년도</span>
          </div>
        </div>

        {/* 문 두 개 — 큰 문(노랑) / 가벼운 문(흰색) */}
        <div className="sinaesin-anim flex flex-col md:flex-row gap-3.5 justify-center items-center [animation-delay:0.24s]">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center w-full max-w-[340px] md:w-auto px-11 py-[18px] rounded-full text-[1.05rem] font-extrabold bg-[#FDD663] text-[#1F1F1F] shadow-[0_6px_20px_rgba(253,214,99,0.5)] transition-all hover:-translate-y-0.5"
          >
            무료로 체험하기
          </Link>
          <a
            href="#curriculum"
            className="inline-flex items-center justify-center w-full max-w-[340px] md:w-auto px-11 py-[18px] rounded-full text-[1.05rem] font-extrabold bg-white text-[#1F1F1F] border-[1.5px] border-[#E8EAED] shadow-[0_4px_16px_rgba(31,31,31,0.06)] transition-all hover:-translate-y-0.5"
          >
            커리큘럼 보기
          </a>
        </div>
        <p className="sinaesin-anim mt-5 text-[0.82rem] text-[#9AA0A6] [animation-delay:0.28s]">
          가입하면 딱 1과 무료 체험 · 카드 등록 없음
        </p>
      </div>
    </section>
  );
}
