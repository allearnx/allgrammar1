import ConsultationLink from '@/components/public/consultation-link';

export function ContactSection() {
  return (
    <section className="py-16 md:py-24 px-5 md:px-6 bg-[#F8F9FA] text-center">
      <div className="max-w-[880px] mx-auto">
        <span className="inline-block bg-white text-[#174EA6] text-[clamp(0.9rem,1.5vw,1.05rem)] font-extrabold px-6 py-2.5 rounded-full mb-5 shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
          문의
        </span>
        <h2 className="brand-display font-bold text-[clamp(1.65rem,3.5vw,2.6rem)] leading-[1.35] tracking-[-0.5px] text-[#1F1F1F] break-keep">
          우리 아이한테 맞을지<br /><span className="text-[#1A73E8]">먼저 물어보세요.</span>
        </h2>
        <p className="brand-display font-medium text-[clamp(1.05rem,1.9vw,1.35rem)] text-[#3C4043] leading-[1.8] mt-4 mx-auto max-w-[680px] break-keep">
          커리큘럼, 학습 방식, 현재 수준에서 시작 가능한지 — 무엇이든 편하게 물어보세요.
        </p>
        <ConsultationLink
          className="inline-flex items-center gap-2.5 mt-9 px-11 py-[18px] rounded-full text-[1.05rem] font-extrabold text-[#1F1F1F] bg-[#FDD663] shadow-[0_6px_20px_rgba(253,214,99,0.5)] transition-all hover:bg-[#FCC934] hover:-translate-y-0.5"
        >
          문의하기 &rarr;
        </ConsultationLink>
        <p className="mt-5 text-[0.82rem] text-[#9AA0A6]">평일 AM 10:00 – PM 5:00 · 주말·공휴일 휴무</p>
      </div>
    </section>
  );
}
