'use client';

import ConsultationLink from '@/components/public/consultation-link';
import {
  scheduleData, days, amHours, pmHours, dayBgColors,
  typeColors, typeLabelColors, typeLabels, legendItems,
  type ClassItem,
} from './schedule-data';

function ClassCard({ classItem }: { classItem: ClassItem }) {
  return (
    <div className={`relative bg-white rounded-xl shadow-[0_4px_14px_rgba(31,31,31,0.06)] border border-[#E8EAED] border-l-4 ${typeColors[classItem.type]} p-3 h-full hover:shadow-[0_8px_24px_rgba(31,31,31,0.1)] transition-shadow ${classItem.isClosed ? 'opacity-60' : ''}`}>
      {classItem.isClosed && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="brand-display text-2xl font-bold text-[#D93025]/80 border-[3px] border-[#D93025]/80 rounded-full px-4 py-1 -rotate-12 tracking-widest">
            마감
          </span>
        </span>
      )}
      <div className="flex items-center gap-2 mb-2">
        {classItem.isNew && <span className="w-2 h-2 rounded-full bg-[#D93025] animate-pulse" />}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${typeLabelColors[classItem.type]}`}>
          {typeLabels[classItem.type]}
          {classItem.tags?.includes('국제학교') && ' · 국제'}
        </span>
      </div>
      <p className="font-bold text-[13px] text-[#1F1F1F] leading-snug whitespace-nowrap">{classItem.name}</p>
      {classItem.subName && <p className="font-medium text-[12px] text-[#3C4043] leading-snug whitespace-nowrap">{classItem.subName}</p>}
      <p className="text-[11px] text-[#5F6368] mt-2 font-semibold">{classItem.time}</p>
      {classItem.teacher && <p className="text-[11px] text-[#9AA0A6] mt-0.5">{classItem.teacher}</p>}
    </div>
  );
}

function TimeSlot({ period, hour, hourIdx, totalHours }: { period: string; hour: string; hourIdx: number; totalHours: number }) {
  const isLast = hourIdx === totalHours - 1;
  return (
    <div className="contents">
      <div className={`p-3 text-center font-bold text-[#1F1F1F] border-b border-r border-[#E8EAED] bg-[#F8F9FA] ${isLast ? (period === 'am' ? 'border-b-2 border-b-[#DADCE0]' : 'border-b-0') : ''}`}>
        {hour}시
      </div>
      {days.map((day) => {
        const cell = scheduleData[`${period}-${hour}`]?.[day];
        const isSaturday = day === '토';
        return (
          <div
            key={`${period}-${hour}-${day}`}
            className={`p-2 border-b border-r border-[#E8EAED] last:border-r-0 min-h-[120px] ${dayBgColors[day]} ${isLast ? (period === 'am' ? 'border-b-2 border-b-[#DADCE0]' : 'border-b-0') : ''}`}
          >
            {isSaturday ? (
              <div className="grid grid-cols-2 gap-3">
                {cell?.classes.map((classItem, idx) => <ClassCard key={idx} classItem={classItem} />)}
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
      {/* 히어로 섹션 — 올킬보카 문법 (하늘색 + GmarketSans) */}
      <section className="pt-32 pb-14 px-4 bg-[#DFEFFF]">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block bg-white text-[#174EA6] text-[clamp(0.9rem,1.5vw,1.05rem)] font-extrabold px-6 py-2.5 rounded-full mb-6 shadow-[0_4px_14px_rgba(31,31,31,0.06)]">
            실시간 라이브
          </span>
          <h1 className="brand-display font-bold text-4xl md:text-6xl text-[#1F1F1F] mb-6 tracking-tight">
            수업 <span className="text-[#1A73E8]">시간표</span>
          </h1>
          <p className="brand-display font-medium text-[clamp(1.05rem,1.9vw,1.35rem)] text-[#3C4043] leading-relaxed">
            올라영의 실시간 온라인 수업 시간표를 확인하세요
          </p>
        </div>
      </section>

      {/* 시간표 테이블 */}
      <section className="py-10 px-4 bg-white">
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <div className="min-w-[1200px] rounded-[22px] shadow-[0_10px_32px_rgba(31,31,31,0.08)] overflow-hidden border border-[#E8EAED]">
            {/* 헤더 */}
            <div className="grid grid-cols-[100px_60px_1fr_1fr_1fr_1fr_2fr_1fr] bg-[#F8F9FA] border-b border-[#E8EAED]">
              <div className="p-4 border-r border-[#E8EAED]" />
              <div className="p-4 border-r border-[#E8EAED]" />
              {days.map((day) => (
                <div key={day} className="brand-display p-4 font-bold text-center text-[#1F1F1F] border-r border-[#E8EAED] last:border-r-0">{day}</div>
              ))}
            </div>

            {/* 오전반 */}
            <div className="grid grid-cols-[100px_60px_1fr_1fr_1fr_1fr_2fr_1fr]">
              <div className="row-span-3 bg-[#F8F9FA] flex items-center justify-center font-bold text-[#1F1F1F] border-b border-r border-[#E8EAED]">
                <div className="text-center">
                  <p className="brand-display font-bold">오전반</p>
                  <p className="text-xs text-[#9AA0A6] font-medium">(AM)</p>
                </div>
              </div>
              {amHours.map((hour, idx) => (
                <TimeSlot key={`am-${hour}`} period="am" hour={hour} hourIdx={idx} totalHours={amHours.length} />
              ))}
            </div>

            {/* 오후반 */}
            <div className="grid grid-cols-[100px_60px_1fr_1fr_1fr_1fr_2fr_1fr]">
              <div className="row-span-4 bg-[#F8F9FA] flex items-center justify-center font-bold text-[#1F1F1F] border-r border-[#E8EAED]">
                <div className="text-center">
                  <p className="brand-display font-bold">오후반</p>
                  <p className="text-xs text-[#9AA0A6] font-medium">(PM)</p>
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
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-1 h-4 rounded-full ${item.color}`} />
                <span className="text-sm text-[#3C4043]">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D93025] animate-pulse" />
              <span className="text-sm text-[#3C4043]">신규 개설</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#D93025] rounded-full">마감</span>
              <span className="text-sm text-[#3C4043]">모집 마감</span>
            </div>
          </div>
        </div>
      </section>

      {/* 수업 안내 */}
      <section className="py-16 px-4 bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="brand-display font-bold text-3xl text-[#1F1F1F] mb-12">
            수업 <span className="text-[#1A73E8]">안내</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-5 text-left">
            <div className="bg-white rounded-[22px] p-8 shadow-[0_8px_28px_rgba(31,31,31,0.06)]">
              <h3 className="brand-display font-bold text-xl text-[#1A73E8] mb-4">수업 시간</h3>
              <p className="text-[#3C4043] leading-relaxed">
                평일 오후 5시 ~ 10시<br />
                토요일 오전 9시 ~ 12시<br />
                <span className="text-sm text-[#9AA0A6]">* 시간대는 상담 시 조율 가능</span>
              </p>
            </div>
            <div className="bg-white rounded-[22px] p-8 shadow-[0_8px_28px_rgba(31,31,31,0.06)]">
              <h3 className="brand-display font-bold text-xl text-[#188038] mb-4">수업 구성</h3>
              <p className="text-[#3C4043] leading-relaxed">
                주 1회 / 주 2회 선택 가능<br />
                수업 시간: 60분 ~ 90분<br />
                <span className="text-sm text-[#9AA0A6]">* 레벨에 따라 상이</span>
              </p>
            </div>
            <div className="bg-white rounded-[22px] p-8 shadow-[0_8px_28px_rgba(31,31,31,0.06)]">
              <h3 className="brand-display font-bold text-xl text-[#B06000] mb-4">수업 방식</h3>
              <p className="text-[#3C4043] leading-relaxed">
                Zoom 실시간 화상 수업<br />
                녹화 영상 다시보기 제공<br />
                <span className="text-sm text-[#9AA0A6]">* 태블릿/PC 권장</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="brand-display font-bold text-3xl md:text-4xl text-[#1F1F1F] mb-6">
            원하는 시간대가 있으신가요?
          </h2>
          <p className="brand-display font-medium text-lg text-[#3C4043] mb-9">
            상담을 통해 학생에게 맞는 시간대를 안내해드립니다.
          </p>
          <ConsultationLink
            className="inline-flex items-center px-11 py-[18px] text-[1.05rem] font-extrabold text-[#1F1F1F] bg-[#FDD663] hover:bg-[#FCC934] rounded-full transition-all shadow-[0_6px_20px_rgba(253,214,99,0.5)] hover:-translate-y-0.5"
          >
            무료 상담 신청하기
          </ConsultationLink>
        </div>
      </section>
    </>
  );
}
