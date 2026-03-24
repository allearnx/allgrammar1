'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle, PlayCircle, FileText, GraduationCap, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { StageProgressBar } from '../stage-progress-bar';
import { NaesinYouTubePlayerTracked } from './youtube-player';
import { SocraticChatbot } from './socratic-chatbot';
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
  const [showTutorPopup, setShowTutorPopup] = useState(false);

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <GraduationCap className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          등록된 문법 설명이 없습니다.
        </p>
      </div>
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
    } catch (err) {
      logger.error('naesin.grammar_tab', { error: err instanceof Error ? err.message : String(err) });
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  function handleVideoProgress(lessonId: string, percent: number, completed: boolean) {
    setWatchPercents((prev) => ({ ...prev, [lessonId]: percent }));
    if (completed && !completedIds.has(lessonId)) {
      setCompletedIds((prev) => new Set(prev).add(lessonId));
      setShowTutorPopup(true);
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
    <>
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

      <AlertDialog open={showTutorPopup} onOpenChange={setShowTutorPopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">영상 시청 완료!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              이제 아래 <strong>AI 문법 튜터</strong>와 대화하며 배운 내용을 확인하세요.
              <br />
              AI 튜터는 <strong className="text-rose-500">필수 단계</strong>이니 꼭 완료해 주세요!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

        <SocraticChatbot lessonId={lesson.id} lessonTitle={lesson.title} />
      </CardContent>
    </Card>
  );
}
