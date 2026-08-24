import Link from 'next/link';
import SinaeSinPayButton from '@/components/public/sinaesin-pay-button';
import { trialPersonalItems, trialAcademyItems, premiumItems } from '../school-exam-data';

interface PricingSectionProps {
  examCourse: { id: string; price: number; title: string } | null;
}

export function PricingSection({ examCourse }: PricingSectionProps) {
  return (
    <section className="py-16 md:py-24 px-5 md:px-6 bg-white text-center">
      <div className="max-w-[1100px] mx-auto">
        <span className="inline-block bg-[#FEF7E0] text-[#B06000] text-[clamp(0.9rem,1.5vw,1.05rem)] font-extrabold px-6 py-2.5 rounded-full mb-5">
          시작하기
        </span>
        <h2 className="brand-display font-bold text-[clamp(1.65rem,3.5vw,2.6rem)] leading-[1.35] tracking-[-0.5px] text-[#1F1F1F] break-keep">
          올라영에서 중등내신을 통해<br /><span className="text-[#188038]">고등실력까지 올려보세요.</span>
        </h2>
        <p className="brand-display font-medium text-[clamp(1.05rem,1.9vw,1.35rem)] text-[#3C4043] leading-[1.8] mt-4 max-w-[680px] mx-auto break-keep">
          체험으로 먼저 경험하고, 선생님과 함께 본격적으로 시작하세요.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14 items-start">
          {/* 체험하기 · 개인 */}
          <div className="rounded-[22px] overflow-hidden border border-[#E8EAED] bg-white text-left flex flex-col shadow-[0_8px_28px_rgba(31,31,31,0.05)]">
            <div className="px-7 pt-8 pb-6">
              <h3 className="text-[0.85rem] font-extrabold text-[#9AA0A6] mb-3">체험 · 개인</h3>
              <div className="brand-display font-bold text-[2rem] leading-none tracking-[-1px] text-[#1F1F1F]">무료</div>
              <div className="text-[0.85rem] text-[#9AA0A6] mt-2.5">혼자서 먼저 경험해 보세요</div>
            </div>
            <div className="border-t border-[#F1F3F4] px-7 py-6 flex-1">
              {trialPersonalItems.map((item) => (
                <div key={item} className="flex items-start gap-3 mb-3.5 last:mb-0">
                  <div className="w-5 h-5 rounded-full bg-[#E8F0FE] flex items-center justify-center text-[0.6rem] text-[#1A73E8] shrink-0 mt-0.5 font-black">&#x2713;</div>
                  <span className="text-[0.9rem] text-[#3C4043] leading-[1.65] break-keep">{item}</span>
                </div>
              ))}
            </div>
            <div className="px-7 pb-7">
              <Link
                href="/signup"
                className="block w-full text-center py-3.5 rounded-full bg-white border-[1.5px] border-[#E8EAED] text-[#1F1F1F] font-extrabold text-[0.9rem] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(31,31,31,0.08)]"
              >
                체험하기 &rarr;
              </Link>
            </div>
          </div>

          {/* ₩180,000 · 선생님과 함께 (추천) */}
          <div className="rounded-[22px] overflow-hidden bg-[#202124] text-left flex flex-col relative md:-mt-4 md:mb-[-16px] shadow-[0_16px_48px_rgba(31,31,31,0.25)]">
            <div className="absolute top-4 right-4 bg-[#FDD663] text-[#1F1F1F] text-[0.78rem] font-extrabold px-3.5 py-1.5 rounded-full">
              ✦ 추천
            </div>
            <div className="px-8 pt-9 pb-7">
              <h3 className="text-[0.85rem] font-extrabold text-[#FDD663] mb-4">선생님과 함께 · 4주</h3>
              <div className="brand-display font-bold text-[2.5rem] leading-none tracking-[-1px] text-white">
                {(examCourse?.price ?? 180000).toLocaleString()}
                <span className="text-[1.1rem] font-medium text-white/60 ml-1">원</span>
              </div>
              <div className="text-[0.85rem] text-white/60 mt-2.5">4주 완성 프로그램</div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 text-[#8AB4F8] text-[0.78rem] font-bold px-3.5 py-1.5 rounded-full mt-3.5">
                수강생 95% · 95점 달성
              </div>
            </div>
            <div className="border-t border-white/10 px-8 py-7 flex-1">
              {premiumItems.map((item) => (
                <div key={item} className="flex items-start gap-3 mb-3.5 last:mb-0">
                  <div className="w-5 h-5 rounded-full bg-[#FDD663]/20 flex items-center justify-center text-[0.6rem] text-[#FDD663] shrink-0 mt-0.5 font-black">&#x2713;</div>
                  <span className="text-[0.92rem] text-white/90 leading-[1.65] break-keep">{item}</span>
                </div>
              ))}
            </div>
            <div className="px-8 pb-8">
              <SinaeSinPayButton courseId={examCourse?.id} price={examCourse?.price} name={examCourse?.title} />
            </div>
          </div>

          {/* 체험하기 · 학원 */}
          <div className="rounded-[22px] overflow-hidden border border-[#E8EAED] bg-white text-left flex flex-col shadow-[0_8px_28px_rgba(31,31,31,0.05)]">
            <div className="px-7 pt-8 pb-6">
              <h3 className="text-[0.85rem] font-extrabold text-[#9AA0A6] mb-3">체험 · 학원</h3>
              <div className="brand-display font-bold text-[2rem] leading-none tracking-[-1px] text-[#1F1F1F]">무료</div>
              <div className="text-[0.85rem] text-[#9AA0A6] mt-2.5">학원에서 먼저 경험해 보세요</div>
            </div>
            <div className="border-t border-[#F1F3F4] px-7 py-6 flex-1">
              {trialAcademyItems.map((item) => (
                <div key={item} className="flex items-start gap-3 mb-3.5 last:mb-0">
                  <div className="w-5 h-5 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[0.6rem] text-[#188038] shrink-0 mt-0.5 font-black">&#x2713;</div>
                  <span className="text-[0.9rem] text-[#3C4043] leading-[1.65] break-keep">{item}</span>
                </div>
              ))}
            </div>
            <div className="px-7 pb-7">
              <Link
                href="/signup?role=teacher"
                className="block w-full text-center py-3.5 rounded-full bg-white border-[1.5px] border-[#E8EAED] text-[#1F1F1F] font-extrabold text-[0.9rem] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(31,31,31,0.08)]"
              >
                학원 체험하기 &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
