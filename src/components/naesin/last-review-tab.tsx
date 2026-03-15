'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, PlayCircle, BookOpen, Brain } from 'lucide-react';
import { MCQOptionList } from '@/components/shared/mcq-option-list';
import { ProblemTab } from './problem-tab';
import { WrongAnswerReview } from './wrong-answer-review';
import type { NaesinProblemSheet, NaesinSimilarProblem, NaesinLastReviewContent, NaesinProblemQuestion } from '@/types/database';

interface LastReviewTabProps {
  unitId: string;
  problemSheets: NaesinProblemSheet[];
  similarProblems: NaesinSimilarProblem[];
  reviewContent: NaesinLastReviewContent[];
}

export function LastReviewTab({
  unitId,
  problemSheets,
  similarProblems,
  reviewContent,
}: LastReviewTabProps) {
  const [activeTab, setActiveTab] = useState('wrong-answers');
  const approvedProblems = similarProblems.filter((sp) => sp.status === 'approved');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-red-500" />
        <h3 className="font-semibold text-lg">직전보강</h3>
        <Badge variant="destructive" className="text-xs">D-3</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wrong-answers" className="text-xs">
            틀린 문제
          </TabsTrigger>
          <TabsTrigger value="problems" className="text-xs" disabled={problemSheets.length === 0}>
            문제풀이
          </TabsTrigger>
          <TabsTrigger value="similar" className="text-xs" disabled={approvedProblems.length === 0}>
            AI 유사문제
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs" disabled={reviewContent.length === 0}>
            보충자료
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wrong-answers" className="mt-4">
          <WrongAnswerReview unitId={unitId} />
        </TabsContent>

        <TabsContent value="problems" className="mt-4">
          <ProblemTab sheets={problemSheets} unitId={unitId} />
        </TabsContent>

        <TabsContent value="similar" className="mt-4">
          <SimilarProblemView problems={approvedProblems} />
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <ReviewContentView content={reviewContent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// AI Similar Problems
// ============================================

function SimilarProblemView({ problems }: { problems: NaesinSimilarProblem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (problems.length === 0) {
    return <p className="text-center text-muted-foreground py-8">승인된 유사문제가 없습니다.</p>;
  }

  const problem = problems[currentIndex];
  const q = problem.question_data as NaesinProblemQuestion;

  function handleSelect(answer: string) {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
  }

  function handleNext() {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {problems.length}</span>
        {problem.grammar_tag && (
          <Badge variant="outline">{problem.grammar_tag}</Badge>
        )}
      </div>

      <Card>
        <CardContent className="py-6">
          <p className="text-lg font-medium whitespace-pre-wrap">{q.question}</p>
        </CardContent>
      </Card>

      {q.options && q.options.length > 0 && (
        <MCQOptionList
          options={q.options}
          selectedAnswer={selectedAnswer}
          correctAnswer={String(q.answer)}
          showResult={showResult}
          onSelect={(v) => handleSelect(v as string)}
          className="max-w-lg mx-auto"
        />
      )}

      {showResult && q.explanation && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">해설:</span> {q.explanation}
            </p>
          </CardContent>
        </Card>
      )}

      {showResult && currentIndex < problems.length - 1 && (
        <div className="text-center">
          <Button onClick={handleNext}>다음 문제</Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Teacher Review Content
// ============================================

function ReviewContentView({ content }: { content: NaesinLastReviewContent[] }) {
  if (content.length === 0) {
    return <p className="text-center text-muted-foreground py-8">보충 자료가 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {content.map((item) => (
        <Card key={item.id}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              {item.content_type === 'video' && <PlayCircle className="h-4 w-4 text-blue-500" />}
              {item.content_type === 'pdf' && <FileText className="h-4 w-4 text-orange-500" />}
              {item.content_type === 'text' && <BookOpen className="h-4 w-4 text-green-500" />}
              <h4 className="font-medium text-sm">{item.title}</h4>
            </div>

            {item.content_type === 'video' && item.youtube_video_id && (
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${item.youtube_video_id}`}
                  className="absolute inset-0 w-full h-full"
                  title={item.title}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}

            {item.content_type === 'pdf' && item.pdf_url && (
              <iframe
                src={item.pdf_url}
                className="w-full h-[400px] rounded-lg border"
                title={item.title}
              />
            )}

            {item.content_type === 'text' && item.text_content && (
              <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
                {item.text_content}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
