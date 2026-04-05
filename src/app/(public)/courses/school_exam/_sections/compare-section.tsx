import { oldWay, newWay } from '../school-exam-data';

export function CompareSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[1000px] mx-auto">
        <div className="inline-block text-[0.7rem] font-bold tracking-[0.12em] text-indigo-700 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-5">
          비교
        </div>
        <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.25] text-indigo-950 mb-4">
          목표는 하나.<br /><span className="text-violet-400">고등 내신 1등급, 수능 1등급.</span>
        </h2>
        <p className="text-[0.95rem] text-slate-500 leading-[1.85] max-w-[520px] mb-14">
          중3이 끝날 때 그 기반이 완성되어야 합니다.<br />올인내신은 거기까지 봅니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <div className="bg-slate-50 border-[1.5px] border-slate-200 rounded-3xl px-8 py-9">
            <div className="text-[0.72rem] font-bold tracking-[0.12em] text-slate-400 uppercase mb-5">기존 방식</div>
            {oldWay.map((item) => (
              <div key={item} className="flex items-start gap-3 mb-4">
                <div className="w-[22px] h-[22px] rounded-full bg-red-100 flex items-center justify-center text-[0.65rem] text-red-500 shrink-0 mt-px font-black">&#x2717;</div>
                <span className="text-[0.88rem] text-slate-500 leading-[1.65] break-keep">{item}</span>
              </div>
            ))}
          </div>
          <div className="hidden md:flex flex-col items-center gap-2 shrink-0">
            <div className="w-[52px] h-[52px] rounded-full bg-indigo-950 flex items-center justify-center text-white text-[0.82rem] font-black tracking-[0.05em]">VS</div>
          </div>
          <div className="bg-indigo-950 border-[1.5px] border-[#c9a84c]/40 rounded-3xl px-8 py-9 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-0.5 [background:linear-gradient(90deg,transparent,#c9a84c,#f0d080,#c9a84c,transparent)]" />
            <div className="text-[0.72rem] font-bold tracking-[0.12em] text-[#c9a84c] uppercase mb-5">올인내신</div>
            {newWay.map((item) => (
              <div key={item} className="flex items-start gap-3 mb-4">
                <div className="w-[22px] h-[22px] rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/40 flex items-center justify-center text-[0.65rem] text-[#c9a84c] shrink-0 mt-px font-black">&#x2713;</div>
                <span className="text-[0.88rem] text-white/75 leading-[1.65] break-keep">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 px-6 py-7 bg-indigo-50 rounded-2xl text-center border border-indigo-400/15">
          <p className="text-[clamp(1rem,2.5vw,1.25rem)] font-bold text-indigo-950 leading-[1.7] break-keep">
            중3이 끝날 때,{' '}
            <span className="text-indigo-500">고등 영어의 기반이 완성</span>되어야 합니다.
          </p>
          <p className="mt-2 font-normal text-[0.95rem] text-slate-500 break-keep leading-[1.7]">
            올인내신은 그 기반을 온라인에서 만들어 드립니다.
          </p>
        </div>
      </div>
    </section>
  );
}
