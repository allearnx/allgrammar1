interface HeroSectionProps {
  nanumPenFamily: string;
}

// 알파벳 카펫 — 올킬보카 히어로와 같은 문법 (거긴 하늘색+흰 글자, 여긴 아이보리+골드).
// 가장자리(모바일에도 노출)는 진하게 앞에, 가운데 쪽은 연하게 — 헤드라인 방해 금지.
const HERO_LETTERS = [
  { ch: 'A', top: '8%', left: '4%', size: 120, rot: -12, op: 0.16 },
  { ch: 'R', top: '35%', left: '7%', size: 84, rot: -8, op: 0.16 },
  { ch: 'b', top: '58%', left: '2%', size: 96, rot: 8, op: 0.16 },
  { ch: 'C', top: '80%', left: '11%', size: 110, rot: 14, op: 0.16 },
  { ch: 'V', top: '16%', left: '87%', size: 140, rot: 10, op: 0.16 },
  { ch: 'K', top: '48%', left: '92%', size: 100, rot: -10, op: 0.16 },
  { ch: 'o', top: '72%', left: '89%', size: 82, rot: -6, op: 0.16 },
  { ch: 'E', top: '4%', left: '30%', size: 72, rot: 16, op: 0.1 },
  { ch: 'd', top: '7%', left: '57%', size: 64, rot: -8, op: 0.1 },
  { ch: 'u', top: '38%', left: '23%', size: 58, rot: -14, op: 0.08 },
  { ch: 'Q', top: '43%', left: '73%', size: 66, rot: 12, op: 0.08 },
  { ch: 'w', top: '88%', left: '38%', size: 72, rot: 6, op: 0.12 },
  { ch: 'a', top: '90%', left: '61%', size: 66, rot: -12, op: 0.12 },
  { ch: 'y', top: '86%', left: '81%', size: 88, rot: -14, op: 0.16 },
];

export function HeroSection({ nanumPenFamily }: HeroSectionProps) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center pt-[100px] md:pt-[130px] px-5 md:px-6 pb-[60px] md:pb-20 bg-[#FBF6EA] relative overflow-hidden">
      {/* 배경 알파벳 레이어 — 골드로 살짝만 */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {HERO_LETTERS.map((letter, i) => (
          <span
            key={i}
            className="sinaesin-serif absolute select-none font-bold"
            style={{
              top: letter.top,
              left: letter.left,
              fontSize: letter.size,
              color: `rgba(201, 168, 76, ${letter.op})`,
              transform: `rotate(${letter.rot}deg)`,
              lineHeight: 1,
            }}
          >
            {letter.ch}
          </span>
        ))}
      </div>
      <div className="max-w-[800px] relative z-[1]">
        <div className="sinaesin-anim inline-flex items-center gap-1.5 bg-[#E8F0FE] border border-[#1A73E8]/20 text-[#174EA6] px-[18px] py-1.5 rounded-full text-[0.78rem] font-bold mb-10">
          ✦ 올라영 × 올인내신
        </div>
        <p
          className="sinaesin-anim text-[clamp(1.8rem,5vw,2.8rem)] text-slate-500 mb-2 leading-[1.4] [animation-delay:0.08s]"
          style={{ fontFamily: nanumPenFamily }}
        >
          온라인으로 내신이 된다고요?
        </p>
        <h1 className="sinaesin-anim text-[clamp(3rem,8vw,5.5rem)] font-black leading-[1.05] tracking-[-3px] text-indigo-950 mb-1 [animation-delay:0.12s]">
          됩니다.
        </h1>
        <p className="sinaesin-anim text-[clamp(1.6rem,4vw,2.8rem)] font-black text-[#1A73E8] tracking-[-1.5px] mb-10 [animation-delay:0.16s]">
          그것도 아주 잘.
        </p>

        <div className="sinaesin-proof sinaesin-serif sinaesin-anim relative inline-block text-[0.85rem] font-bold text-[#8a6a2a] px-6 md:px-14 py-4 md:py-5 mb-3.5 [animation-delay:0.2s]">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-7">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[1.15rem] font-bold text-[#7a5a1a] tracking-[0.08em] whitespace-nowrap">수강생 95% · 95점 달성</span>
              <span className="text-xs font-normal text-[#8a6a2a] tracking-[0.1em] whitespace-nowrap">STUDENT ACHIEVEMENT</span>
            </div>
            <div className="hidden md:block w-[5px] h-[5px] rounded-full bg-[#c9a84c] shrink-0" />
            <div className="md:hidden w-6 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent shrink-0" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[1.15rem] font-bold text-[#7a5a1a] tracking-[0.08em] whitespace-nowrap">2026 동탄국제고 합격</span>
              <span className="text-xs font-normal text-[#8a6a2a] tracking-[0.1em] whitespace-nowrap">DONGTAN INTERNATIONAL HIGH</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
