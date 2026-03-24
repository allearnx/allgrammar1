import { notFound } from 'next/navigation';
import { isCourseCategory, type CourseCategory } from '@/types/public';
import CourseCategoryPage from '@/components/public/course-category-page';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!isCourseCategory(category)) {
    notFound();
  }

  return <CourseCategoryPage category={category as CourseCategory} />;
}
