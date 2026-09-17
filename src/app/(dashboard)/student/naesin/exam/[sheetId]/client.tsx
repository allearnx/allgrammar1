'use client';

import { useMemo, useState } from 'react';
import { PlayCircle, CheckCircle2 } from 'lucide-react';
import { ProblemTab } from '@/components/naesin/problem-tab';
import { NaesinYouTubePlayerTracked } from '@/components/naesin/grammar-tab/youtube-player';
import { extractVideoId } from '@/lib/utils/youtube';
import type { NaesinProblemSheet } from '@/types/database';

interface LastAttempt {
  score: number;
  total_questions: number;
  wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
  created_at: string;
}

interface ExamClientProps {
  sheet: NaesinProblemSheet;
  bestScore: number | null;
  lastAttempt: LastAttempt | null;
}

export function ExamClient({ sheet, bestScore, lastAttempt }: ExamClientProps) {
  const bestScoreBySheet = bestScore != null ? { [sheet.id]: bestScore } : {};
  const lastAttemptBySheet = lastAttempt ? { [sheet.id]: lastAttempt } : {};
  // 내신 콕콕 '먼저 보는 영상' — 배정 시트에 video_url이 있으면 문제 위에 시청 추적 플레이어
  const videoId = useMemo(() => (sheet.assigned_student_id && sheet.video_url ? extractVideoId(sheet.video_url) : null), [sheet.assigned_student_id, sheet.video_url]);
  const [videoDone, setVideoDone] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold">{sheet.title}</h2>
      {videoId && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
            {videoDone ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <PlayCircle className="h-4 w-4" />}
            문제 풀기 전에 선생님 설명 영상을 먼저 보세요{videoDone ? ' — 시청 완료' : ''}
          </div>
          <NaesinYouTubePlayerTracked
            videoId={videoId}
            lessonId={sheet.id}
            unitId=""
            progressEndpoint="/api/naesin/external-passage/video-progress"
            onVideoProgress={(_p, completed) => { if (completed) setVideoDone(true); }}
          />
        </div>
      )}
      <ProblemTab
        sheets={[sheet]}
        unitId={sheet.unit_id || null}
        bestScoreBySheet={bestScoreBySheet}
        lastAttemptBySheet={lastAttemptBySheet}
      />
    </div>
  );
}
