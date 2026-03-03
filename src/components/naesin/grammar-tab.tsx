'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, PlayCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { loadYouTubeAPI } from '@/lib/youtube/player-api';
import type { NaesinGrammarLesson } from '@/types/database';

interface GrammarTabProps {
  lessons: NaesinGrammarLesson[];
  unitId: string;
  onStageComplete: () => void;
}

export function GrammarTab({ lessons, unitId, onStageComplete }: GrammarTabProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  if (lessons.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 문법 설명이 없습니다.
      </p>
    );
  }

  async function markCompleted(lessonId: string, type: 'video' | 'text') {
    if (completedIds.has(lessonId)) return;

    try {
      const res = await fetch('/api/naesin/grammar/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type }),
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

  return (
    <div className="space-y-6">
      {lessons.map((lesson) => (
        <GrammarLessonCard
          key={lesson.id}
          lesson={lesson}
          isCompleted={completedIds.has(lesson.id)}
          onComplete={() => markCompleted(lesson.id, lesson.content_type)}
        />
      ))}
    </div>
  );
}

interface GrammarLessonCardProps {
  lesson: NaesinGrammarLesson;
  isCompleted: boolean;
  onComplete: () => void;
}

function GrammarLessonCard({ lesson, isCompleted, onComplete }: GrammarLessonCardProps) {
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

        {lesson.content_type === 'video' && lesson.youtube_video_id ? (
          <NaesinYouTubePlayer
            videoId={lesson.youtube_video_id}
            lessonId={lesson.id}
            onComplete={onComplete}
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
                  <Button onClick={onComplete} className="w-full">
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

/**
 * Naesin-specific YouTube player that does NOT save to /api/video-progress.
 * Each instance uses a unique DOM id to avoid collisions.
 */
function NaesinYouTubePlayer({
  videoId,
  lessonId,
  onComplete,
}: {
  videoId: string;
  lessonId: string;
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const completedRef = useRef(false);
  const elementId = `naesin-yt-${lessonId}`;

  useEffect(() => {
    let mounted = true;

    async function init() {
      await loadYouTubeAPI();
      if (!mounted || !containerRef.current) return;

      playerRef.current = new YT.Player(elementId, {
        videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0,
        },
        events: {
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (!mounted) return;
            if (event.data === YT.PlayerState.ENDED && !completedRef.current) {
              completedRef.current = true;
              onComplete();
            }
          },
        },
      });
    }

    init();

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, lessonId, elementId, onComplete]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} id={elementId} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
