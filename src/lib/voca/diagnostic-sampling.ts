/**
 * 어휘 레벨 진단 — 라운드 문항 샘플링 (서버 전용).
 *
 * egress를 위해 밴드 전체 단어를 내려받지 않는다: Day 목록(가벼움)만 받아
 * 무작위 Day 일부에서만 단어를 가져와 샘플링한다.
 * 보기(오답)는 같은 풀에서 hasMeaningOverlap 필터로 유의어를 제외하고 뽑는다
 * (quick-quiz와 동일한 규칙 — 정답이 두 개인 문제 방지).
 */
import { hasMeaningOverlap } from '@/lib/voca/meaning-overlap';
import { shuffle } from '@/lib/utils';
import { DIAGNOSTIC_BANDS, ROUND_SIZE, getBand, type BandKey } from './diagnostic-bands';

// 서버 supabase 클라이언트 (server/service 어느 쪽이든 쿼리 인터페이스는 동일)
type SupabaseLike = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

interface PoolWord {
  id: string;
  day_id: string;
  front_text: string;
  back_text: string;
  part_of_speech: string | null;
}

export interface DiagnosticOption {
  vocabId: string;
  text: string;
}

export type DiagnosticQuestionType = 'en-to-ko' | 'ko-to-en';

export interface DiagnosticQuestion {
  vocabId: string;
  type: DiagnosticQuestionType;
  prompt: string; // en-to-ko: front_text / ko-to-en: back_text
  options: DiagnosticOption[]; // 4개, 정답 포함 셔플
}

/** 품사 문자열("n. v.", "동사" 등)을 비교용 토큰으로 분해 */
function posTokens(pos: string | null): string[] {
  if (!pos) return [];
  return pos
    .toLowerCase()
    .split(/[.,/\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 두 단어의 품사가 겹치는가 — 오답 보기의 품사 힌트 제거용 */
function samePos(a: string | null, b: string | null): boolean {
  const ta = posTokens(a);
  const tb = posTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  return ta.some((t) => tb.includes(t));
}

/** 밴드별 활성 여부 — 제목이 일치하고 Day가 1개 이상 있는 교재가 하나라도 있으면 활성 */
export async function getActiveBands(supabase: SupabaseLike): Promise<BandKey[]> {
  const allTitles = DIAGNOSTIC_BANDS.flatMap((b) => b.bookTitles);
  const { data: books } = await supabase
    .from('voca_books')
    .select('id, title')
    .in('title', allTitles)
    .eq('is_active', true);
  if (!books?.length) return [];

  const bookIds = books.map((b: { id: string }) => b.id);
  const { data: days } = await supabase
    .from('voca_days')
    .select('id, book_id')
    .in('book_id', bookIds);
  const booksWithDays = new Set((days || []).map((d: { book_id: string }) => d.book_id));

  const titleToBand = new Map<string, BandKey>();
  for (const band of DIAGNOSTIC_BANDS) {
    for (const t of band.bookTitles) titleToBand.set(t, band.key);
  }
  const active = new Set<BandKey>();
  for (const b of books as { id: string; title: string }[]) {
    if (booksWithDays.has(b.id)) {
      const key = titleToBand.get(b.title);
      if (key) active.add(key);
    }
  }
  return DIAGNOSTIC_BANDS.map((b) => b.key).filter((k) => active.has(k));
}

/** Day를 조금씩 넓혀가며 제외 단어를 뺀 풀을 최소 크기까지 확보 */
async function fetchPool(
  supabase: SupabaseLike,
  dayIds: string[],
  excludeIds: Set<string>,
  minPool: number,
): Promise<PoolWord[]> {
  const pool: PoolWord[] = [];
  const seenFront = new Set<string>();
  const CHUNK = 12; // Day 12개 ≈ 단어 300~500개

  for (let i = 0; i < dayIds.length && pool.length < minPool; i += CHUNK) {
    const chunk = dayIds.slice(i, i + CHUNK);
    const { data } = await supabase
      .from('voca_vocabulary')
      .select('id, day_id, front_text, back_text, part_of_speech')
      .in('day_id', chunk);
    for (const w of (data || []) as PoolWord[]) {
      if (excludeIds.has(w.id)) continue;
      const key = w.front_text.trim().toLowerCase();
      if (seenFront.has(key)) continue; // 밴드 내 교재 간 중복 단어 제거
      if (!w.back_text?.trim()) continue;
      seenFront.add(key);
      pool.push(w);
    }
  }
  return pool;
}

/**
 * 밴드에서 라운드 1회분(10문항) 샘플링.
 * Day 층화: 서로 다른 Day에서 골고루 뽑는다 (한 Day 쏠림 방지).
 */
export async function sampleDiagnosticQuestions(
  supabase: SupabaseLike,
  bandKey: BandKey,
  excludeIds: string[],
): Promise<DiagnosticQuestion[] | null> {
  const band = getBand(bandKey);

  const { data: books } = await supabase
    .from('voca_books')
    .select('id')
    .in('title', band.bookTitles)
    .eq('is_active', true);
  if (!books?.length) return null;

  const { data: days } = await supabase
    .from('voca_days')
    .select('id')
    .in('book_id', books.map((b: { id: string }) => b.id));
  if (!days?.length) return null;

  const shuffledDayIds = shuffle((days as { id: string }[]).map((d) => d.id));
  // 문항 10 + 보기용 여유. 40개 미만이면 보기 다양성이 떨어진다.
  const pool = await fetchPool(supabase, shuffledDayIds, new Set(excludeIds), 120);
  if (pool.length < ROUND_SIZE + 3) return null;

  // Day 층화 라운드로빈으로 출제 단어 선정
  const byDay = new Map<string, PoolWord[]>();
  for (const w of shuffle(pool)) {
    const list = byDay.get(w.day_id) ?? [];
    list.push(w);
    byDay.set(w.day_id, list);
  }
  const dayLists = shuffle([...byDay.values()]);
  const targets: PoolWord[] = [];
  for (let depth = 0; targets.length < ROUND_SIZE; depth++) {
    let picked = false;
    for (const list of dayLists) {
      if (targets.length >= ROUND_SIZE) break;
      if (list[depth]) {
        targets.push(list[depth]);
        picked = true;
      }
    }
    if (!picked) break;
  }

  return targets.map((target) => {
    // 오답 보기 우선순위: ①같은 품사 + 뜻 안 겹침 ②다른 품사 + 뜻 안 겹침 ③뜻 겹침(최후).
    // 품사가 다른 보기는 그것만으로 배제 가능해 정답이 추측된다 → 같은 품사 우선.
    const samePosSafe: PoolWord[] = [];
    const otherPosSafe: PoolWord[] = [];
    const risky: PoolWord[] = [];
    for (const w of pool) {
      if (w.id === target.id) continue;
      if (hasMeaningOverlap(target.back_text, w.back_text)) risky.push(w);
      else if (samePos(target.part_of_speech, w.part_of_speech)) samePosSafe.push(w);
      else otherPosSafe.push(w);
    }
    // 뜻 문자열 중복 제거하며 3개 채움 (부족하면 유의어라도 채움 — quick-quiz와 동일)
    const seen = new Set([target.back_text]);
    const distractors: PoolWord[] = [];
    for (const w of [...shuffle(samePosSafe), ...shuffle(otherPosSafe), ...shuffle(risky)]) {
      if (distractors.length >= 3) break;
      if (seen.has(w.back_text)) continue;
      seen.add(w.back_text);
      distractors.push(w);
    }

    // 유형 50% 혼합 — 방향이 바뀌면 추측 패턴도 깨진다
    const type: DiagnosticQuestionType = Math.random() < 0.5 ? 'en-to-ko' : 'ko-to-en';
    const optionText = (w: PoolWord) => (type === 'en-to-ko' ? w.back_text : w.front_text);
    const options = shuffle([
      { vocabId: target.id, text: optionText(target) },
      ...distractors.map((d) => ({ vocabId: d.id, text: optionText(d) })),
    ]);
    return {
      vocabId: target.id,
      type,
      prompt: type === 'en-to-ko' ? target.front_text : target.back_text,
      options,
    };
  });
}
