'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { AnimatedSection } from './animated-section';

const reviewImages = Array.from({ length: 13 }, (_, i) => `/review/${i + 1}.png`);

export function ReviewSection() {
  return (
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
  );
}
