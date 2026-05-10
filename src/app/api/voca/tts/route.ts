import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import {
  generateSpeechWithTimestamps,
  uploadAudioToStorage,
} from '@/lib/voca/elevenlabs';

export const maxDuration = 30;

const schema = z.object({
  vocabId: z.string().uuid(),
  text: z.string().min(1).max(500),
});

// POST — 단일 단어 TTS 생성 (boss only)
export const POST = createApiHandler(
  { schema, roles: ['boss'] },
  async ({ body, supabase }) => {
    const { vocabId, text } = body;

    const { audioBuffer, wordTimestamps } =
      await generateSpeechWithTimestamps(text);

    const audioUrl = await uploadAudioToStorage(vocabId, audioBuffer);

    // DB 업데이트
    const { error } = await supabase
      .from('voca_vocabulary')
      .update({
        audio_url: audioUrl,
        word_timestamps: wordTimestamps,
      })
      .eq('id', vocabId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ audioUrl, wordTimestamps });
  }
);
