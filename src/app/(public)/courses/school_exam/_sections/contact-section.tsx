import ConsultationLink from '@/components/public/consultation-link';

export function ContactSection() {
  return (
    <section className="py-24 px-6 bg-white text-center">
      <div className="max-w-[1000px] mx-auto">
        <div className="inline-block text-[0.7rem] font-bold tracking-[0.12em] text-indigo-700 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-5">
          문의
        </div>
        <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.25] text-indigo-950 mb-4">
          우리 아이한테 맞을지<br />먼저 물어보세요.
        </h2>
        <p className="text-[0.95rem] text-slate-500 leading-[1.85] mx-auto max-w-[520px]">
          커리큘럼, 학습 방식, 현재 수준에서 시작 가능한지 — 무엇이든 편하게 물어보세요.
        </p>
        <ConsultationLink
          className="inline-flex items-center gap-2.5 mt-9 px-10 py-4 rounded-full text-base font-bold text-[#1F1F1F] bg-[#FDD663] shadow-[0_4px_20px_rgba(253,214,99,0.45)] transition-all hover:bg-[#FCC934] hover:translate-y-[-1px]"
        >
          문의하기 &rarr;
        </ConsultationLink>
        <p className="mt-4 text-[0.8rem] text-slate-400">평일 AM 10:00 – PM 5:00 · 주말·공휴일 휴무</p>
      </div>
    </section>
  );
}
