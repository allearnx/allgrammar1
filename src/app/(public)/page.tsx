'use client';

import ConsultationForm from '@/components/public/consultation-form';
import { HeroSection } from './sections/hero-section';
import { ReviewSection } from './sections/review-section';
import { CurriculumSection } from './sections/curriculum-section';
import { SystemSection } from './sections/system-section';
import { SchoolMarqueeSection } from './sections/school-marquee-section';
import { StatsSection } from './sections/stats-section';
import { EventPopup } from './sections/event-popup';

export default function LandingPage() {
  const scrollToForm = () => {
    document.getElementById('consultation-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <HeroSection onScrollToForm={scrollToForm} />
      <ReviewSection />
      <CurriculumSection />
      <SystemSection />
      <SchoolMarqueeSection />
      <StatsSection />
      <ConsultationForm />
      <EventPopup />
    </>
  );
}
