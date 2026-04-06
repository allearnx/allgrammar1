import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { gradeSubjectiveSchema } from '@/lib/api/schemas';

/** 정규화: 대소문자 무시, 앞뒤 공백, 끝 마침표, 연속 공백 → 단일 공백 */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\.+\s*$/, '')   // 끝의 마침표(+뒤 공백) 제거
    .replace(/\s+/g, ' ');    // 연속 공백 → 단일 공백
}

export const POST = createApiHandler(
  { schema: gradeSubjectiveSchema, rateLimit: { max: 60 } },
  async ({ body }) => {
    const { referenceAnswer, studentAnswer, acceptedAnswers } = body;

    const studentNorm = normalize(studentAnswer);

    // 비교 대상: referenceAnswer + acceptedAnswers
    const candidates = [referenceAnswer, ...(acceptedAnswers ?? [])];
    const isCorrect = candidates.some((c) => normalize(c) === studentNorm);

    return NextResponse.json({
      score: isCorrect ? 100 : 0,
    });
  }
);
