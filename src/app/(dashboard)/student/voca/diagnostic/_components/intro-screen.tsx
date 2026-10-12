'use client';

import Link from 'next/link';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import { DIAGNOSTIC_GRADES, type DiagnosticGrade } from '@/lib/voca/diagnostic-bands';
import { LINEUP_ACCENTS, lineupPlacement, shortBookTitle } from '@/lib/voca/diagnostic-lineup';
import type { LatestDiagnostic } from './types';

export function IntroScreen({
  latest,
  tookToday,
  onStart,
  elemActive,
}: {
  latest: LatestDiagnostic | null;
  tookToday: boolean;
  onStart: (g: DiagnosticGrade) => void;
  elemActive: boolean;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-3xl p-6 md:p-8" style={{ background: VOCA_COLORS.sky }}>
        <h1 className="text-2xl font-bold" style={{ color: VOCA_COLORS.ink, wordBreak: 'keep-all' }}>
          5분이면 나에게 맞는 단어장이 나와요
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray }}>
          초등 단어부터 수능 기출까지, 어느 교재에서 시작할지 찾아드려요.
          뜻 고르기와 함께 <b>첫 글자 힌트를 보고 철자를 입력하는 문제</b>도 나와요.
          모르는 단어는 찍지 말고 <b>모르겠어요</b>를 눌러야 정확하게 측정돼요.
        </p>
        {latest && (
          <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm" style={{ color: VOCA_COLORS.gray }}>
            최근 진단({new Date(latest.createdAt).toLocaleDateString('ko-KR')}) — 단어 정답률 <b>{latest.coverageScore}%</b>
          </div>
        )}
      </div>

      {tookToday ? (
        <div className="rounded-2xl border bg-white p-6 text-center">
          <p className="font-medium" style={{ color: VOCA_COLORS.gray }}>오늘은 이미 진단을 마쳤어요. 내일 다시 측정할 수 있어요.</p>
          <Link href="/student/voca" className="mt-3 inline-block rounded-full px-6 py-2.5 font-bold text-white" style={{ background: VOCA_COLORS.blue }}>
            단어 학습하러 가기
          </Link>
        </div>
      ) : (
        <div>
          {/*
            시작 지점 안내 (2026-09-03 사장님 지시). 배경: 워마 중등 고난도를 끝낸 학생이
            '초등학생'을 골라 초등 단어부터 측정됐고, 한 진단(최대 5라운드)으로는 실제 실력까지
            못 올라갔다. 단어책을 안 쓰거나 자기 수준을 모르는 아이도 있으므로 기본은 "자기 학년",
            선행 중이거나 단어책을 아는 아이만 그 수준으로 올려 고르게 한다. 칸 아래 교재명은
            수준을 가늠하는 참고일 뿐 필수 지식이 아니다.
          */}
          <p className="text-base font-bold" style={{ color: VOCA_COLORS.ink }}>
            학년을 골라주세요
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray, wordBreak: 'keep-all' }}>
            보통은 <b style={{ color: VOCA_COLORS.ink }}>자기 학년</b>을 고르면 돼요.
            선행 중이거나 지금 외우는 단어책이 있다면 <b style={{ color: VOCA_COLORS.ink }}>그 수준</b>을 골라주세요(칸 아래 교재 참고).
            잘 맞히면 더 어려운 단어로, 어려우면 더 쉬운 단어로 자동으로 옮겨가요.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {DIAGNOSTIC_GRADES.map((g) => {
              const place = lineupPlacement(g.startBand);
              const accent = LINEUP_ACCENTS[place.columnKey];
              return (
                <button
                  key={g.key}
                  onClick={() => onStart(g.key)}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="h-1" style={{ background: accent.vivid }} />
                  <div className="px-2 py-3">
                    <p className="text-base font-bold" style={{ color: accent.deep }}>{g.label}</p>
                    {/* 학년 라벨만으로는 자기 수준을 못 고른다 — 대표 교재로 가늠하게 */}
                    <p className="mt-0.5 text-[11px] leading-snug" style={{ color: VOCA_COLORS.gray, wordBreak: 'keep-all' }}>
                      {shortBookTitle(place.highlightTitle)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: VOCA_COLORS.gray, wordBreak: 'keep-all' }}>
            실력보다 훨씬 낮은 학년에서 시작하면 한 번에 실제 실력까지 올라가지 못할 수 있어요.
            잘 모르겠으면 자기 학년을 고르세요.
          </p>
          {!elemActive && (
            <p className="mt-2 text-xs text-gray-500">초등 교재 준비 중에는 중1 수준부터 측정돼요.</p>
          )}
        </div>
      )}
    </div>
  );
}
