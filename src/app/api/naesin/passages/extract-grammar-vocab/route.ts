import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

const anthropic = new Anthropic();

const schema = z.object({
  sentences: z.array(z.object({
    original: z.string(),
    korean: z.string(),
    words: z.array(z.string()).optional(),
  })).min(1),
});

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;
const MIN_WORD_COUNT = 5;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema },
  async ({ body }) => {
    const { sentences } = body;

    // Filter: exclude sentences with 5 or fewer words
    const eligible = sentences
      .map((s, i) => ({ ...s, index: i }))
      .filter((s) => s.original.trim().split(/\s+/).length > MIN_WORD_COUNT);

    if (eligible.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Select ~half (rounded up) of eligible sentences
    const selectCount = Math.ceil(eligible.length / 2);
    const selected = eligible.slice(0, selectCount);

    const sentenceList = selected
      .map((s, i) => {
        const words = s.original.trim().split(/\s+/);
        const wordMap = words.map((w, wi) => `  ${wi}: "${w}"`).join('\n');
        return `[${i}] English: ${s.original}\nKorean: ${s.korean}\nWord indices:\n${wordMap}`;
      })
      .join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are creating grammar/vocabulary choice exercises for Korean middle school students studying English textbook passages.

For each sentence below, find 1-2 choice points where students must choose the correct expression from 2-3 options.

Types of choice points:
- **Grammar (어법)**: verb forms (to play vs playing), tense, articles, prepositions, relative pronouns, etc.
- **Vocabulary (어휘)**: easily confused words, synonyms with different nuance, collocations

Rules:
- Each choice point has startWord and endWord (0-indexed word positions as shown in "Word indices" above)
- startWord and endWord are inclusive (if a single word, startWord === endWord)
- CRITICAL: The correct option MUST be the EXACT word(s) from the sentence at those positions (copy-paste from the word indices)
- options: 2-3 choices including the correct answer
- correctIndex: index of the correct answer in the options array
- Make wrong options plausible but clearly wrong for the level
- Do NOT create overlapping choice points in the same sentence

Sentences:
${sentenceList}

Respond with ONLY a JSON array (no other text):
[
  {
    "sentenceIndex": 0,
    "original": "the full English sentence",
    "korean": "한국어 해석",
    "choicePoints": [
      {
        "startWord": 2,
        "endWord": 2,
        "options": ["playing", "to play", "play"],
        "correctIndex": 0
      }
    ]
  }
]`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = responseText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();

    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('AI raw response:', responseText);
      return NextResponse.json({ items: [] });
    }

    try {
      const items = JSON.parse(jsonMatch[0]);

      // Map back to original sentence indices and validate
      const result = items.map((item: { sentenceIndex: number; choicePoints: { startWord: number; endWord: number; options: string[]; correctIndex: number }[]; original?: string; korean?: string }) => {
        const originalSentence = selected[item.sentenceIndex];
        if (!originalSentence) return null;

        const words = originalSentence.original.trim().split(/\s+/);

        // Validate each choice point
        const validChoicePoints = (item.choicePoints || []).filter((cp) => {
          if (cp.startWord < 0 || cp.endWord >= words.length || cp.startWord > cp.endWord) return false;
          if (!cp.options || cp.options.length < 2 || cp.correctIndex < 0 || cp.correctIndex >= cp.options.length) return false;
          // Verify correct option matches actual words
          const originalWords = words.slice(cp.startWord, cp.endWord + 1).join(' ');
          return cp.options[cp.correctIndex] === originalWords;
        });

        // Remove overlapping ranges
        const sorted = validChoicePoints.sort((a, b) => a.startWord - b.startWord);
        const nonOverlapping: typeof validChoicePoints = [];
        let lastEnd = -1;
        for (const cp of sorted) {
          if (cp.startWord > lastEnd) {
            nonOverlapping.push(cp);
            lastEnd = cp.endWord;
          }
        }

        if (nonOverlapping.length === 0) return null;

        return {
          sentenceIndex: originalSentence.index,
          original: originalSentence.original,
          korean: originalSentence.korean,
          choicePoints: nonOverlapping,
        };
      }).filter(Boolean);

      return NextResponse.json({ items: result });
    } catch {
      console.error('Failed to parse grammar vocab JSON:', cleaned);
      return NextResponse.json({ items: [] });
    }
  }
);
