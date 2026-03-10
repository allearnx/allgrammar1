import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const schema = z.object({
  sentences: z.array(z.object({
    koreanText: z.string(),
    originalText: z.string(),
    studentAnswer: z.string(),
    acceptedAnswers: z.array(z.string()).optional(),
  })).min(1).max(50),
});

export const POST = createApiHandler(
  { schema },
  async ({ user, body }) => {
    const { sentences } = body;

    const limited = checkRateLimit(user.id, 'naesin/grade-translation', 30);
    if (limited) return limited;

    // 1) Exact match first — skip AI for perfect matches
    type ResultItem = { score: number; feedback: string; correctedSentence: string };
    const results: (ResultItem | null)[] = sentences.map((s) => {
      const trimmed = s.studentAnswer.trim();
      if (trimmed === s.originalText) {
        return { score: 100, feedback: '정답!', correctedSentence: s.originalText };
      }
      if (s.acceptedAnswers?.some((ans: string) => trimmed === ans)) {
        return { score: 100, feedback: '정답!', correctedSentence: s.originalText };
      }
      return null; // needs AI grading
    });

    const needsAI = results
      .map((r, i) => (r === null ? i : -1))
      .filter((i) => i >= 0);

    // 2) If all exact matches, return immediately
    if (needsAI.length === 0) {
      return NextResponse.json({ results: results as ResultItem[] });
    }

    // 3) AI grading for non-exact matches
    try {
      const aiSentences = needsAI.map((i) => {
        const s = sentences[i];
        const accepted = s.acceptedAnswers?.length
          ? `\nAccepted alternatives: ${s.acceptedAnswers.map((a: string) => `"${a}"`).join(', ')}`
          : '';
        return `[${i + 1}]\nKorean: "${s.koreanText}"\nReference: "${s.originalText}"${accepted}\nStudent: "${s.studentAnswer}"`;
      }).join('\n\n');

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are grading a Korean middle school student's English textbook memorization exercise.
The student must write the English sentence from memory after seeing the Korean translation.

Grade each sentence. This is a MEMORIZATION test, so:
- The answer must match the reference sentence in meaning AND structure
- Minor typos (1-2 characters), extra/missing spaces, or trivial punctuation differences → still correct (score 100)
- Wrong words, missing words, different sentence structure, or significantly different meaning → incorrect (score 0)
- This is BINARY grading: score must be either 100 (correct) or 0 (incorrect)

${aiSentences}

Return a JSON array with exactly ${needsAI.length} objects (one per sentence above, in order):
[
  { "index": <original sentence number>, "score": <100 or 0>, "feedback": "<brief Korean feedback, max 15 chars>" }
]

Return ONLY the JSON array, no other text.`,
        }],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const aiResults: { index: number; score: number; feedback: string }[] = JSON.parse(jsonMatch[0]);

        aiResults.forEach((ai, arrIdx) => {
          const originalIdx = needsAI[arrIdx];
          const score = ai.score >= 80 ? 100 : 0; // Force binary
          results[originalIdx] = {
            score,
            feedback: ai.feedback || (score === 100 ? '정답!' : '오답'),
            correctedSentence: sentences[originalIdx].originalText,
          };
        });
      }

      // Fill any remaining nulls (AI parsing failures) as incorrect
      for (let i = 0; i < results.length; i++) {
        if (results[i] === null) {
          results[i] = {
            score: 0,
            feedback: '채점 오류 — 다시 시도해주세요',
            correctedSentence: sentences[i].originalText,
          };
        }
      }

      return NextResponse.json({ results: results as ResultItem[] });
    } catch (error) {
      console.error('AI grading error:', error);
      return NextResponse.json(
        { error: 'AI 채점 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
);
