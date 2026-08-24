import NaesinReviewCarousel from '../review-carousel';

export function ReviewSection() {
  return (
    <section className="py-16 md:py-24 px-5 md:px-6 bg-[#DFEFFF]">
      <div className="max-w-[1080px] mx-auto text-center">
        <span className="inline-block bg-white text-[#174EA6] text-[clamp(0.9rem,1.5vw,1.05rem)] font-extrabold px-6 py-2.5 rounded-full mb-5 shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
          수강 후기
        </span>
        <h2 className="brand-display font-bold text-[clamp(1.65rem,3.5vw,2.6rem)] leading-[1.35] tracking-[-0.5px] text-[#1F1F1F] break-keep">
          직접 경험한 학부모님들의<br /><span className="text-[#1A73E8]">생생한 후기입니다.</span>
        </h2>
        <p className="brand-display font-medium text-[clamp(1.05rem,1.9vw,1.35rem)] text-[#3C4043] leading-[1.8] mt-4 max-w-[680px] mx-auto break-keep mb-12">
          카카오톡으로 전해진 <b className="font-bold text-[#1F1F1F]">실제 후기</b>를 그대로 공개합니다.
        </p>
        <NaesinReviewCarousel />
      </div>
    </section>
  );
}
