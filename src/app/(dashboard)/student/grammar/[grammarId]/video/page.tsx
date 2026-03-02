import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound } from 'next/navigation';
import { VideoPageClient } from './client';

interface Props {
  params: Promise<{ grammarId: string }>;
}

export default async function VideoPage({ params }: Props) {
  const { grammarId } = await params;
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: grammar } = await supabase
    .from('grammars')
    .select('*, level:levels(*)')
    .eq('id', grammarId)
    .single();

  if (!grammar || !grammar.youtube_video_id) notFound();

  const { data: progress } = await supabase
    .from('student_progress')
    .select('video_last_position, video_completed')
    .eq('student_id', user.id)
    .eq('grammar_id', grammarId)
    .single();

  return (
    <>
      <Topbar user={user} title={grammar.title} />
      <div className="p-4 md:p-6 space-y-4 max-w-4xl">
        <VideoPageClient
          grammar={grammar}
          videoId={grammar.youtube_video_id}
          grammarId={grammarId}
          initialPosition={progress?.video_last_position || 0}
          isCompleted={progress?.video_completed || false}
        />
      </div>
    </>
  );
}
