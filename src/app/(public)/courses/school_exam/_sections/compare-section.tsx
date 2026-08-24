import { oldWay, newWay } from '../school-exam-data';

export function CompareSection() {
  return (
    <section className="py-16 md:py-24 px-5 md:px-6 bg-white">
      <div className="max-w-[1000px] mx-auto text-center">
        <span className="inline-block bg-[#E6F4EA] text-[#0D652D] text-[clamp(0.9rem,1.5vw,1.05rem)] font-extrabold px-6 py-2.5 rounded-full mb-5">
          비교
        </span>
        <h2 className="brand-display font-bold text-[clamp(1.65rem,3.5vw,2.6rem)] leading-[1.35] tracking-[-0.5px] text-[#1F1F1F] break-keep">
          목표는 하나.<br /><span className="text-[#188038]">고등 내신 1등급, 수능 1등급.</span>
        </h2>
        <p className="brand-display font-medium text-[clamp(1.05rem,1.9vw,1.35rem)] text-[#3C4043] leading-[1.8] mt-4 max-w-[680px] mx-auto break-keep">
          중3이 끝날 때 그 기반이 완성되어야 해요.<br />올인내신은 <b className="font-bold text-[#1F1F1F]">거기까지</b> 봅니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 items-center mt-14 text-left">
          <div className="bg-[#F8F9FA] border border-[#E8EAED] rounded-[22px] px-7 md:px-8 py-8">
            <div className="brand-display font-bold text-[0.95rem] text-[#9AA0A6] mb-5">기존 방식</div>
            {oldWay.map((item) => (
              <div key={item} className="flex items-start gap-3 mb-4 last:mb-0">
                <div className="w-[22px] h-[22px] rounded-full bg-[#FCE8E6] flex items-center justify-center text-[0.65rem] text-[#D93025] shrink-0 mt-px font-black">&#x2717;</div>
                <span className="text-[0.9rem] text-[#3C4043] leading-[1.65] break-keep">{item}</span>
              </div>
            ))}
          </div>
          <div className="hidden md:flex flex-col items-center shrink-0">
            <div className="brand-display font-bold w-[52px] h-[52px] rounded-full bg-[#1F1F1F] flex items-center justify-center text-white text-[0.85rem] tracking-[0.05em]">VS</div>
          </div>
          <div className="bg-white border-2 border-[#1A73E8] rounded-[22px] px-7 md:px-8 py-8 shadow-[0_10px_32px_rgba(26,115,232,0.12)]">
            <div className="brand-display font-bold text-[0.95rem] text-[#1A73E8] mb-5">올인내신</div>
            {newWay.map((item) => (
              <div key={item} className="flex items-start gap-3 mb-4 last:mb-0">
                <div className="w-[22px] h-[22px] rounded-full bg-[#E8F0FE] flex items-center justify-center text-[0.65rem] text-[#1A73E8] shrink-0 mt-px font-black">&#x2713;</div>
                <span className="text-[0.9rem] text-[#1F1F1F] leading-[1.65] break-keep">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 px-6 py-7 bg-[#E6F4EA] rounded-[22px] text-center">
          <p className="brand-display font-bold text-[clamp(1.05rem,2.3vw,1.3rem)] text-[#1F1F1F] leading-[1.7] break-keep">
            중3이 끝날 때, <span className="text-[#188038]">고등 영어의 기반이 완성</span>되어야 합니다.
          </p>
          <p className="mt-1.5 text-[0.95rem] text-[#3C4043] break-keep leading-[1.7]">
            올인내신은 그 기반을 온라인에서 만들어 드립니다.
          </p>
        </div>
      </div>
    </section>
  );
}
