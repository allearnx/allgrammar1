'use client';

import { useState, useMemo } from 'react';
import type { BlogPostSummary, BlogCategory } from '@/types/blog';
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS } from '@/types/blog';
import BlogCard from '@/components/public/blog-card';

const PAGE_SIZE = 12;

interface BlogListProps {
  initialPosts: BlogPostSummary[];
}

export function BlogList({ initialPosts }: BlogListProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredPosts = useMemo(
    () =>
      filterCategory === 'all'
        ? initialPosts
        : initialPosts.filter((p) => p.category === filterCategory),
    [initialPosts, filterCategory],
  );

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const categoryCount = (cat: string) =>
    cat === 'all'
      ? initialPosts.length
      : initialPosts.filter((p) => p.category === cat).length;

  const handleCategoryChange = (cat: string) => {
    setFilterCategory(cat);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="pt-32 pb-12 text-center bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
              블로그
            </span>
          </h1>
          <p className="text-lg text-slate-600">
            영어 학습에 도움이 되는 팁과 전략을 확인하세요
          </p>
        </div>
      </section>

      {/* 카테고리 필터 */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              filterCategory === 'all'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-200'
                : 'bg-white text-slate-600 hover:bg-violet-50 border border-slate-200'
            }`}
          >
            전체 ({categoryCount('all')})
          </button>
          {BLOG_CATEGORIES.map((key: BlogCategory) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                filterCategory === key
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-200'
                  : 'bg-white text-slate-600 hover:bg-violet-50 border border-slate-200'
              }`}
            >
              {BLOG_CATEGORY_LABELS[key]} ({categoryCount(key)})
            </button>
          ))}
        </div>
      </section>

      {/* 블로그 목록 */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-100 rounded-full mb-6">
              <svg
                className="w-10 h-10 text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <p className="text-xl text-slate-600 font-medium mb-2">
              등록된 글이 없습니다
            </p>
            <p className="text-slate-400">
              다른 카테고리를 선택해보세요
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-8 py-3 rounded-full text-sm font-medium bg-white text-violet-600 border border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all shadow-sm"
                >
                  더 보기 ({filteredPosts.length - visibleCount}개 남음)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
