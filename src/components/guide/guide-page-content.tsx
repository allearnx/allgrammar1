'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { GUIDE_ENTRIES } from '@/lib/guide-data';
import { ILLUSTRATION_MAP } from './guide-illustrations';

interface Props {
  slug: string;
}

export function GuidePageContent({ slug }: Props) {
  const guide = GUIDE_ENTRIES[slug];
  const illustrations = ILLUSTRATION_MAP[slug];
  if (!guide || !illustrations) return null;

  const Icon = guide.icon;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* ── 뒤로가기 ── */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        대시보드
      </Link>

      {/* ── 헤더 ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${guide.color}, ${guide.color}CC)` }}
      >
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{guide.title}</h2>
            <p className="text-sm text-white/70">{guide.description}</p>
          </div>
        </div>
      </div>

      {/* ── 순서 섹션 ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">이렇게 하세요</h3>
        <div className="space-y-4">
          {guide.steps.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              {/* 번호 + 세로선 */}
              <div className="flex flex-col items-center">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: guide.color }}
                >
                  {idx + 1}
                </span>
                {idx < guide.steps.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 mt-1" />
                )}
              </div>
              {/* 내용 + 일러스트 */}
              <div className="flex-1 pb-4 space-y-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>
                <div className="max-w-[260px]">
                  <illustrations.StepIllustration step={idx} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 완성 화면 섹션 ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">이렇게 보여요</h3>
        <p className="text-xs text-gray-500">{guide.completedTitle}</p>
        <div className="max-w-[320px]">
          <illustrations.CompletedIllustration />
        </div>
      </section>

      {/* ── CTA ── */}
      <Link
        href={guide.href}
        className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: guide.color }}
      >
        페이지로 이동
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
