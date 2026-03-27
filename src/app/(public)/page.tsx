'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import ConsultationForm from '@/components/public/consultation-form';

// 후기 이미지 (1.png ~ 13.png)
const reviewImages = Array.from({ length: 13 }, (_, i) => `/review/${i + 1}.png`);

// 커리큘럼 데이터
const curriculumData = [
  {
    title: '실시간 수업',
    shortDesc: '실시간 수업으로 학생의\n수업 참여도+ 집중력 UP',
    detailTitle: '실시간 수업으로 학생의\n수업 참여도+ 집중력 UP',
    detailDesc: '듣기만 하는 인강은 가라~ 인강은 귀찮기도 하고.. 자꾸 딴 생각이 나기도 하고... 선생님과 다른 학생들과의 실시간 수업은 그럴 시간이 없어요! 철저한 개념 이해를 위한 실시간 필기와 질문과 대답을 통한 소통이 수업의 몰입도를 올려 줍니다.',
    icon: '🎥',
  },
  {
    title: '1:1 피드백',
    shortDesc: '숙제와 오답 1:1 피드백으로\n진짜 영어실력을 올리세요!',
    detailTitle: '숙제와 오답 1:1 피드백\n으로 진짜 영어 실력을\n올리세요.',
    detailDesc: '매주 수업 후 내주는 숙제는 많은 부모님들이 정말 왜 올라영으로 문법이 끝날 수 있는지 알겠다고 입모아 말씀하세요. 게다가 오답은 피드백 설명이 제공됩니다. 다음 수업 전까지 오답 설명까지 완료! 아이들이 모르는 것을 다 해결하고 다음 수업을 들을 수 있어 수업의 효과를 최대로 끌어 올릴 수 있어요!',
    icon: '💡',
  },
  {
    title: '실력&점수 UP',
    shortDesc: '실력만큼 점수도 올리세요!',
    detailTitle: '실력만큼 점수도\n올리세요!',
    detailDesc: '실력은 올라갔다는데 점수는 안 오른다?? 실력만큼 내신 점수가 나오지 않는다면 안되겠죠? 올라영은 성취감에서 자신감이 나온다고 믿습니다. 한번이라도 점수가 오른 아이들은 눈빛이 다르거든요!',
    icon: '🏆',
  },
];

// 스크롤 애니메이션 훅
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [showEventPopup, setShowEventPopup] = useState(false);

  useEffect(() => {
    const hideUntil = localStorage.getItem('eventPopupHideUntil');
    const now = new Date().getTime();
    if (!hideUntil || now > parseInt(hideUntil)) {
      setShowEventPopup(true); // eslint-disable-line react-hooks/set-state-in-effect -- reading localStorage
    }
  }, []);

  const closeEventPopup = () => setShowEventPopup(false);

  const hideEventPopupForToday = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    localStorage.setItem('eventPopupHideUntil', tomorrow.getTime().toString());
    setShowEventPopup(false);
  };

  const scrollToForm = () => {
    const element = document.getElementById('consultation-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* ===== 1. 히어로 배너 ===== */}
      <section className="relative min-h-[70vh] bg-white pt-32 overflow-hidden flex items-end">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex flex-col lg:flex-row items-end gap-12 lg:gap-16">
            <div className="flex-[3] text-center lg:text-left self-center pb-12">
              <AnimatedSection>
                <p className="text-[#86868b] text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight mb-8">
                  온라인 실시간 수업
                </p>
              </AnimatedSection>
              <AnimatedSection delay={100}>
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-10">
                  <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                    성적의 한계를<br />뛰어넘다.
                  </span>
                </h1>
              </AnimatedSection>
              <AnimatedSection delay={150}>
                <p className="text-[#1d1d1f] text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                  영어, 이제는 온라인에서 끝내세요.
                </p>
              </AnimatedSection>
            </div>
            <AnimatedSection delay={200} className="flex-[2] flex justify-center lg:justify-end">
              <div className="w-full max-w-md lg:max-w-lg">
                <Image
                  src="/hero-teacher.png"
                  alt="올라운더 영어 선생님"
                  width={600}
                  height={750}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== 2. 수강생 후기 ===== */}
      <section className="py-24 px-4 bg-violet-50 relative">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1d1d1f] mb-5 tracking-tight">
              올라영과 함께<br className="md:hidden" />
              <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent"> 기적</span>을 만든 학생들
            </h2>
            <p className="text-[#86868b] text-lg max-w-xl mx-auto leading-relaxed">
              실제 수강생들의 생생한 후기를 확인하세요
            </p>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="relative">
              <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                spaceBetween={24}
                slidesPerView={1}
                centeredSlides={true}
                loop={true}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                pagination={{
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet !bg-violet-300 !opacity-50',
                  bulletActiveClass: '!bg-violet-500 !opacity-100',
                }}
                navigation={{
                  prevEl: '.swiper-button-prev-custom',
                  nextEl: '.swiper-button-next-custom',
                }}
                breakpoints={{
                  640: { slidesPerView: 2, centeredSlides: false },
                  1024: { slidesPerView: 3, centeredSlides: false },
                }}
                className="pb-12"
              >
                {reviewImages.map((src, index) => (
                  <SwiperSlide key={index}>
                    <div className="rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50 bg-white border border-gray-100">
                      <Image
                        src={src}
                        alt={`수강생 후기 ${index + 1}`}
                        width={400}
                        height={500}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-violet-500 hover:bg-violet-50 transition-all -ml-4 lg:-ml-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-violet-500 hover:bg-violet-50 transition-all -mr-4 lg:-mr-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== 3. 대표 강의 (커리큘럼) ===== */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1d1d1f] mb-5 tracking-tight">
              올라영만의<br className="md:hidden" />
              <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent"> 특별한</span> 3가지
            </h2>
            <p className="text-[#86868b] text-lg max-w-xl mx-auto leading-relaxed">
              올라영이 특별한 이유, 직접 확인해보세요
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {curriculumData.map((item, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="group h-[480px] cursor-pointer" style={{ perspective: '1000px' }}>
                  <div
                    className="relative w-full h-full transition-transform duration-700 ease-out group-hover:[transform:rotateY(180deg)]"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div
                      className="absolute inset-0 bg-white rounded-[44px] p-8 flex flex-col items-center text-center justify-center"
                      style={{
                        backfaceVisibility: 'hidden',
                        boxShadow: '0 0 0 2px #1d1d1f, 0 0 0 6px #a1a1aa, 0 25px 50px -12px rgba(0,0,0,0.15)'
                      }}
                    >
                      <div className="text-[120px] mb-6 leading-none">{item.icon}</div>
                      <h3 className="text-4xl md:text-5xl font-black text-[#1d1d1f] mb-4 tracking-tight leading-tight">{item.title}</h3>
                      <p className="text-[#424245] text-xl md:text-2xl font-bold leading-snug px-2 whitespace-pre-line">{item.shortDesc}</p>
                    </div>
                    <div
                      className="absolute inset-0 bg-violet-50 rounded-[44px] p-6 md:p-8 flex flex-col justify-center"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        boxShadow: '0 0 0 2px #1d1d1f, 0 0 0 6px #a1a1aa, 0 25px 50px -12px rgba(0,0,0,0.15)'
                      }}
                    >
                      <h4 className="text-2xl md:text-3xl font-black mb-4 leading-tight whitespace-pre-line text-[#424245]">{item.detailTitle}</h4>
                      <p className="text-[#424245] text-lg md:text-xl font-semibold leading-relaxed">{item.detailDesc}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. 학교 로고 마키 ===== */}
      <section className="py-20 px-4 bg-[#f5f5f7] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1d1d1f] mb-5 tracking-tight">
              올라영 학생들의<br className="md:hidden" />
              <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent"> 합격 스토리</span>
            </h2>
            <p className="text-[#86868b] text-lg max-w-xl mx-auto leading-relaxed">
              올라영과 함께한 학생들이 진학한 학교입니다
            </p>
          </AnimatedSection>
        </div>

        <div className="marquee-wrapper mb-8">
          <div className="marquee-track marquee-left">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-12 px-6">
                {[
                  'University 1.png', 'University 2.jpg', 'University 3.png',
                  'University 4.png', 'University 5.png', 'University 6.jpg', 'University 7.jpg',
                ].map((file, i) => (
                  <div key={`${setIdx}-${i}`} className="flex-shrink-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Image
                      src={`/university/${file}`}
                      alt={`대학교 ${i + 1}`}
                      width={140}
                      height={80}
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="marquee-wrapper">
          <div className="marquee-track marquee-right">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-12 px-6">
                {[
                  'School 1.png', 'School 2.jpg', 'School 3.png', 'School 4.png',
                  'School 5.jpg', 'School 6.png', 'School 7.jpg', 'School 8.jpg',
                ].map((file, i) => (
                  <div key={`${setIdx}-${i}`} className="flex-shrink-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Image
                      src={`/school/${file}`}
                      alt={`학교 ${i + 1}`}
                      width={140}
                      height={80}
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. 상담 신청 폼 ===== */}
      <ConsultationForm />

      {/* ===== 플로팅 상담 버튼 ===== */}
      <button
        onClick={scrollToForm}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-2xl shadow-violet-300/40 hover:shadow-violet-400/50 transition-all duration-300 hover:scale-105"
        aria-label="상담 신청하기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="hidden sm:inline">상담 신청</span>
      </button>

      {/* ===== 이벤트 팝업 ===== */}
      {showEventPopup && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto"
          onClick={closeEventPopup}
        >
          <div
            className="relative w-full max-w-5xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeEventPopup}
              className="absolute -top-10 right-0 md:right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row gap-4 items-start justify-center">
              <div className="w-full md:w-auto md:max-w-xl rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/popup/event.png"
                  alt="이벤트 안내 1"
                  width={1080}
                  height={960}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="w-full md:w-auto md:max-w-xl rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/popup/event2.png"
                  alt="이벤트 안내 2"
                  width={1080}
                  height={1350}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>

            <div className="flex mt-4 gap-2 max-w-md mx-auto">
              <button
                onClick={hideEventPopupForToday}
                className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl backdrop-blur-sm transition-colors"
              >
                오늘 하루 보지 않기
              </button>
              <button
                onClick={closeEventPopup}
                className="flex-1 py-3 bg-white hover:bg-gray-100 text-gray-800 text-sm font-medium rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
