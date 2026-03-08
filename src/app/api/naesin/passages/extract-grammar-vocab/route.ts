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
      .map((s, i) => `[${i}] English: ${s.original}\nKorean: ${s.korean}`)
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
- Each choice point has startWord and endWord (0-indexed word positions in the sentence)
- startWord and endWord are inclusive (if a single word, startWord === endWord)
- options: 2-3 choices including the correct answer
- correctIndex: index of the correct answer in the options array
- The correct option must exactly match the original word(s) in the sentence
- Make wrong options plausible but clearly wrong for the level
- Words are split by whitespace

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
      const result = items.map((item: { sentenceIndex: number; choicePoints: unknown[]; original?: string; korean?: string }) => {
        const originalSentence = selected[item.sentenceIndex];
        if (!originalSentence) return null;
        return {
          sentenceIndex: originalSentence.index,
          original: originalSentence.original,
          korean: originalSentence.korean,
          choicePoints: item.choicePoints || [],
        };
      }).filter(Boolean);

      return NextResponse.json({ items: result });
    } catch {
      console.error('Failed to parse grammar vocab JSON:', cleaned);
      return NextResponse.json({ items: [] });
    }
  }
);
