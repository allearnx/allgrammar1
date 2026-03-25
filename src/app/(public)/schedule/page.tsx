'use client';

import ConsultationLink from '@/components/public/consultation-link';

type ClassType = 'grammar' | 'reading' | 'international' | 'hackers' | 'guhaeyoung' | 'voca';

interface ClassItem {
  name: string;
  subName?: string;
  time: string;
  teacher: string;
  isNew?: boolean;
  tags?: string[];
  type: ClassType;
}

interface ScheduleCell {
  classes: ClassItem[];
}

const typeColors: Record<ClassType, string> = {
  grammar: 'border-l-violet-500',
  reading: 'border-l-cyan-500',
  international: 'border-l-slate-500',
  hackers: 'border-l-emerald-500',
  guhaeyoung: 'border-l-amber-500',
  voca: 'border-l-rose-500',
};

const typeLabels: Record<ClassType, string> = {
  grammar: '문법',
  reading: '리딩',
  international: '국제',
  hackers: '문법',
  guhaeyoung: '문법',
  voca: '단어',
};

const scheduleData: Record<string, Record<string, ScheduleCell>> = {
  'am-9': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [
      { name: '천일문', subName: '기본', time: '8:40-9:50', teacher: '유혜령 T', type: 'hackers' },
      { name: '리딩 4.0 해외반', time: '9:00-10:20', teacher: '안홍미 T', isNew: true, tags: ['국제학교', '리딩'], type: 'reading' },
      { name: '구해영', subName: '중학영문법 Level 1', time: '9:00-10:20', teacher: '이다은 T', isNew: true, type: 'guhaeyoung' },
    ]},
    '일': { classes: [] },
  },
  'am-10': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [
      { name: '중학 영문법', subName: '3800제 2학년', time: '10:00-11:20', teacher: '유혜령 T', isNew: true, type: 'grammar' },
    ]},
    '일': { classes: [] },
  },
  'am-11': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [] }, '일': { classes: [] },
  },
  'pm-6': {
    '월': { classes: [] },
    '화': { classes: [
      { name: '리딩', time: '5:30-6:50', teacher: '안홍미 T', isNew: true, tags: ['리딩'], type: 'reading' },
    ]},
    '수': { classes: [
      { name: '구해영', subName: '중학영문법 Level 0', time: '6:30-7:50', teacher: '', isNew: true, type: 'guhaeyoung' },
    ]},
    '목': { classes: [] }, '토': { classes: [] }, '일': { classes: [] },
  },
  'pm-7': {
    '월': { classes: [
      { name: '해커스', subName: '중학영문법 2학년', time: '7:00-8:20', teacher: '안홍미 T', isNew: true, type: 'hackers' },
    ]},
    '화': { classes: [] },
    '수': { classes: [
      { name: '중학 영문법', subName: '3800제 3학년', time: '7:00-8:00', teacher: '안홍미 T', isNew: true, type: 'grammar' },
    ]},
    '목': { classes: [
      { name: '리딩 4.0 국내 A반', time: '7:00-8:20', teacher: '안홍미 T', isNew: true, tags: ['리딩'], type: 'reading' },
    ]},
    '토': { classes: [] },
    '일': { classes: [
      { name: '구해영', subName: '독해 Level 3', time: '7:00-8:20', teacher: '황지환 T', isNew: true, type: 'reading' },
    ]},
  },
  'pm-8': {
    '월': { classes: [
      { name: 'Grammar Zone', subName: '고등 기본', time: '8:30-9:50', teacher: '안홍미 T', isNew: true, type: 'hackers' },
    ]},
    '화': { classes: [] },
    '수': { classes: [
      { name: 'G6 Writing', time: '8:30-9:40', teacher: 'Samuel T', isNew: true, tags: ['국제학교'], type: 'international' },
    ]},
    '목': { classes: [] }, '토': { classes: [] },
    '일': { classes: [
      { name: '고2 모의고사', subName: '기출', time: '8:30-9:50', teacher: '황지환 T', isNew: true, type: 'reading' },
    ]},
  },
  'pm-9': {
    '월': { classes: [{ name: '올킬보카', time: '9:00-10:00', teacher: '', type: 'voca' }] },
    '화': { classes: [] },
    '수': { classes: [{ name: '올킬보카', time: '9:00-10:00', teacher: '', type: 'voca' }] },
    '목': { classes: [{ name: '올킬보카', time: '9:00-10:00', teacher: '', type: 'voca' }] },
    '토': { classes: [] },
    '일': { classes: [{ name: '올킬보카', time: '9:00-10:00', teacher: '', type: 'voca' }] },
  },
};

const days = ['월', '화', '수', '목', '토', '일'];
const amHours = ['9', '10', '11'];
const pmHours = ['6', '7', '8', '9'];

const dayBgColors: Record<string, string> = {
  '월': 'bg-rose-50/50', '화': 'bg-amber-50/50', '수': 'bg-emerald-50/50',
  '목': 'bg-sky-50/50', '토': 'bg-violet-50/50', '일': 'bg-orange-50/50',
};

function ClassCard({ classItem }: { classItem: ClassItem }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${typeColors[classItem.type]} p-3 h-full hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2 mb-2">
        {classItem.isNew && <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />}
        <span className="text-[10px] font-medium text-[#86868b] uppercase tracking-wider">
          {typeLabels[classItem.type]}
          {classItem.tags?.includes('국제학교') && ' · 국제'}
        </span>
      </div>
      <p className="font-semibold text-[13px] text-[#1d1d1f] leading-snug">{classItem.name}</p>
      {classItem.subName && <p className="font-medium text-[12px] text-[#424245] leading-snug">{classItem.subName}</p>}
      <p className="text-[11px] text-[#86868b] mt-2 font-medium">{classItem.time}</p>
      {classItem.teacher && <p className="text-[11px] text-[#86868b] mt-0.5">{classItem.teacher}</p>}
    </div>
  );
}

function TimeSlot({ period, hour, hourIdx, totalHours }: { period: string; hour: string; hourIdx: number; totalHours: number }) {
  const isLast = hourIdx === totalHours - 1;
  return (
    <div className="contents">
      <div className={`p-3 text-center font-semibold text-[#1d1d1f] border-b border-r border-gray-100 bg-[#fafafa] ${isLast ? (period === 'am' ? 'border-b-2 border-b-gray-200' : 'border-b-0') : ''}`}>
        {hour}시
      </div>
      {days.map((day) => {
        const cell = scheduleData[`${period}-${hour}`]?.[day];
        const isSaturday = day === '토';
        return (
          <div
            key={`${period}-${hour}-${day}`}
            className={`p-2 border-b border-r border-gray-100 last:border-r-0 min-h-[120px] ${dayBgColors[day]} ${isLast ? (period === 'am' ? 'border-b-2 border-b-gray-200' : 'border-b-0') : ''}`}
          >
            {isSaturday ? (
              <div className="grid grid-cols-3 gap-2 h-full">
                {[0, 1, 2].map((slotIdx) => (
                  <div key={slotIdx}>
                    {cell?.classes[slotIdx] && <ClassCard classItem={cell.classes[slotIdx]} />}
                  </div>
                ))}
              </div>
            ) : (
              cell?.classes.map((classItem, idx) => <ClassCard key={idx} classItem={classItem} />)
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="pt-32 pb-12 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-[#1d1d1f] mb-6 tracking-tight">
            수업 <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">시간표</span>
          </h1>
          <p className="text-xl text-[#424245] leading-relaxed">
            올라영의 실시간 온라인 수업 시간표를 확인하세요
          </p>
        </div>
      </section>

      {/* 시간표 테이블 */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <div className="min-w-[1200px] rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            {/* 헤더 */}
            <div className="grid grid-cols-[100px_60px_1fr_1fr_1fr_1fr_3fr_1fr] bg-[#e8e8ed] border-b border-gray-200">
              <div className="p-4 border-r border-gray-100" />
              <div className="p-4 border-r border-gray-100" />
              {days.map((day) => (
                <div key={day} className="p-4 font-bold text-center text-[#1d1d1f] border-r border-gray-100 last:border-r-0">{day}</div>
              ))}
            </div>

            {/* 오전반 */}
            <div className="grid grid-cols-[100px_60px_1fr_1fr_1fr_1fr_3fr_1fr]">
              <div className="row-span-3 bg-[#e8e8ed] flex items-center justify-center font-bold text-[#1d1d1f] border-b border-r border-gray-200">
                <div className="text-center">
                  <p>오전반</p>
                  <p className="text-xs text-[#86868b] font-medium">(AM)</p>
                </div>
              </div>
              {amHours.map((hour, idx) => (
                <TimeSlot key={`am-${hour}`} period="am" hour={hour} hourIdx={idx} totalHours={amHours.length} />
              ))}
            </div>

            {/* 오후반 */}
            <div className="grid grid-cols-[100px_60px_1fr_1fr_1fr_1fr_3fr_1fr]">
              <div className="row-span-4 bg-[#e8e8ed] flex items-center justify-center font-bold text-[#1d1d1f] border-r border-gray-200">
                <div className="text-center">
                  <p>오후반</p>
                  <p className="text-xs text-[#86868b] font-medium">(PM)</p>
                </div>
              </div>
              {pmHours.map((hour, idx) => (
                <TimeSlot key={`pm-${hour}`} period="pm" hour={hour} hourIdx={idx} totalHours={pmHours.length} />
              ))}
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="max-w-6xl mx-auto mt-8">
          <div className="flex flex-wrap gap-6 justify-center items-center">
            {[
              { color: 'bg-violet-500', label: '3800제' },
              { color: 'bg-emerald-500', label: '해커스 / Grammar Zone' },
              { color: 'bg-amber-500', label: '구해영' },
              { color: 'bg-cyan-500', label: '리딩' },
              { color: 'bg-rose-500', label: '단어' },
              { color: 'bg-slate-500', label: '국제학교' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-1 h-4 rounded-full ${item.color}`} />
                <span className="text-sm text-[#424245]">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-sm text-[#424245]">신규 개설</span>
            </div>
          </div>
        </div>
      </section>

      {/* 수업 안내 */}
      <section className="py-16 px-4 bg-[#f5f5f7]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1d1d1f] text-center mb-12">
            수업 <span className="text-violet-600">안내</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-4">수업 시간</h3>
              <p className="text-[#424245] leading-relaxed">
                평일 오후 5시 ~ 10시<br />
                토요일 오전 9시 ~ 12시<br />
                <span className="text-sm text-[#86868b]">* 시간대는 상담 시 조율 가능</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-4">수업 구성</h3>
              <p className="text-[#424245] leading-relaxed">
                주 1회 / 주 2회 선택 가능<br />
                수업 시간: 60분 ~ 90분<br />
                <span className="text-sm text-[#86868b]">* 레벨에 따라 상이</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-4">수업 방식</h3>
              <p className="text-[#424245] leading-relaxed">
                Zoom 실시간 화상 수업<br />
                녹화 영상 다시보기 제공<br />
                <span className="text-sm text-[#86868b]">* 태블릿/PC 권장</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] mb-6">
            원하는 시간대가 있으신가요?
          </h2>
          <p className="text-lg text-[#424245] mb-8">
            상담을 통해 학생에게 맞는 시간대를 안내해드립니다.
          </p>
          <ConsultationLink
            className="inline-block px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 rounded-full transition-all shadow-lg shadow-violet-300/30"
          >
            무료 상담 신청하기
          </ConsultationLink>
        </div>
      </section>
    </>
  );
}
