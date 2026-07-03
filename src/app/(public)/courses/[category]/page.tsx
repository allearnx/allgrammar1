import { notFound, redirect } from 'next/navigation';
import { isCourseCategory, type CourseCategory } from '@/types/public';
import CourseCategoryPage from '@/components/public/course-category-page';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  // 올킬보카 판매 진입로 통합: 구 /courses/voca 목록 → /allkill 하나로 리다이렉트
  if (category === 'voca') {
    redirect('/allkill');
  }

  if (!isCourseCategory(category)) {
    notFound();
  }

  return <CourseCategoryPage category={category as CourseCategory} />;
}
