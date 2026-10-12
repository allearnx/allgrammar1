'use client';

import Link from 'next/link';
import { Sparkles, BookOpen, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { VocaHeroLetters, VOCA_COLORS } from '@/components/voca/voca-brand';

/**
 * 무료 한도 업그레이드 안내 — 체험 완료 시 페이지 상단, 그 전엔 하단.
 * /allkill 톤: 하늘 카드 + GmarketSans + 흰 플랜 카드 + 노란 CTA (문 두 개).
 */
export function FreeUpgradeNotice({ freeDayLimit, totalDayCount, freeTrialDone }: {
  freeDayLimit: number;
  totalDayCount: number;
  freeTrialDone: boolean;
}) {
  return (
  <div className="space-y-4">
        {/* 헤더 카드 */}
        <div className="relative overflow-hidden rounded-3xl px-5 py-8 text-center" style={{ background: VOCA_COLORS.sky }}>
          <VocaHeroLetters />
          <div className="relative z-10">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-white p-3 shadow-sm">
                <Sparkles className="h-6 w-6" style={{ color: VOCA_COLORS.blue }} />
              </div>
            </div>
            <h3 className="voca-display text-lg md:text-xl mb-2" style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}>
              {freeTrialDone
                ? <>무료 체험 Day {freeDayLimit}개를 완료했어요<span style={{ color: VOCA_COLORS.blue }}>!</span> 🎉</>
                : <>무료 체험으로 Day {freeDayLimit}개까지 학습할 수 있어요<span style={{ color: VOCA_COLORS.blue }}>.</span></>}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray }}>
              {freeTrialDone
                ? `전체 ${totalDayCount}개 Day + 2회독을 열려면 아래 방법 중 하나를 선택하세요`
                : `전체 ${totalDayCount}개 Day를 학습하려면 아래 방법 중 하나를 선택하세요`}
            </p>
          </div>
        </div>

        {/* 플랜 카드 */}
        <div className="grid grid-cols-1 gap-3">
          {/* 셀프 스터디 — 가벼운 문 */}
          <Link href="/allkill#price" className="block group">
            <div className="rounded-3xl border border-white bg-white p-5 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="rounded-xl p-2 shrink-0" style={{ background: VOCA_COLORS.blueLight }}>
                  <BookOpen className="h-5 w-5" style={{ color: VOCA_COLORS.blue }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="voca-display" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>셀프 스터디</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: VOCA_COLORS.blueLight, color: VOCA_COLORS.blueDark }}>월 19,900원</span>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: VOCA_COLORS.gray }}>
                    혼자서도 전체 Day + 1회독·2회독 완벽 학습!<br />
                    오답 관리와 AI 서술형 채점까지 포함
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: VOCA_COLORS.blue }}>
                    플랜 보러가기
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 1:1 온라인 관리 — 큰 문 (추천, 노란 CTA) */}
          <Link href="/allkill#price" className="block group">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-2 ring-[#1A73E8] transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <div className="flex items-start gap-3">
                <div className="rounded-xl p-2 shrink-0" style={{ background: VOCA_COLORS.yellowLight }}>
                  <Users className="h-5 w-5" style={{ color: VOCA_COLORS.yellowDark }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="voca-display" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>1:1 온라인 관리</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: VOCA_COLORS.blue }}>추천</span>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: VOCA_COLORS.gray }}>
                    선생님이 주 2회 시험 + 진도 관리해줘요.<br />
                    학부모 리포트까지 제공!
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['선생님 관리', '주 2회 시험', '학부모 리포트'].map((tag) => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: VOCA_COLORS.blueLight, color: VOCA_COLORS.blueDark }}>{tag}</span>
                    ))}
                    <span className="voca-cta voca-display ml-auto rounded-full px-4 py-1.5 text-xs" style={{ fontWeight: 700 }}>
                      시작하기
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 학원 배정 */}
          <div className="rounded-3xl border border-gray-100 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-gray-100 p-2 shrink-0">
                <GraduationCap className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="voca-display mb-1" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>학원에서 배정받기</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  학원에 소속되어 있다면 선생님께 &ldquo;올킬보카 배정&rdquo;을 요청해보세요!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
