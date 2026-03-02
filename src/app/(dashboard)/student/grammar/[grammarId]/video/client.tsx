'use client';

import { useState } from 'react';
import { YouTubePlayer } from '@/components/video/youtube-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, BookOpen, NotebookPen } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface VideoPageClientProps {
  grammar: {
    id: string;
    title: string;
    description: string | null;
    level: { level_number: number; title_ko: string } | null;
  };
  videoId: string;
  grammarId: string;
  initialPosition: number;
  isCompleted: boolean;
}

export function VideoPageClient({
  grammar,
  videoId,
  grammarId,
  initialPosition,
  isCompleted: initialCompleted,
}: VideoPageClientProps) {
  const [completed, setCompleted] = useState(initialCompleted);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {grammar.level && (
          <Badge variant="outline">
            Level {grammar.level.level_number} - {grammar.level.title_ko}
          </Badge>
        )}
        {completed && (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            시청 완료
          </Badge>
        )}
      </div>

      <YouTubePlayer
        videoId={videoId}
        grammarId={grammarId}
        initialPosition={initialPosition}
        onComplete={() => {
          setCompleted(true);
          toast.success('영상 시청을 완료했습니다!');
        }}
      />

      {grammar.description && (
        <p className="text-muted-foreground">{grammar.description}</p>
      )}

      <Card>
        <CardContent className="py-4">
          <h3 className="font-medium mb-3">다음 학습</h3>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/student/grammar/${grammarId}/memory`}>
                <BookOpen className="h-4 w-4 mr-1" />
                암기 학습
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/student/grammar/${grammarId}/textbook`}>
                <NotebookPen className="h-4 w-4 mr-1" />
                교과서 학습
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
