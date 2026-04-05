import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { logger } from '@/lib/logger';
import { aiProblemImproveSchema } from '@/lib/api/schemas';
import Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonObject } from '@/lib/ai-json';
import { runFullValidation } from '@/lib/validation';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 120;

const anthropic = new Anthropic();

interface IssueItem {
  questionNumber: number;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  improvedQuestion?: NaesinProblemQuestion;
}

interface TrapSuggestion {
  question: NaesinProblemQuestion;
  reason: string;
}

interface AnalysisResult {
  summary: string;
  score: number;
  issues: IssueItem[];
  trapSuggestions: TrapSuggestion[];
}

function buildAnalysisPrompt(
  questions: NaesinProblemQuestion[],
  validationSummary: string,
): string {
  return `당신은 중학교 영어 내신 시험 문제 품질 분석 전문가입니다.

## 과제
아래 문제 세트를 분석하고, 품질 이슈와 개선안을 제시하세요.

## 기존 검증 결과
${validationSummary}

## 문제 데이터
${JSON.stringify(questions, null, 2)}

## 분석 기준

### 1. 패턴 게이밍 가능성
- 오답이 형태/길이로 구별되는지 (예: 보기 하나만 길거나 짧은 경우)
- 정답 분포가 편향되어 있는지
- 문제 유형이 단조로운지

### 2. 오답 품질
- 오답이 문법적으로 불가능한 형태인지
- 오답이 너무 뻔하게 틀린지
- 매력적 오답(plausible distractor)이 부족한지

### 3. 함정 문제 부재
- 해당 문법이 항상 정답인 문제만 있는지
- 학생이 "일단 이 문법이면 정답" 패턴을 학습할 수 있는지

### 4. 어휘/난이도 수준
- 중학생 수준에 맞지 않는 어휘 사용
- 난이도가 너무 쉽거나 어려운 문제

### 5. 해설 품질
- 해설이 없거나 불충분한 문제
- 오답 이유가 설명되지 않은 경우

## 출력 형식
JSON 객체로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "summary": "전체 평가 요약 (2-3문장)",
  "score": 75,
  "issues": [
    {
      "questionNumber": 3,
      "issue": "오답이 형태적으로 명백히 구별됨",
      "severity": "high",
      "suggestion": "오답을 문법적으로 그럴듯한 형태로 변경",
      "improvedQuestion": {
        "number": 3,
        "question": "개선된 문제 텍스트",
        "options": ["보기1", "보기2", "보기3", "보기4", "보기5"],
        "answer": "2",
        "explanation": "개선된 해설"
      }
    }
  ],
  "trapSuggestions": [
    {
      "question": {
        "number": 21,
        "question": "함정 문제 텍스트",
        "options": ["보기1", "보기2", "보기3", "보기4", "보기5"],
        "answer": "4",
        "explanation": "[함정] 해설"
      },
      "reason": "현재 세트에 함정 문제가 없어 학생이 패턴 학습 가능"
    }
  ]
}

규칙:
- issues 배열에는 실제 문제가 있는 것만 포함 (문제 없으면 빈 배열)
- severity: high (반드시 수정), medium (수정 권장), low (선택 수정)
- improvedQuestion은 severity가 high/medium인 경우에만 제공
- trapSuggestions는 세트에 함정 문제가 부족할 때 1~3개 추천
- score: 0~100 (문제 세트 전체 품질 점수)`;
}

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: aiProblemImproveSchema, rateLimit: { max: 30 } },
  async ({ user, body, supabase }) => {
    const { sheetId } = body;

    // Fetch the problem sheet
    const sheet = dbResult(await supabase
      .from('naesin_problem_sheets')
      .select('*')
      .eq('id', sheetId)
      .single());

    const questions: NaesinProblemQuestion[] = sheet.questions || [];
    if (questions.length === 0) {
      return NextResponse.json({ error: '문제가 없는 시트입니다.' }, { status: 400 });
    }

    try {
      // Run existing validation first
      const validation = await runFullValidation(questions, anthropic, { skipAi: false });

      // Build prompt with validation results
      const analysisPrompt = buildAnalysisPrompt(questions, validation.summary);

      const aiResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        messages: [{ role: 'user', content: analysisPrompt }],
      });

      const analysis = parseAiJsonObject<AnalysisResult>(aiResponse);
      if (!analysis) {
        throw new Error('AI 분석 결과 파싱 실패');
      }

      logger.info('ai.improve_problems', {
        userId: user.id,
        sheetId,
        questionsCount: questions.length,
        issuesCount: analysis.issues.length,
        score: analysis.score,
      });

      return NextResponse.json({
        analysis,
        validation,
        sheet: { id: sheet.id, title: sheet.title },
      });
    } catch (error) {
      logger.error('ai.improve_problems', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }
  },
);
