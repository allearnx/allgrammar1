'use client';

import Image from 'next/image';
import { AnimatedSection } from './animated-section';
import { G } from '../google-palette';

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
    // 합격 = 성과 → 초록. 배경은 하늘색으로 흰 후기 섹션과 끊는다
    <section className="py-20 px-4 overflow-hidden" style={{ background: G.blueLight }}>
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-14">
          <h2 className="brand-display text-4xl md:text-5xl font-bold mb-5 tracking-tight" style={{ color: G.ink, wordBreak: 'keep-all' }}>
            올라영 학생들의<br className="md:hidden" />
            <span style={{ color: G.green }}> 합격 스토리</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: G.gray }}>
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
