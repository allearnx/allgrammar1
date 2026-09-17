'use client';

import { useState, useMemo } from 'react';
import type { BlogFeedItem, BlogCategory } from '@/types/blog';
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS } from '@/types/blog';
import BlogCard from '@/components/public/blog-card';
import { NAVER_BLOG_URL } from '@/lib/naver-blog-rss';

const PAGE_SIZE = 12;

/** 필터 키: 'all' | 'naver' | BlogCategory */
type FilterKey = 'all' | 'naver' | BlogCategory;

interface BlogListProps {
  items: BlogFeedItem[];
}

function matches(item: BlogFeedItem, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'naver') return item.source === 'naver';
  return item.source === 'site' && item.post.category === filter;
}

function itemKey(item: BlogFeedItem): string {
  return item.source === 'site' ? item.post.id : item.id;
}

export function BlogList({ items }: BlogListProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => items.filter((it) => matches(it, filter)), [items, filter]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const count = (key: FilterKey) => items.filter((it) => matches(it, key)).length;
  const hasNaver = count('naver') > 0;

  const handleFilter = (key: FilterKey) => {
    setFilter(key);
    setVisibleCount(PAGE_SIZE);
  };

  // 자체 글이 하나도 없는 카테고리는 칩을 숨긴다 (빈 탭 방지)
  const siteCategories = BLOG_CATEGORIES.filter((c) => count(c) > 0);

  const chip = (active: boolean) =>
    `px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
      active
        ? 'bg-[#1A73E8] text-white shadow-[0_4px_14px_rgba(26,115,232,0.3)]'
        : 'bg-white text-[#3C4043] hover:bg-[#F8F9FA] border border-[#E8EAED]'
    }`;

  return (
    <>
      {/* 히어로 — 올킬보카 문법 (하늘색 + GmarketSans) */}
      <section className="pt-32 pb-12 text-center bg-[#DFEFFF]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="brand-display font-bold text-4xl sm:text-5xl text-[#1F1F1F] mb-4 tracking-tight">
            블로그<span className="text-[#1A73E8]">.</span>
          </h1>
          <p className="brand-display font-medium text-[clamp(1.05rem,1.9vw,1.35rem)] text-[#3C4043]">
            영어 학습에 도움이 되는 팁과 전략을 확인하세요
          </p>
          {hasNaver && (
            <a
              href={NAVER_BLOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 rounded-full text-sm font-extrabold bg-[#03C75A] text-white shadow-[0_4px_14px_rgba(3,199,90,0.3)] transition-all hover:-translate-y-0.5"
            >
              <span className="font-black">N</span> 네이버 블로그 바로가기
            </a>
          )}
        </div>
      </section>

      {/* 필터 */}
      <section className="max-w-6xl mx-auto px-4 mb-8 mt-10">
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => handleFilter('all')} className={chip(filter === 'all')}>
            전체 ({count('all')})
          </button>
          {hasNaver && (
            <button onClick={() => handleFilter('naver')} className={chip(filter === 'naver')}>
              네이버 블로그 ({count('naver')})
            </button>
          )}
          {siteCategories.map((key) => (
            <button key={key} onClick={() => handleFilter(key)} className={chip(filter === key)}>
              {BLOG_CATEGORY_LABELS[key]} ({count(key)})
            </button>
          ))}
        </div>
      </section>

      {/* 목록 */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[#3C4043] font-bold mb-2">등록된 글이 없습니다</p>
            <p className="text-[#9AA0A6]">다른 카테고리를 선택해보세요</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((item) => (
                <BlogCard key={itemKey(item)} item={item} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-8 py-3 rounded-full text-sm font-bold bg-white text-[#1F1F1F] border border-[#E8EAED] hover:bg-[#F8F9FA] transition-all shadow-sm"
                >
                  더 보기 ({filtered.length - visibleCount}개 남음)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
