'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const reviewImages = Array.from({ length: 10 }, (_, i) => `/review/naesin/${i + 1}.jpeg`);

export default function NaesinReviewCarousel() {
  return (
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
          bulletClass: 'swiper-pagination-bullet !bg-indigo-300 !opacity-50',
          bulletActiveClass: '!bg-indigo-500 !opacity-100',
        }}
        navigation={{
          prevEl: '.naesin-review-prev',
          nextEl: '.naesin-review-next',
        }}
        breakpoints={{
          640: { slidesPerView: 2, centeredSlides: false },
          1024: { slidesPerView: 3, centeredSlides: false },
        }}
        className="pb-12"
      >
        {reviewImages.map((src, index) => (
          <SwiperSlide key={index}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(30,27,75,0.10), 0 1px 4px rgba(30,27,75,0.06)',
                border: '1px solid #e2e8f0',
              }}
            >
              <Image
                src={src}
                alt={`올인내신 수강 후기 ${index + 1}`}
                width={400}
                height={700}
                className="w-full h-auto"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button className="naesin-review-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all -ml-4 lg:-ml-6">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button className="naesin-review-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all -mr-4 lg:-mr-6">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
