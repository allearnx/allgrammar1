'use client';

import Image from 'next/image';
import { AnimatedSection } from './animated-section';

const universityLogos = [
  'University 1.png', 'University 2.jpg', 'University 3.png',
  'University 4.png', 'University 5.png', 'University 6.jpg', 'University 7.jpg',
];

const schoolLogos = [
  'School 1.png', 'School 2.jpg', 'School 3.png', 'School 4.png',
  'School 5.jpg', 'School 6.png', 'School 7.jpg', 'School 8.jpg',
];

export function SchoolMarqueeSection() {
  return (
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
              {universityLogos.map((file, i) => (
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
              {schoolLogos.map((file, i) => (
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
  );
}
