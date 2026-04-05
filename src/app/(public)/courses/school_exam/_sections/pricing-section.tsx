import SinaeSinPayButton from '@/components/public/sinaesin-pay-button';
import { trialPersonalItems, trialAcademyItems, premiumItems } from '../school-exam-data';

interface PricingSectionProps {
  examCourse: { id: string; price: number; title: string } | null;
}

export function PricingSection({ examCourse }: PricingSectionProps) {
  return (
    <section className="py-24 px-6 bg-[#f8f7ff] text-center">
      <div className="max-w-[1100px] mx-auto">
        <div className="inline-block text-[0.7rem] font-bold tracking-[0.12em] text-indigo-700 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-5">
          시작하기
        </div>
        <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.25] text-indigo-950 mb-4">
          올라영에서 중등내신을 통해<br /><span className="text-violet-400">고등실력까지 올려보세요.</span>
        </h2>
        <p className="text-[0.95rem] text-slate-500 leading-[1.85] mx-auto max-w-[520px]">
          체험으로 먼저 경험하고, 선생님과 함께 본격적으로 시작하세요.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14 items-start">
          {/* 체험하기 · 개인 */}
          <div className="rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(30,27,75,0.06)] border border-slate-200 bg-white text-left flex flex-col">
            <div className="px-7 pt-8 pb-6">
              <h3 className="sinaesin-serif text-[0.8rem] font-bold text-slate-400 tracking-[0.1em] uppercase mb-3">
                체험 · 개인
              </h3>
              <div className="text-[2rem] font-black leading-none tracking-[-1px] text-indigo-950">체험하기</div>
              <div className="text-[0.85rem] text-slate-400 mt-2">혼자서 먼저 경험해 보세요</div>
            </div>
            <div className="border-t border-slate-100 px-7 py-6 flex-1">
              {trialPersonalItems.map((item) => (
                <div key={item} className="flex items-start gap-3 mb-3.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[0.6rem] text-slate-400 shrink-0 mt-0.5 font-black">&#x2713;</div>
                  <span className="text-[0.9rem] text-slate-600 leading-[1.65] break-keep">{item}</span>
                </div>
              ))}
            </div>
            <div className="px-7 pb-7">
              <a
                href="/signup"
                className="block w-full text-center py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-[0.9rem] transition-all hover:bg-slate-200"
              >
                체험하기 &rarr;
              </a>
            </div>
          </div>

          {/* ₩180,000 · 선생님과 함께 (추천) */}
          <div className="rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(30,27,75,0.2)] border-[2px] border-[#c9a84c]/50 bg-indigo-950 text-left flex flex-col relative md:-mt-4 md:mb-[-16px]">
            <div className="absolute top-0 inset-x-0 h-0.5 [background:linear-gradient(90deg,transparent,#c9a84c,#f0d080,#c9a84c,transparent)]" />
            <div className="absolute top-4 right-4 bg-[#c9a84c] text-indigo-950 text-[0.75rem] font-bold px-3.5 py-1 rounded-full">
              ✦ 추천
            </div>
            <div className="px-8 pt-9 pb-7">
              <h3 className="sinaesin-serif text-[0.85rem] font-bold text-[#c9a84c] tracking-[0.1em] uppercase mb-4">
                선생님과 함께 · 4주
              </h3>
              <div className="text-[2.6rem] font-black leading-none tracking-[-2px] text-white">&#x20A9;180,000</div>
              <div className="text-[0.85rem] text-white/45 mt-2">4주 완성 프로그램</div>
              <div className="inline-flex items-center gap-1.5 bg-[#c9a84c]/15 border border-[#c9a84c]/30 text-[#c9a84c] text-[0.78rem] font-bold px-3.5 py-1.5 rounded-full mt-3.5">
                수강생 95% · 95점 달성
              </div>
            </div>
            <div className="border-t border-white/10 px-8 py-7 flex-1">
              {premiumItems.map((item) => (
                <div key={item} className="flex items-start gap-3 mb-3.5">
                  <div className="w-5 h-5 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/40 flex items-center justify-center text-[0.6rem] text-[#c9a84c] shrink-0 mt-0.5 font-black">&#x2713;</div>
                  <span className="text-[0.92rem] text-white/85 leading-[1.65] break-keep">{item}</span>
                </div>
              ))}
            </div>
            <div className="px-8 pb-8">
              <SinaeSinPayButton courseId={examCourse?.id} price={examCourse?.price} name={examCourse?.title} />
            </div>
          </div>

          {/* 체험하기 · 학원 */}
          <div className="rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(30,27,75,0.06)] border border-slate-200 bg-white text-left flex flex-col">
            <div className="px-7 pt-8 pb-6">
              <h3 className="sinaesin-serif text-[0.8rem] font-bold text-slate-400 tracking-[0.1em] uppercase mb-3">
                체험 · 학원
              </h3>
              <div className="text-[2rem] font-black leading-none tracking-[-1px] text-indigo-950">체험하기</div>
              <div className="text-[0.85rem] text-slate-400 mt-2">학원에서 먼저 경험해 보세요</div>
            </div>
            <div className="border-t border-slate-100 px-7 py-6 flex-1">
              {trialAcademyItems.map((item) => (
                <div key={item} className="flex items-start gap-3 mb-3.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[0.6rem] text-slate-400 shrink-0 mt-0.5 font-black">&#x2713;</div>
                  <span className="text-[0.9rem] text-slate-600 leading-[1.65] break-keep">{item}</span>
                </div>
              ))}
            </div>
            <div className="px-7 pb-7">
              <a
                href="/signup?role=teacher"
                className="block w-full text-center py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-[0.9rem] transition-all hover:bg-slate-200"
              >
                학원 체험하기 &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
