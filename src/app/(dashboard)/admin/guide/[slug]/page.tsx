import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { VALID_SLUGS, GUIDE_ENTRIES } from '@/lib/guide-data';
import { GuidePageContent } from '@/components/guide/guide-page-content';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GuideDetailPage({ params }: Props) {
  const user = await requireRole(['admin', 'boss']);
  const { slug } = await params;

  if (!VALID_SLUGS.includes(slug)) notFound();

  return (
    <>
      <Topbar user={user} title={GUIDE_ENTRIES[slug].title} />
      <GuidePageContent slug={slug} />
    </>
  );
}
