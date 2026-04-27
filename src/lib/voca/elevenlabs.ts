import type { WordTimestamp } from '@/types/voca';
import { createClient } from '@/lib/supabase/server';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface CharAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface ElevenLabsTimestampResponse {
  audio_base64: string;
  alignment: CharAlignment;
}

/**
 * ElevenLabs TTS 생성 + 단어별 타임스탬프
 */
export async function generateSpeechWithTimestamps(
  text: string
): Promise<{ audioBuffer: Buffer; wordTimestamps: WordTimestamp[] }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) throw new Error('ElevenLabs API key or voice ID not configured');

  const res = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as ElevenLabsTimestampResponse;
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  const wordTimestamps = computeWordTimestamps(data.alignment);

  return { audioBuffer, wordTimestamps };
}

/**
 * 문자 타임스탬프 → 단어 타임스탬프 변환
 * 공백으로 구분된 연속 문자를 하나의 단어로 합침
 */
export function computeWordTimestamps(alignment: CharAlignment): WordTimestamp[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const words: WordTimestamp[] = [];
  let currentWord = '';
  let wordStart = 0;
  let wordEnd = 0;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];

    if (char === ' ' || char === '\n') {
      if (currentWord) {
        words.push({ word: currentWord, start: wordStart, end: wordEnd });
        currentWord = '';
      }
      continue;
    }

    if (!currentWord) {
      wordStart = character_start_times_seconds[i];
    }
    currentWord += char;
    wordEnd = character_end_times_seconds[i];
  }

  // 마지막 단어
  if (currentWord) {
    words.push({ word: currentWord, start: wordStart, end: wordEnd });
  }

  return words;
}

/**
 * 오디오 파일 Supabase Storage 업로드 → public URL 반환
 */
export async function uploadAudioToStorage(
  vocabId: string,
  audioBuffer: Buffer
): Promise<string> {
  const supabase = await createClient();
  const path = `voca/${vocabId}.mp3`;

  // 기존 파일 덮어쓰기
  const { error } = await supabase.storage
    .from('public-audio')
    .upload(path, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (error) throw new Error(`Storage upload error: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('public-audio')
    .getPublicUrl(path);

  return urlData.publicUrl;
}
