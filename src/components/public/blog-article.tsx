'use client';

import { useEffect, useRef } from 'react';

interface BlogArticleProps {
  content: string;
  slug: string;
}

export default function BlogArticle({ content, slug }: BlogArticleProps) {
  const viewTracked = useRef(false);

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;

    // Fire-and-forget view count increment
    fetch('/api/public/blog/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {
      // Silently ignore errors — view count is non-critical
    });
  }, [slug]);

  return (
    <article
      className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-violet-300 prose-blockquote:text-slate-600 prose-strong:text-slate-800 prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
