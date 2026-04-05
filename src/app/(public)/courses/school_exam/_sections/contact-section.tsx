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
          className="inline-flex items-center gap-2.5 mt-9 px-9 py-4 rounded-xl text-base font-bold text-white transition-all hover:translate-y-[-1px]"
        >
          <span className="bg-indigo-950 px-9 py-4 rounded-xl shadow-[0_4px_20px_rgba(30,27,75,0.18)] inline-block">
            문의하기 &rarr;
          </span>
        </ConsultationLink>
        <p className="mt-4 text-[0.8rem] text-slate-400">평일 AM 10:00 – PM 5:00 · 주말·공휴일 휴무</p>
      </div>
    </section>
  );
}
