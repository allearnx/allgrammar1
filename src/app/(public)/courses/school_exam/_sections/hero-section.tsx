import type { CSSProperties } from 'react';

interface HeroSectionProps {
  nanumPenFamily: string;
}

export function HeroSection({ nanumPenFamily }: HeroSectionProps) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center pt-[100px] md:pt-[130px] px-5 md:px-6 pb-[60px] md:pb-20 bg-white">
      <div className="max-w-[800px]">
        <div className="sinaesin-anim inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-400/20 text-indigo-700 px-[18px] py-1.5 rounded-full text-[0.78rem] font-bold mb-10">
          ✦ ���라영 × 올인내신
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
        <p className="sinaesin-anim text-[clamp(1.6rem,4vw,2.8rem)] font-black text-violet-400 tracking-[-1.5px] mb-10 [animation-delay:0.16s]">
          그것도 아주 잘.
        </p>

        <div className="sinaesin-proof sinaesin-serif sinaesin-anim relative inline-block text-[0.85rem] font-bold text-[#8a6a2a] px-6 md:px-14 py-4 md:py-5 mb-3.5 [animation-delay:0.2s]">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-7">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[1.15rem] font-bold text-[#7a5a1a] tracking-[0.08em] whitespace-nowrap">수강생 95% · 95점 달성</span>
              <span className="text-xs font-normal text-[#b8966a] tracking-[0.1em] whitespace-nowrap">STUDENT ACHIEVEMENT</span>
            </div>
            <div className="hidden md:block w-[5px] h-[5px] rounded-full bg-[#c9a84c] shrink-0" />
            <div className="md:hidden w-6 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent shrink-0" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[1.15rem] font-bold text-[#7a5a1a] tracking-[0.08em] whitespace-nowrap">2026 동탄국제고 합격</span>
              <span className="text-xs font-normal text-[#b8966a] tracking-[0.1em] whitespace-nowrap">DONGTAN INTERNATIONAL HIGH</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
