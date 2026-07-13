import HeroSection from './_sections/HeroSection';
import StatBandSection from './_sections/StatBandSection';
import FlowSection from './_sections/FlowSection';
import FeatureSection from './_sections/FeatureSection';
import BookCarouselSection from './_sections/BookCarouselSection';
import ParentSection from './_sections/ParentSection';
import PricingSection from './_sections/PricingSection';
import FinalCtaSection from './_sections/FinalCtaSection';
import { C } from './_data';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AllkillPage() {
  const supabase = createAdminClient();
  const { data: vocaCourses } = await supabase
    .from('courses')
    .select('id, price, title')
    .eq('category', 'voca')
    .eq('is_active', true)
    .order('price', { ascending: true });
  const selfStudyCourse = vocaCourses?.find((c) => c.price <= 30000);
  const managedCourse = vocaCourses?.find((c) => c.price > 30000);
  const vocaCourseId = managedCourse?.id || undefined;
  const vocaCoursePrice = managedCourse?.price || undefined;
  const selfStudyCourseId = selfStudyCourse?.id || undefined;
  const selfStudyCoursePrice = selfStudyCourse?.price || undefined;

  // 보유 교재 로테이션 카드 — 표지 = 홍보 노출, is_active = 학생 노출 (별개 규칙).
  // 콘텐츠 준비 중(is_active=false) 교재도 표지만 있으면 라인업으로 보여준다.
  const { data: vocaBooks } = await supabase
    .from('voca_books')
    .select('id, title, cover_image_url')
    .not('cover_image_url', 'is', null)
    .order('sort_order');
  const carouselBooks = (vocaBooks ?? []).filter(
    (b): b is { id: string; title: string; cover_image_url: string } => !!b.cover_image_url,
  );

  return (
    <>
      <style suppressHydrationWarning>{`
        /* 버튼 2종 — 큰 문(노랑) / 가벼운 문(흰색) */
        .ak-btn { display: inline-flex; align-items: center; justify-content: center; padding: 18px 44px; border-radius: 100px; font-size: 17px; font-weight: 800; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s; box-sizing: border-box; }
        .ak-btn:hover { transform: translateY(-2px); }
        .ak-btn-primary { background: ${C.yellow}; color: ${C.ink}; box-shadow: 0 6px 20px rgba(253,214,99,0.5); }
        .ak-btn-ghost { background: white; color: ${C.ink}; border: 1.5px solid ${C.line}; box-shadow: 0 4px 16px rgba(31,31,31,0.06); }

        /* 공용 타이포 */
        .ak-badge { display: inline-block; background: ${C.blueLight}; color: ${C.blueDark}; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 100px; margin-bottom: 18px; }
        .ak-h2 { font-size: clamp(28px, 3.8vw, 46px); font-weight: 900; line-height: 1.3; letter-spacing: -0.5px; word-break: keep-all; }
        .ak-sub { font-size: clamp(15px, 1.6vw, 19px); line-height: 1.8; margin-top: 16px; word-break: keep-all; }

        /* 숫자 밴드 (원비온다 스타일) */
        .ak-statband { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 768px) {
          .ak-statband { grid-template-columns: repeat(2, 1fr); gap: 32px 16px; }
        }

        /* 7단계 */
        .ak-flow-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .ak-flow-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .ak-flow-card { background: white; border: 1px solid ${C.line}; border-radius: 18px; padding: 26px 18px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .ak-flow-num { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 900; margin-bottom: 14px; }

        /* 차별점 */
        .ak-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .ak-feature-card { background: white; border-radius: 22px; padding: 34px 30px; display: flex; flex-direction: column; box-shadow: 0 8px 28px rgba(31,31,31,0.06); }

        /* 학부모 */
        .ak-parent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }

        /* 가격 */
        .ak-price-grid { display: flex; gap: 20px; align-items: stretch; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding: 20px 4px 8px; }
        .ak-price-grid > * { scroll-snap-align: start; flex: 0 0 calc((100% - 60px) / 4); min-width: 240px; }
        .ak-price-card { background: white; border: 1px solid ${C.line}; border-radius: 20px; padding: 36px 28px; display: flex; flex-direction: column; text-align: left; }
        .ak-price-amount { font-size: clamp(32px, 3vw, 44px); font-weight: 900; margin-bottom: 6px; letter-spacing: -0.5px; }
        .ak-price-unit { font-size: 18px; font-weight: 600; color: ${C.grayLight}; }

        /* 교재 마퀴 */
        @keyframes allkill-book-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .allkill-book-marquee:hover .allkill-book-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .allkill-book-track { animation: none !important; }
        }

        /* 반응형 */
        @media (max-width: 900px) {
          .ak-feature-grid { grid-template-columns: 1fr; }
          .ak-parent-grid { grid-template-columns: 1fr; gap: 28px; }
          .ak-price-grid > * { flex: 0 0 80%; }
        }
        @media (max-width: 768px) {
          .ak-hero { padding: 72px 20px 64px !important; }
          .ak-section { padding: 64px 20px !important; }
          .ak-flow-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .ak-flow-grid-3 { grid-template-columns: repeat(2, 1fr); }
          .ak-btn { width: 100%; max-width: 340px; }
        }
        @media (max-width: 480px) {
          .ak-flow-grid-4, .ak-flow-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ fontFamily: "'Pretendard', sans-serif", background: 'white', color: C.ink, overflowX: 'hidden' }}>
        <HeroSection />
        <StatBandSection />
        <FlowSection />
        <FeatureSection />
        <BookCarouselSection books={carouselBooks} />
        <ParentSection />
        <PricingSection vocaCourseId={vocaCourseId} vocaCoursePrice={vocaCoursePrice} selfStudyCourseId={selfStudyCourseId} selfStudyCoursePrice={selfStudyCoursePrice} />
        <FinalCtaSection />
      </div>
    </>
  );
}
