import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { gradeSubjectiveSchema } from '@/lib/api/schemas';
import { normalize, normalizeSeparators } from '@/lib/naesin/normalize-answer';

export const POST = createApiHandler(
  { schema: gradeSubjectiveSchema, rateLimit: { max: 200 } },
  async ({ body }) => {
    const { referenceAnswer, studentAnswer, acceptedAnswers } = body;

    const studentNorm = normalize(studentAnswer);

    // 비교 대상: referenceAnswer + acceptedAnswers
    const candidates = [referenceAnswer, ...(acceptedAnswers ?? [])];
    const isCorrect = candidates.some((c) => normalize(c) === studentNorm)
      || candidates.some((c) => normalizeSeparators(c) === normalizeSeparators(studentAnswer));

    return NextResponse.json({
      score: isCorrect ? 100 : 0,
    });
  }
);
