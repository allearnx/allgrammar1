'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { VocaVocabulary, VocaIdiom } from '@/types/voca';

// ── Question Types ──

type QuestionType =
  | 'mc_synonym'       // 1. 5지선다 유의어
  | 'mc_antonym'       // 2. 5지선다 반의어
  | 'short_synonym'    // 3. 단답형 유의어
  | 'short_antonym'    // 4. 단답형 반의어
  | 'fill_blank'       // 5. 문장 빈칸
  | 'idiom_en_to_ko'   // 6. 숙어 영→한
  | 'idiom_ko_to_en'   // 7. 숙어 한→영
  | 'idiom_example_translate' // 8. 숙어 예문 해석
  | 'idiom_writing';   // 9. 숙어 영작

interface BaseQuestion {
  type: QuestionType;
  word: string;
  prompt: string;
  reference: string;
}

interface MCQuestion extends BaseQuestion {
  type: 'mc_synonym' | 'mc_antonym';
  choices: string[];
  correctIndex: number;
}

interface ShortQuestion extends BaseQuestion {
  type: 'short_synonym' | 'short_antonym' | 'fill_blank';
  acceptedAnswers: string[];
}

interface AIQuestion extends BaseQuestion {
  type: 'idiom_en_to_ko' | 'idiom_ko_to_en' | 'idiom_example_translate' | 'idiom_writing';
}

type Question = MCQuestion | ShortQuestion | AIQuestion;

interface QuestionResult {
  question: Question;
  studentAnswer: string;
  score: number;
  feedback: string;
}

// ── Question Generation ──

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(vocabulary: VocaVocabulary[]): Question[] {
  const questions: Question[] = [];

  const withSynonyms = vocabulary.filter((v) => v.synonyms);
  const withAntonyms = vocabulary.filter((v) => v.antonyms);
  const withExample = vocabulary.filter((v) => v.example_sentence);
  const withIdioms = vocabulary.filter((v) => v.idioms && v.idioms.length > 0);

  // All synonym/antonym values for distractor generation
  const allSynonyms = withSynonyms.map((v) => v.synonyms!.split(',')[0].trim()).filter(Boolean);
  const allAntonyms = withAntonyms.map((v) => v.antonyms!.split(',')[0].trim()).filter(Boolean);
  const allWords = vocabulary.map((v) => v.front_text);

  // 1. MC synonym (if >= 4 synonyms for distractors)
  if (withSynonyms.length >= 1 && allSynonyms.length >= 4) {
    for (const v of withSynonyms.slice(0, 3)) {
      const correct = v.synonyms!.split(',')[0].trim();
      const distractors = shuffle(allSynonyms.filter((s) => s !== correct)).slice(0, 4);
      if (distractors.length < 4) continue;
      const choices = shuffle([correct, ...distractors]);
      questions.push({
        type: 'mc_synonym',
        word: v.front_text,
        prompt: `"${v.front_text}"의 유의어를 고르세요.`,
        reference: correct,
        choices,
        correctIndex: choices.indexOf(correct),
      });
    }
  }

  // 2. MC antonym
  if (withAntonyms.length >= 1 && allAntonyms.length >= 4) {
    for (const v of withAntonyms.slice(0, 3)) {
      const correct = v.antonyms!.split(',')[0].trim();
      const distractors = shuffle(allAntonyms.filter((s) => s !== correct)).slice(0, 4);
      if (distractors.length < 4) continue;
      const choices = shuffle([correct, ...distractors]);
      questions.push({
        type: 'mc_antonym',
        word: v.front_text,
        prompt: `"${v.front_text}"의 반의어를 고르세요.`,
        reference: correct,
        choices,
        correctIndex: choices.indexOf(correct),
      });
    }
  }

  // 3. Short answer synonym
  for (const v of withSynonyms.slice(0, 2)) {
    const accepted = v.synonyms!.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    questions.push({
      type: 'short_synonym',
      word: v.front_text,
      prompt: `"${v.front_text}"의 유의어를 쓰세요.`,
      reference: v.synonyms!,
      acceptedAnswers: accepted,
    });
  }

  // 4. Short answer antonym
  for (const v of withAntonyms.slice(0, 2)) {
    const accepted = v.antonyms!.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    questions.push({
      type: 'short_antonym',
      word: v.front_text,
      prompt: `"${v.front_text}"의 반의어를 쓰세요.`,
      reference: v.antonyms!,
      acceptedAnswers: accepted,
    });
  }

  // 5. Fill blank
  for (const v of withExample.slice(0, 3)) {
    const sentence = v.example_sentence!;
    const word = v.front_text.toLowerCase();
    // Create blank version
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (!regex.test(sentence)) continue;
    const blanked = sentence.replace(regex, '________');
    questions.push({
      type: 'fill_blank',
      word: v.front_text,
      prompt: `빈칸에 들어갈 단어를 쓰세요.\n${blanked}`,
      reference: v.front_text,
      acceptedAnswers: [word],
    });
  }

  // Idiom questions
  for (const v of withIdioms) {
    const idioms = v.idioms!;
    for (const idiom of idioms) {
      // 6. Idiom en→ko
      questions.push({
        type: 'idiom_en_to_ko',
        word: v.front_text,
        prompt: `다음 숙어의 뜻을 한국어로 쓰세요.\n"${idiom.en}"`,
        reference: idiom.ko,
      });

      // 7. Idiom ko→en
      questions.push({
        type: 'idiom_ko_to_en',
        word: v.front_text,
        prompt: `다음 뜻에 해당하는 영어 숙어를 쓰세요.\n"${idiom.ko}"`,
        reference: idiom.en,
      });

      // 8. Example translate
      if (idiom.example_en && idiom.example_ko) {
        questions.push({
          type: 'idiom_example_translate',
          word: v.front_text,
          prompt: `다음 문장을 한국어로 해석하세요.\n"${idiom.example_en}"`,
          reference: idiom.example_ko,
        });
      }

      // 9. Writing (~10% so limit)
      if (idiom.example_ko && idiom.example_en && Math.random() < 0.3) {
        questions.push({
          type: 'idiom_writing',
          word: v.front_text,
          prompt: `다음 문장을 영어로 쓰세요.\n"${idiom.example_ko}"`,
          reference: idiom.example_en,
        });
      }
    }
  }

  return shuffle(questions);
}

// ── Components ──

interface ComprehensiveQuizProps {
  vocabulary: VocaVocabulary[];
  dayId: string;
  onComplete: (score: number) => void;
}

export function ComprehensiveQuiz({ vocabulary, dayId, onComplete }: ComprehensiveQuizProps) {
  const questions = useMemo(() => generateQuestions(vocabulary), [vocabulary]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [results, setResults] = useState<QuestionResult[] | null>(null);
  const [grading, setGrading] = useState(false);

  if (questions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        유의어/반의어/숙어 데이터가 부족하여 종합 문제를 출제할 수 없습니다.
      </p>
    );
  }

  const question = questions[currentIdx];
  const totalQuestions = questions.length;

  function handleAnswer(answer: string) {
    setAnswers((prev) => new Map(prev).set(currentIdx, answer));
  }

  function handleNext() {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  }

  async function handleSubmit() {
    setGrading(true);

    try {
      const questionResults: QuestionResult[] = [];
      const aiQuestions: { idx: number; question: AIQuestion; answer: string }[] = [];

      // 1) Grade rule-based questions locally
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const answer = answers.get(i) || '';

        if (q.type === 'mc_synonym' || q.type === 'mc_antonym') {
          const mcQ = q as MCQuestion;
          const isCorrect = answer === String(mcQ.correctIndex);
          questionResults[i] = {
            question: q,
            studentAnswer: answer ? mcQ.choices[parseInt(answer)] : '(미응답)',
            score: isCorrect ? 100 : 0,
            feedback: isCorrect ? '정답!' : `정답: ${mcQ.reference}`,
          };
        } else if (q.type === 'short_synonym' || q.type === 'short_antonym' || q.type === 'fill_blank') {
          const shortQ = q as ShortQuestion;
          const trimmed = answer.trim().toLowerCase();
          const isCorrect = shortQ.acceptedAnswers.includes(trimmed);
          questionResults[i] = {
            question: q,
            studentAnswer: answer || '(미응답)',
            score: isCorrect ? 100 : 0,
            feedback: isCorrect ? '정답!' : `정답: ${shortQ.reference}`,
          };
        } else {
          // AI question - collect for batch
          aiQuestions.push({ idx: i, question: q as AIQuestion, answer });
        }
      }

      // 2) Grade AI questions in batch
      if (aiQuestions.length > 0) {
        try {
          const res = await fetch('/api/voca/idiom-grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questions: aiQuestions.map((aq) => ({
                type: aq.question.type,
                prompt: aq.question.prompt,
                reference: aq.question.reference,
                studentAnswer: aq.answer || '',
              })),
            }),
          });

          if (res.ok) {
            const data = await res.json();
            aiQuestions.forEach((aq, arrIdx) => {
              const result = data.results[arrIdx];
              questionResults[aq.idx] = {
                question: aq.question,
                studentAnswer: aq.answer || '(미응답)',
                score: result.score,
                feedback: result.feedback,
              };
            });
          } else {
            // Fallback: mark all AI as needs retry
            aiQuestions.forEach((aq) => {
              questionResults[aq.idx] = {
                question: aq.question,
                studentAnswer: aq.answer || '(미응답)',
                score: 0,
                feedback: '채점 실패 — 다시 시도해주세요',
              };
            });
          }
        } catch {
          aiQuestions.forEach((aq) => {
            questionResults[aq.idx] = {
              question: aq.question,
              studentAnswer: aq.answer || '(미응답)',
              score: 0,
              feedback: '채점 오류',
            };
          });
        }
      }

      setResults(questionResults);

      // Calculate total score
      const totalScore = Math.round(
        questionResults.reduce((sum, r) => sum + r.score, 0) / questionResults.length
      );
      onComplete(totalScore);
    } catch (err) {
      console.error(err);
      toast.error('채점 중 오류가 발생했습니다');
    } finally {
      setGrading(false);
    }
  }

  function handleRestart() {
    setCurrentIdx(0);
    setAnswers(new Map());
    setResults(null);
  }

  // ── Results View ──
  if (results) {
    const totalScore = Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    );
    const correctCount = results.filter((r) => r.score >= 80).length;

    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold">{totalScore}점</p>
          <p className="text-muted-foreground">
            {results.length}문제 중 {correctCount}문제 정답
          </p>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {results.map((r, i) => (
            <Card key={i} className={cn(
              'border-l-4',
              r.score >= 80 ? 'border-l-green-500' : r.score >= 50 ? 'border-l-yellow-500' : 'border-l-red-500'
            )}>
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  {r.score >= 80 ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium whitespace-pre-line">{r.question.prompt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      내 답: {r.studentAnswer}
                    </p>
                    <p className="text-xs mt-0.5">
                      {r.feedback}
                    </p>
                  </div>
                  <QuestionTypeBadge type={r.question.type} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" className="w-full" onClick={handleRestart}>
          <RotateCcw className="h-4 w-4 mr-2" />
          다시 풀기
        </Button>
      </div>
    );
  }

  // ── Quiz View ──
  const answeredCount = answers.size;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{currentIdx + 1} / {totalQuestions}</span>
        <QuestionTypeBadge type={question.type} />
      </div>

      <Progress value={progressPct} className="h-1.5" />

      <Card className="min-h-[200px]">
        <CardContent className="py-6">
          <QuestionRenderer
            question={question}
            answer={answers.get(currentIdx) || ''}
            onAnswer={handleAnswer}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIdx === 0}>
          이전
        </Button>
        <div className="flex gap-2">
          {currentIdx < totalQuestions - 1 ? (
            <Button size="sm" onClick={handleNext}>
              다음
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={grading}
            >
              {grading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  채점 중...
                </>
              ) : (
                '제출하기'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap gap-1 justify-center">
        {questions.map((_, i) => (
          <button
            key={i}
            className={cn(
              'w-6 h-6 rounded-full text-xs border transition-colors',
              i === currentIdx && 'ring-2 ring-primary',
              answers.has(i) ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
            onClick={() => setCurrentIdx(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Question Renderer ──

function QuestionRenderer({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: string;
  onAnswer: (answer: string) => void;
}) {
  switch (question.type) {
    case 'mc_synonym':
    case 'mc_antonym': {
      const mcQ = question as MCQuestion;
      return (
        <div className="space-y-3">
          <p className="font-medium">{mcQ.prompt}</p>
          <div className="space-y-2">
            {mcQ.choices.map((choice, i) => (
              <Button
                key={i}
                variant="outline"
                className={cn(
                  'w-full justify-start text-left h-auto py-3',
                  answer === String(i) && 'ring-2 ring-primary bg-primary/5'
                )}
                onClick={() => onAnswer(String(i))}
              >
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {choice}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    case 'short_synonym':
    case 'short_antonym':
    case 'fill_blank':
    case 'idiom_en_to_ko':
    case 'idiom_ko_to_en':
    case 'idiom_example_translate':
    case 'idiom_writing': {
      return (
        <div className="space-y-3">
          <p className="font-medium whitespace-pre-line">{question.prompt}</p>
          <Input
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="답을 입력하세요"
            className="text-base"
          />
        </div>
      );
    }

    default:
      return null;
  }
}

// ── Badge Helper ──

function QuestionTypeBadge({ type }: { type: QuestionType }) {
  const labels: Record<QuestionType, string> = {
    mc_synonym: '유의어 선택',
    mc_antonym: '반의어 선택',
    short_synonym: '유의어 쓰기',
    short_antonym: '반의어 쓰기',
    fill_blank: '빈칸 채우기',
    idiom_en_to_ko: '숙어 해석',
    idiom_ko_to_en: '숙어 영작',
    idiom_example_translate: '예문 해석',
    idiom_writing: '영작',
  };

  const isAI = type.startsWith('idiom_');

  return (
    <Badge variant="outline" className={cn('text-[10px] h-5', isAI && 'border-blue-300 text-blue-600')}>
      {labels[type]}
      {isAI && ' AI'}
    </Badge>
  );
}
