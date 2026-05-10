import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import {
  generateSpeechWithTimestamps,
  uploadAudioToStorage,
} from '@/lib/voca/elevenlabs';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

const schema = z.object({
  dayId: z.string().uuid(),
});

// POST — Day 전체 배치 TTS 생성 (boss only)
export const POST = createApiHandler(
  { schema, roles: ['boss'], rateLimit: { max: 5, windowMs: 60_000 } },
  async ({ body, supabase }) => {
    const { dayId } = body;

    // audio_url이 없는 단어만 조회
    const { data: vocabs, error: fetchError } = await supabase
      .from('voca_vocabulary')
      .select('id, front_text, example_sentence, audio_url')
      .eq('day_id', dayId)
      .is('audio_url', null)
      .order('sort_order');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    if (!vocabs || vocabs.length === 0) {
      return NextResponse.json({ generated: 0, remaining: 0, message: '모든 단어에 TTS가 생성되어 있습니다' });
    }

    // Vercel 타임아웃 방어: 최대 5개씩 처리 (각 ~2초, 총 ~10초 이내)
    const BATCH_LIMIT = 5;
    const batch = vocabs.slice(0, BATCH_LIMIT);
    const remaining = Math.max(0, vocabs.length - BATCH_LIMIT);

    let generated = 0;
    const errors: string[] = [];

    for (const vocab of batch) {
      const text = vocab.example_sentence || vocab.front_text;
      try {
        const { audioBuffer, wordTimestamps } =
          await generateSpeechWithTimestamps(text);

        const audioUrl = await uploadAudioToStorage(vocab.id, audioBuffer);

        await supabase
          .from('voca_vocabulary')
          .update({
            audio_url: audioUrl,
            word_timestamps: wordTimestamps,
          })
          .eq('id', vocab.id);

        generated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${vocab.front_text}: ${msg}`);
        logger.error('TTS batch item error', { vocabId: vocab.id, error: msg });
      }
    }

    return NextResponse.json({
      generated,
      total: batch.length,
      remaining,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
);
