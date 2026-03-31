'use client';

import ConsultationForm from '@/components/public/consultation-form';
import { HeroSection } from './sections/hero-section';
import { ReviewSection } from './sections/review-section';
import { CurriculumSection } from './sections/curriculum-section';
import { SchoolMarqueeSection } from './sections/school-marquee-section';
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
      <SchoolMarqueeSection />
      <ConsultationForm />
      <EventPopup />
    </>
  );
}
