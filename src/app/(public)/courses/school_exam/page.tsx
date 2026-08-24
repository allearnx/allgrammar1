import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { HeroSection } from './_sections/hero-section';
import { WhySection } from './_sections/why-section';
import { CurriculumSection } from './_sections/curriculum-section';
import { CompareSection } from './_sections/compare-section';
import { ReviewSection } from './_sections/review-section';
import { PricingSection } from './_sections/pricing-section';
import { ContactSection } from './_sections/contact-section';
import './naesin.css';

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
      className="bg-white text-[#1F1F1F] leading-[1.7] overflow-x-hidden"
      style={{ fontFamily: "'Pretendard', sans-serif" }}
    >
      <HeroSection />
      <WhySection />
      <CurriculumSection />
      <CompareSection />
      <ReviewSection />
      <PricingSection examCourse={examCourse} />
      <ContactSection />
    </main>
  );
}
