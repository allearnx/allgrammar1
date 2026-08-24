import { curriculumSteps } from '../school-exam-data';

// 구글 4색 순환 (올킬보카 스텝 테마)
const stepColors = ['#1A73E8', '#D93025', '#F9AB00', '#188038'];

export function CurriculumSection() {
  return (
    <section id="curriculum" className="py-16 md:py-24 px-5 md:px-6 bg-[#F8F9FA]">
      <div className="max-w-[880px] mx-auto text-center">
        <span className="inline-block bg-white text-[#174EA6] text-[clamp(0.9rem,1.5vw,1.05rem)] font-extrabold px-6 py-2.5 rounded-full mb-5 shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
          커리큘럼
        </span>
        <h2 className="brand-display font-bold text-[clamp(1.65rem,3.5vw,2.6rem)] leading-[1.35] tracking-[-0.5px] text-[#1F1F1F] break-keep">
          내신 1등급의<br /><span className="text-[#1A73E8]">순서가 있습니다.</span>
        </h2>
        <p className="brand-display font-medium text-[clamp(1.05rem,1.9vw,1.35rem)] text-[#3C4043] leading-[1.8] mt-4 max-w-[680px] mx-auto break-keep">
          순서가 틀리면 시간 낭비예요.<br />올인내신은 <b className="font-bold text-[#1F1F1F]">검증된 순서대로</b> 가르칩니다.
        </p>

        <div className="flex flex-col gap-3.5 mt-12 text-left">
          {curriculumSteps.map((item, i) => {
            const color = stepColors[i % stepColors.length];
            return (
              <div key={item.step} className="bg-white rounded-[22px] px-6 md:px-8 py-6 md:py-7 grid grid-cols-[52px_1fr] gap-5 md:gap-6 items-start shadow-[0_8px_28px_rgba(31,31,31,0.06)]">
                <div
                  className="brand-display font-bold w-[52px] h-[52px] rounded-full flex items-center justify-center text-[1.2rem] text-white mt-0.5"
                  style={{ background: color }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3 className="brand-display font-bold text-[clamp(1.05rem,2vw,1.25rem)] text-[#1F1F1F] mb-1.5 leading-[1.4] break-keep">{item.title}</h3>
                  <p className="text-[0.95rem] text-[#3C4043] leading-[1.75] whitespace-pre-line break-keep">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
