import { whyCards } from '../school-exam-data';

export function WhySection() {
  return (
    <section className="py-24 px-6 bg-[#f5f3ff]">
      <div className="max-w-[1000px] mx-auto">
        <div className="inline-block text-[0.7rem] font-bold tracking-[0.12em] text-[#92784a] uppercase bg-[#fdf6e3] px-3 py-1 rounded-full mb-5 border border-[#e8dcc8]">
          WHY 올인내신
        </div>
        <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.25] tracking-[-0.5px] text-indigo-950 mb-4">
          상위권이 막히는 곳,<br /><span className="text-violet-400">거기를 집중적으로 파고듭니다.</span>
        </h2>
        <p className="text-[0.95rem] text-slate-500 leading-[1.85] max-w-[520px] break-keep">
          기초를 잘 가르치는 곳은 많아요.<br />
          <span className="whitespace-nowrap">올인내신은 95점에서 100점으로 가는 그 구간을 다룹니다.</span>
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mt-14">
          {whyCards.map((card) => (
            <div key={card.num} className="sinaesin-why-card bg-white border-[1.5px] border-[#c9a84c] rounded-2xl px-7 py-8 transition-all duration-300 relative overflow-hidden shadow-[0_4px_24px_rgba(180,140,60,0.12),0_1px_4px_rgba(180,140,60,0.08)] hover:shadow-[0_16px_48px_rgba(180,140,60,0.2)] hover:-translate-y-[5px]">
              <div className="sinaesin-serif text-[0.68rem] font-bold text-[#92784a] tracking-[0.15em] uppercase mb-3.5 inline-block pb-2.5 border-b border-[#e8dcc8] w-full">
                {card.num}
              </div>
              <h3 className="text-[1.05rem] font-bold text-indigo-950 mb-2.5 leading-[1.4] whitespace-pre-line">{card.title}</h3>
              <p className="text-sm text-slate-500 leading-[1.75] whitespace-pre-line">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
