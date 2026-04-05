import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Noto_Serif_KR, Nanum_Pen_Script } from 'next/font/google';
import { createAdminClient } from '@/lib/supabase/admin';
import { HeroSection } from './_sections/hero-section';
import { WhySection } from './_sections/why-section';
import { CurriculumSection } from './_sections/curriculum-section';
import { CompareSection } from './_sections/compare-section';
import { ReviewSection } from './_sections/review-section';
import { PricingSection } from './_sections/pricing-section';
import { ContactSection } from './_sections/contact-section';
import './naesin.css';

const notoSerif = Noto_Serif_KR({ weight: ['700'], subsets: ['latin'], preload: false });
const nanumPen = Nanum_Pen_Script({ weight: ['400'], preload: false });

export const metadata: Metadata = {
  title: '올인내신 | 상위권을 위한 영어 내신 대비',
  description: '95점에서 100점���로 가는 그 구간을 집중적으로 파고듭니다. 킬러 문제, 대치동 자료, AI 변형 문제 완벽 대비.',
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
      <HeroSection nanumPenFamily={nanumPen.style.fontFamily} />
      <WhySection />
      <CurriculumSection />
      <CompareSection />
      <ReviewSection />
      <PricingSection examCourse={examCourse} />
      <ContactSection />
    </main>
  );
}
