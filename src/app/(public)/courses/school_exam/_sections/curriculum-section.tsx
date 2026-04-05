import { curriculumSteps } from '../school-exam-data';

export function CurriculumSection() {
  return (
    <section className="py-16 px-6 bg-indigo-950">
      <div className="max-w-[1000px] mx-auto">
        <div className="inline-block text-[0.7rem] font-bold tracking-[0.12em] text-[#c9a84c] uppercase bg-[#c9a84c]/15 px-3 py-1 rounded-full mb-4 border border-[#c9a84c]/30">
          커리큘럼
        </div>
        <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.25] text-white mb-3">
          내신 1등급의<br /><span className="text-violet-400">순서가 있습니다.</span>
        </h2>
        <p className="text-[0.95rem] text-white/50 leading-[1.85] max-w-[520px]">
          순서가 틀리면 시간 낭비입니다.<br />올인내신은 검증된 순서대로 가르칩니다.
        </p>
        <div className="sinaesin-timeline flex flex-col mt-8 relative">
          {curriculumSteps.map((item) => (
            <div key={item.step} className="group grid grid-cols-[44px_1fr] md:grid-cols-[56px_1fr] gap-5 md:gap-7 items-start py-5 border-b border-white/[0.06] last:border-b-0 relative transition-all duration-300">
              <div className="sinaesin-serif w-11 md:w-14 h-11 md:h-14 rounded-full bg-indigo-900 border-[1.5px] border-[#c9a84c] flex items-center justify-center text-[0.7rem] md:text-[0.8rem] font-bold text-[#c9a84c] shrink-0 relative z-10 transition-all duration-300 group-hover:bg-[#c9a84c] group-hover:text-indigo-950">
                {item.step}
              </div>
              <div className="transition-transform duration-300 group-hover:translate-x-1">
                <h3 className="text-[1.05rem] font-bold text-white mb-1.5 leading-[1.4]">{item.title}</h3>
                <p className="text-sm text-white/45 leading-[1.7] whitespace-pre-line break-keep">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
