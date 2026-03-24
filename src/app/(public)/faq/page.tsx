'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import ConsultationLink from '@/components/public/consultation-link';
import type { FAQ, FAQCategory } from '@/types/public';
import { FAQ_CATEGORY_LABELS } from '@/types/public';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase
      .from('faqs')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        setFaqs((data || []) as FAQ[]);
        setIsLoading(false);
      });
  }, []);

  const toggleFAQ = (id: string) => {
    setOpenFAQs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFAQs = filterCategory === 'all'
    ? faqs
    : faqs.filter((f) => f.category === filterCategory);

  const categoryCount = (cat: string) =>
    cat === 'all' ? faqs.length : faqs.filter((f) => f.category === cat).length;

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="pt-32 pb-12 text-center bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
              자주 묻는 질문
            </span>
          </h1>
          <p className="text-lg text-slate-600">
            궁금한 점이 있으신가요? 아래에서 답변을 찾아보세요
          </p>
        </div>
      </section>

      {/* 카테고리 필터 */}
      <section className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              filterCategory === 'all'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-200'
                : 'bg-white text-slate-600 hover:bg-violet-50 border border-slate-200'
            }`}
          >
            전체 ({categoryCount('all')})
          </button>
          {(Object.entries(FAQ_CATEGORY_LABELS) as [FAQCategory, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterCategory(key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                filterCategory === key
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-200'
                  : 'bg-white text-slate-600 hover:bg-violet-50 border border-slate-200'
              }`}
            >
              {label} ({categoryCount(key)})
            </button>
          ))}
        </div>
      </section>

      {/* FAQ 목록 */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-12 w-12 text-violet-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-slate-600 font-medium mb-2">등록된 FAQ가 없습니다</p>
            <p className="text-slate-400">다른 카테고리를 선택해보세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-violet-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold text-sm">
                      Q
                    </span>
                    <span className="font-semibold text-slate-800 text-lg">{faq.question}</span>
                  </div>
                  <svg
                    className={`w-6 h-6 text-violet-500 flex-shrink-0 ml-4 transition-transform duration-300 ${
                      openFAQs.has(faq.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFAQs.has(faq.id) ? 'max-h-[500px]' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-5">
                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                      <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                        A
                      </span>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 추가 문의 */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            원하는 답변을 찾지 못하셨나요?
          </h2>
          <p className="text-slate-600 mb-8">
            언제든지 편하게 문의해주세요. 친절하게 답변드리겠습니다.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="tel:010-4904-1247"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              전화 문의
            </a>
            <ConsultationLink
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium rounded-xl hover:from-violet-600 hover:to-purple-600 transition-colors shadow-lg shadow-violet-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              상담 신청하기
            </ConsultationLink>
          </div>
        </div>
      </section>
    </>
  );
}
