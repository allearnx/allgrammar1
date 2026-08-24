import { whyCards } from '../school-exam-data';

// 구글 4색 순환 테마 (올킬보카 스텝 카드와 동일 문법)
const cardThemes = [
  { solid: '#1A73E8', bg: '#E8F0FE', text: '#174EA6' },
  { solid: '#D93025', bg: '#FCE8E6', text: '#A50E0E' },
  { solid: '#F9AB00', bg: '#FEF7E0', text: '#B06000' },
  { solid: '#188038', bg: '#E6F4EA', text: '#0D652D' },
];

export function WhySection() {
  return (
    <section className="py-16 md:py-24 px-5 md:px-6 bg-white">
      <div className="max-w-[1080px] mx-auto text-center">
        <span className="inline-block bg-[#E8F0FE] text-[#174EA6] text-[clamp(0.9rem,1.5vw,1.05rem)] font-extrabold px-6 py-2.5 rounded-full mb-5">
          WHY 올인내신
        </span>
        <h2 className="brand-display font-bold text-[clamp(1.65rem,3.5vw,2.6rem)] leading-[1.35] tracking-[-0.5px] text-[#1F1F1F] break-keep">
          상위권이 막히는 곳,<br /><span className="text-[#1A73E8]">거기를 집중적으로 파고듭니다.</span>
        </h2>
        <p className="brand-display font-medium text-[clamp(1.05rem,1.9vw,1.35rem)] text-[#3C4043] leading-[1.8] mt-4 max-w-[680px] mx-auto break-keep">
          기초를 잘 가르치는 곳은 많아요.<br />
          올인내신은 <b className="font-bold text-[#1F1F1F]">95점에서 100점으로 가는 그 구간</b>을 다룹니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-14 text-center">
          {whyCards.map((card, i) => {
            const theme = cardThemes[i % cardThemes.length];
            return (
              <div key={card.num} className="bg-white rounded-[22px] px-5 py-8 flex flex-col items-center shadow-[0_10px_32px_rgba(31,31,31,0.08)]">
                <div
                  className="brand-display font-bold w-[52px] h-[52px] rounded-full flex items-center justify-center text-[1.25rem] text-white mb-4"
                  style={{ background: theme.solid }}
                >
                  {i + 1}
                </div>
                <h3 className="brand-display font-bold text-[1.15rem] text-[#1F1F1F] mb-3 leading-[1.4] whitespace-pre-line break-keep">{card.title}</h3>
                <span
                  className="text-[0.82rem] font-bold px-3.5 py-1.5 rounded-full mb-3.5"
                  style={{ color: theme.text, background: theme.bg }}
                >
                  {card.num}
                </span>
                <p className="text-[0.95rem] text-[#3C4043] leading-[1.7] whitespace-pre-line break-keep">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
