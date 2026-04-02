import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Noto_Serif_KR, Nanum_Pen_Script } from 'next/font/google';
import SinaeSinPayButton from '@/components/public/sinaesin-pay-button';
import ConsultationLink from '@/components/public/consultation-link';
import NaesinReviewCarousel from './review-carousel';
import { createAdminClient } from '@/lib/supabase/admin';
import { whyCards, curriculumSteps, oldWay, newWay, freeOptionItems, academyOptionItems } from './school-exam-data';
import './naesin.css';

const notoSerif = Noto_Serif_KR({ weight: ['700'], subsets: ['latin'], preload: false });
const nanumPen = Nanum_Pen_Script({ weight: ['400'], preload: false });

export const metadata: Metadata = {
  title: '올인내신 | 상위권을 위한 영어 내신 대비',
  description: '95점에서 100점으로 가는 그 구간을 집중적으로 파고듭니다. 킬러 문제, 대치동 자료, AI 변형 문제 완벽 대비.',
};

export default async function SchoolExamPage() {
  const supabase = createAdminClient();
  const { data: examCourse } = await supabase
    .from('courses')
    .select('id, price, title')
    .eq('category', 'school_exam')
    .eq('is_active', true)
    .limit(1)
    .single();

  return (
    <main
      className="bg-white text-indigo-950 leading-[1.7] overflow-x-hidden"
      style={{ fontFamily: "'Pretendard', sans-serif", '--font-serif': notoSerif.style.fontFamily } as CSSProperties}
    >

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center pt-[100px] md:pt-[130px] px-5 md:px-6 pb-[60px] md:pb-20 bg-white">
        <div className="max-w-[800px]">
          <div className="sinaesin-anim inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-400/20 text-indigo-700 px-[18px] py-1.5 rounded-full text-[0.78rem] font-bold mb-10">
            ✦ 올라영 × 올인내신
          </div>
          <p
            className="sinaesin-anim text-[clamp(1.8rem,5vw,2.8rem)] text-slate-500 mb-2 leading-[1.4] [animation-delay:0.08s]"
            style={{ fontFamily: nanumPen.style.fontFamily }}
          >
            온라인으로 내신이 된다고요?
          </p>
          <h1 className="sinaesin-anim text-[clamp(3rem,8vw,5.5rem)] font-black leading-[1.05] tracking-[-3px] text-indigo-950 mb-1 [animation-delay:0.12s]">
            됩니다.
          </h1>
          <p className="sinaesin-anim text-[clamp(1.6rem,4vw,2.8rem)] font-black text-violet-400 tracking-[-1.5px] mb-10 [animation-delay:0.16s]">
            그것도 아주 잘.
          </p>

          <div className="sinaesin-proof sinaesin-serif sinaesin-anim relative inline-block text-[0.85rem] font-bold text-[#8a6a2a] px-6 md:px-14 py-4 md:py-5 mb-3.5 [animation-delay:0.2s]">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-7">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[1.15rem] font-bold text-[#7a5a1a] tracking-[0.08em] whitespace-nowrap">수강생 95% · 95점 달성</span>
                <span className="text-xs font-normal text-[#b8966a] tracking-[0.1em] whitespace-nowrap">STUDENT ACHIEVEMENT</span>
              </div>
              <div className="hidden md:block w-[5px] h-[5px] rounded-full bg-[#c9a84c] shrink-0" />
              <div className="md:hidden w-6 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent shrink-0" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[1.15rem] font-bold text-[#7a5a1a] tracking-[0.08em] whitespace-nowrap">2026 동탄국제고 합격</span>
                <span className="text-xs font-normal text-[#b8966a] tracking-[0.1em] whitespace-nowrap">DONGTAN INTERNATIONAL HIGH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
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

      {/* CURRICULUM */}
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

      {/* COMPARE */}
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

      {/* REVIEW */}
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

      {/* PRICING */}
      <section className="py-24 px-6 bg-[#f8f7ff] text-center">
        <div className="max-w-[1000px] mx-auto">
          <div className="inline-block text-[0.7rem] font-bold tracking-[0.12em] text-indigo-700 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-5">
            시작하기
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.25] text-indigo-950 mb-4">
            어떻게 시작할까요?
          </h2>
          <p className="text-[0.95rem] text-slate-500 leading-[1.85] mx-auto max-w-[520px]">
            혼자서도, 선생님과 함께도 — 두 가지 방법 모두 무료로 시작할 수 있습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 max-w-[820px] mx-auto">
            {/* 무료로 시작하기 */}
            <div className="rounded-3xl overflow-hidden shadow-[0_8px_48px_rgba(30,27,75,0.08)] border-[1.5px] border-indigo-200 bg-white text-left flex flex-col">
              <div className="px-7 pt-8 pb-6">
                <h3 className="sinaesin-serif text-[0.82rem] font-bold text-indigo-400 tracking-[0.1em] uppercase mb-4">
                  혼자서도 충분히
                </h3>
                <div className="text-[2.8rem] font-black leading-none tracking-[-2px] text-indigo-950">&#x20A9;0</div>
                <div className="text-[0.82rem] text-slate-400 mt-1.5">무료</div>
              </div>
              <div className="border-t border-indigo-100 px-7 py-6 flex-1">
                <div className="text-[0.7rem] font-bold tracking-[0.1em] text-slate-400 uppercase mb-4">포함 항목</div>
                {freeOptionItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 mb-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[0.6rem] text-emerald-500 shrink-0 mt-0.5 font-black">&#x2713;</div>
                    <span className="text-[0.88rem] text-slate-600 leading-[1.6] break-keep">{item}</span>
                  </div>
                ))}
              </div>
              <div className="px-7 pb-7">
                <a
                  href="/signup"
                  className="block w-full text-center py-3.5 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-[0.92rem] transition-all hover:bg-indigo-200"
                >
                  무료로 시작하기 &rarr;
                </a>
              </div>
            </div>

            {/* 학원무료로 시작하기 */}
            <div className="rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(30,27,75,0.18)] border-[1.5px] border-indigo-800 bg-indigo-950 text-left flex flex-col relative">
              <div className="absolute top-4 right-4 bg-violet-500 text-white text-[0.7rem] font-bold px-3 py-1 rounded-full">
                ✦ 추천
              </div>
              <div className="px-7 pt-8 pb-6">
                <h3 className="sinaesin-serif text-[0.82rem] font-bold text-violet-400 tracking-[0.1em] uppercase mb-4">
                  선생님과 함께
                </h3>
                <div className="text-[2.8rem] font-black leading-none tracking-[-2px] text-white">&#x20A9;0</div>
                <div className="text-[0.82rem] text-white/40 mt-1.5">무료</div>
              </div>
              <div className="border-t border-white/10 px-7 py-6 flex-1">
                <div className="text-[0.7rem] font-bold tracking-[0.1em] text-white/40 uppercase mb-4">포함 항목</div>
                {academyOptionItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 mb-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-[0.6rem] text-violet-400 shrink-0 mt-0.5 font-black">&#x2713;</div>
                    <span className="text-[0.88rem] text-white/75 leading-[1.6] break-keep">{item}</span>
                  </div>
                ))}
              </div>
              <div className="px-7 pb-7">
                <a
                  href="/signup?role=teacher"
                  className="block w-full text-center py-3.5 rounded-xl bg-violet-500 text-white font-bold text-[0.92rem] transition-all hover:bg-violet-600 shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
                >
                  학원무료로 시작하기 &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* 1:1 과외 옵션 */}
          <div className="mt-8 text-[0.88rem] text-slate-400">
            체계적 학습과 특별한 관리를 경험해 보세요. · <span className="text-indigo-950 font-bold">&#x20A9;180,000/4주</span>
          </div>
          <SinaeSinPayButton courseId={examCourse?.id} price={examCourse?.price} name={examCourse?.title} />
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-24 px-6 bg-white text-center">
        <div className="max-w-[1000px] mx-auto">
          <div className="inline-block text-[0.7rem] font-bold tracking-[0.12em] text-indigo-700 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-5">
            문의
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.25] text-indigo-950 mb-4">
            우리 아이한테 맞을지<br />먼저 물어보세요.
          </h2>
          <p className="text-[0.95rem] text-slate-500 leading-[1.85] mx-auto max-w-[520px]">
            커리큘럼, 학습 방식, 현재 수준에서 시작 가능한지 — 무엇이든 편하게 물어보세요.
          </p>
          <ConsultationLink
            className="inline-flex items-center gap-2.5 mt-9 px-9 py-4 rounded-xl text-base font-bold text-white transition-all hover:translate-y-[-1px]"
          >
            <span className="bg-indigo-950 px-9 py-4 rounded-xl shadow-[0_4px_20px_rgba(30,27,75,0.18)] inline-block">
              문의하기 &rarr;
            </span>
          </ConsultationLink>
          <p className="mt-4 text-[0.8rem] text-slate-400">평일 AM 10:00 – PM 5:00 · 주말·공휴일 휴무</p>
        </div>
      </section>

    </main>
  );
}
