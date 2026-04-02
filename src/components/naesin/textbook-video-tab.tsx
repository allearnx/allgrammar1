'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { StageProgressBar } from './stage-progress-bar';
import { NaesinYouTubePlayerTracked } from './grammar-tab/youtube-player';
import type { NaesinTextbookVideo, NaesinTextbookVideoProgress } from '@/types/database';

interface TextbookVideoTabProps {
  videos: NaesinTextbookVideo[];
  unitId: string;
  onStageComplete: () => void;
  videoProgress?: NaesinTextbookVideoProgress[];
}

export function TextbookVideoTab({ videos, unitId, onStageComplete, videoProgress }: TextbookVideoTabProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    videoProgress?.forEach((vp) => {
      if (vp.completed) set.add(vp.video_id);
    });
    return set;
  });
  const [watchPercents, setWatchPercents] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    videoProgress?.forEach((vp) => {
      map[vp.video_id] = vp.watch_percent;
    });
    return map;
  });

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <PlayCircle className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          등록된 교과서 설명 영상이 없습니다.
        </p>
      </div>
    );
  }

  function handleVideoProgress(videoId: string, percent: number, completed: boolean) {
    setWatchPercents((prev) => ({ ...prev, [videoId]: percent }));
    if (completed && !completedIds.has(videoId)) {
      setCompletedIds((prev) => new Set(prev).add(videoId));
      const newCompleted = new Set(completedIds).add(videoId);
      if (videos.every((v) => newCompleted.has(v.id))) {
        toast.success('교과서 설명 영상 단계를 완료했습니다!');
        onStageComplete();
      }
    }
  }

  return (
    <div className="space-y-6">
      {videos.map((video) => {
        const isCompleted = completedIds.has(video.id);
        const watchPercent = watchPercents[video.id] ?? 0;
        const progress = videoProgress?.find((vp) => vp.video_id === video.id);

        // Map NaesinTextbookVideoProgress to NaesinGrammarVideoProgress shape for the player
        const initialProgress = progress
          ? {
              id: progress.id,
              student_id: progress.student_id,
              lesson_id: progress.video_id,
              watch_percent: progress.watch_percent,
              max_position_reached: progress.max_position_reached,
              duration: progress.duration,
              cumulative_watch_seconds: progress.cumulative_watch_seconds,
              last_position: progress.last_position,
              completed: progress.completed,
              updated_at: progress.updated_at,
            }
          : undefined;

        return (
          <Card key={video.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">{video.title}</h3>
                </div>
                {isCompleted && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    완료
                  </Badge>
                )}
              </div>

              {!isCompleted && watchPercent > 0 && (
                <div className="mb-3">
                  <StageProgressBar label="시청 진도" percent={watchPercent} />
                </div>
              )}

              {video.youtube_video_id ? (
                <NaesinYouTubePlayerTracked
                  videoId={video.youtube_video_id}
                  lessonId={video.id}
                  unitId={unitId}
                  onVideoProgress={(percent, completed) =>
                    handleVideoProgress(video.id, percent, completed)
                  }
                  initialProgress={initialProgress}
                  progressEndpoint="/api/naesin/textbook-video/progress"
                />
              ) : (
                <p className="text-sm text-muted-foreground">영상이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
