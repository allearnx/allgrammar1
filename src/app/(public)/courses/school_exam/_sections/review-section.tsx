import NaesinReviewCarousel from '../review-carousel';

export function ReviewSection() {
  return (
    <section className="py-24 px-6 bg-[#f5f3ff]">
      <div className="max-w-[1000px] mx-auto">
        <div className="inline-block text-[0.7rem] font-bold tracking-[0.12em] text-[#92784a] uppercase bg-[#fdf6e3] px-3 py-1 rounded-full mb-5 border border-[#e8dcc8]">
          수강 후기
        </div>
        <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.25] tracking-[-0.5px] text-indigo-950 mb-4">
          직접 경험한 학부모님들의<br /><span className="text-violet-400">생생한 후기입니다.</span>
        </h2>
        <p className="text-[0.95rem] text-slate-500 leading-[1.85] max-w-[520px] mb-14 break-keep">
          카카오톡으로 전해진 실제 후기를 그대로 공개합니다.
        </p>
        <NaesinReviewCarousel />
      </div>
    </section>
  );
}
