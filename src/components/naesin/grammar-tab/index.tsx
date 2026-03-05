'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, PlayCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { StageProgressBar } from '../stage-progress-bar';
import { NaesinYouTubePlayerTracked } from './youtube-player';
import type { NaesinGrammarLesson, NaesinGrammarVideoProgress } from '@/types/database';

interface GrammarTabProps {
  lessons: NaesinGrammarLesson[];
  unitId: string;
  onStageComplete: () => void;
  videoProgress?: NaesinGrammarVideoProgress[];
}

export function GrammarTab({ lessons, unitId, onStageComplete, videoProgress }: GrammarTabProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    videoProgress?.forEach((vp) => {
      if (vp.completed) set.add(vp.lesson_id);
    });
    return set;
  });
  const [watchPercents, setWatchPercents] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    videoProgress?.forEach((vp) => {
      map[vp.lesson_id] = vp.watch_percent;
    });
    return map;
  });

  if (lessons.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 문법 설명이 없습니다.
      </p>
    );
  }

  async function markTextCompleted(lessonId: string) {
    if (completedIds.has(lessonId)) return;

    try {
      const res = await fetch('/api/naesin/grammar/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type: 'text' }),
      });
      const data = await res.json();
      setCompletedIds((prev) => new Set(prev).add(lessonId));
      if (data.grammarCompleted) {
        toast.success('문법 설명 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch {
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  function handleVideoProgress(lessonId: string, percent: number, completed: boolean) {
    setWatchPercents((prev) => ({ ...prev, [lessonId]: percent }));
    if (completed && !completedIds.has(lessonId)) {
      setCompletedIds((prev) => new Set(prev).add(lessonId));
      // Check if all videos are complete
      const newCompleted = new Set(completedIds).add(lessonId);
      const videoLessons = lessons.filter((l) => l.content_type === 'video');
      if (videoLessons.every((l) => newCompleted.has(l.id))) {
        toast.success('문법 설명 단계를 완료했습니다!');
        onStageComplete();
      }
    }
  }

  return (
    <div className="space-y-6">
      {lessons.map((lesson) => (
        <GrammarLessonCard
          key={lesson.id}
          lesson={lesson}
          isCompleted={completedIds.has(lesson.id)}
          watchPercent={watchPercents[lesson.id] ?? 0}
          unitId={unitId}
          onTextComplete={() => markTextCompleted(lesson.id)}
          onVideoProgress={(percent, completed) =>
            handleVideoProgress(lesson.id, percent, completed)
          }
          initialProgress={videoProgress?.find((vp) => vp.lesson_id === lesson.id)}
        />
      ))}
    </div>
  );
}

interface GrammarLessonCardProps {
  lesson: NaesinGrammarLesson;
  isCompleted: boolean;
  watchPercent: number;
  unitId: string;
  onTextComplete: () => void;
  onVideoProgress: (percent: number, completed: boolean) => void;
  initialProgress?: NaesinGrammarVideoProgress;
}

function GrammarLessonCard({
  lesson,
  isCompleted,
  watchPercent,
  unitId,
  onTextComplete,
  onVideoProgress,
  initialProgress,
}: GrammarLessonCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {lesson.content_type === 'video' ? (
              <PlayCircle className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-orange-500" />
            )}
            <h3 className="font-medium">{lesson.title}</h3>
          </div>
          {isCompleted && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              완료
            </Badge>
          )}
        </div>

        {lesson.content_type === 'video' && !isCompleted && watchPercent > 0 && (
          <div className="mb-3">
            <StageProgressBar label="시청 진도" percent={watchPercent} />
          </div>
        )}

        {lesson.content_type === 'video' && lesson.youtube_video_id ? (
          <NaesinYouTubePlayerTracked
            videoId={lesson.youtube_video_id}
            lessonId={lesson.id}
            unitId={unitId}
            onVideoProgress={onVideoProgress}
            initialProgress={initialProgress}
          />
        ) : lesson.content_type === 'text' && lesson.text_content ? (
          <div className="space-y-3">
            {!expanded ? (
              <Button variant="outline" onClick={() => setExpanded(true)} className="w-full">
                텍스트 보기
              </Button>
            ) : (
              <>
                <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
                  {lesson.text_content}
                </div>
                {!isCompleted && (
                  <Button onClick={onTextComplete} className="w-full">
                    읽기 완료
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">콘텐츠가 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}
