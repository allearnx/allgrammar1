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
import { cached, TTL } from '@/lib/cache/server-cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { DIAGNOSTIC_BANDS, BAND_KEYS, ROUND_SIZE, getBand, type BandKey } from './diagnostic-bands';
import { DIAGNOSTIC_LINEUP } from './diagnostic-lineup';
import { BASIC_ENGLISH_WORDS } from './basic-words';
import { signDiagnosticToken } from './diagnostic-token';

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

export type DiagnosticQuestionType = 'en-to-ko' | 'ko-to-en';

/**
 * 클라이언트에 내려가는 문항 — 정답 정보는 token(HMAC 봉인)에만 있다.
 * options는 순수 텍스트 배열이라 어떤 보기가 정답인지 클라이언트에서 알 수 없다.
 */
export interface DiagnosticQuestion {
  token: string;
  type: DiagnosticQuestionType;
  prompt: string; // en-to-ko: front_text / ko-to-en: back_text
  options: string[]; // 4개, 정답 포함 셔플
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

export interface BandBook {
  id: string;
  title: string;
}

/** 밴드별 활성 교재(Day 1개 이상) 목록 — 진단 출제 풀이자 추천 교재 */
export async function getBandBooks(supabase: SupabaseLike): Promise<Record<BandKey, BandBook[]>> {
  const result = Object.fromEntries(
    DIAGNOSTIC_BANDS.map((b) => [b.key, [] as BandBook[]]),
  ) as Record<BandKey, BandBook[]>;

  const allTitles = DIAGNOSTIC_BANDS.flatMap((b) => b.bookTitles);
  const { data: books } = await supabase
    .from('voca_books')
    .select('id, title')
    .in('title', allTitles)
    .eq('is_active', true);
  if (!books?.length) return result;

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
  for (const b of books as BandBook[]) {
    if (!booksWithDays.has(b.id)) continue;
    const key = titleToBand.get(b.title);
    if (key) result[key].push(b);
  }
  // 밴드 내 순서 = bookTitles 설정 순서 (추천 카드의 대표 교재 = 첫 번째) —
  // DB 조회 순서에 맡기면 나중에 추가된 보조 교재가 대표로 뽑힐 수 있다
  for (const band of DIAGNOSTIC_BANDS) {
    result[band.key].sort((a, b) => band.bookTitles.indexOf(a.title) - band.bookTitles.indexOf(b.title));
  }
  return result;
}

/**
 * 라인업 교재 title → book id (활성 교재만) — 결과 화면 "지금 시작할 교재" 렌더용.
 * 비활성이거나 이름이 바뀐 교재는 빠지고, 클라이언트는 조회된 교재만 표시한다.
 */
export async function getLineupBookIds(supabase: SupabaseLike): Promise<Record<string, string>> {
  const titles = DIAGNOSTIC_LINEUP.flatMap((c) => c.bookTitles);
  const { data: books } = await supabase
    .from('voca_books')
    .select('id, title')
    .in('title', titles)
    .eq('is_active', true);
  return Object.fromEntries(((books ?? []) as BandBook[]).map((b) => [b.title, b.id]));
}

/** 밴드별 활성 여부 — 제목이 일치하고 Day가 1개 이상 있는 교재가 하나라도 있으면 활성 */
export async function getActiveBands(supabase: SupabaseLike): Promise<BandKey[]> {
  const bandBooks = await getBandBooks(supabase);
  return DIAGNOSTIC_BANDS.map((b) => b.key).filter((k) => bandBooks[k].length > 0);
}

/**
 * 하위 밴드 교재들에 등장하는 표제어 집합 (소문자) — 상위 밴드 출제에서 제외.
 * 모고 단어장은 지문 전체에서 추출되어 기본 단어(risk, active, body …)가 다수 섞이는데,
 * 이를 그대로 출제하면 상위권이 쉬운 단어 덕에 상위 밴드를 통과해 변별이 안 된다
 * (2026-07-20 릴스 리드 4/6명이 학년 이상 판정된 원인). 5분 캐시.
 */
const getLowerBandWords = cached(
  async (bandKey: BandKey): Promise<string[]> => {
    const idx = BAND_KEYS.indexOf(bandKey);
    if (idx <= 0) return [];
    const lowerTitles = DIAGNOSTIC_BANDS.slice(0, idx).flatMap((b) => b.bookTitles);
    const admin = createAdminClient();
    const { data: books } = await admin.from('voca_books').select('id').in('title', lowerTitles);
    if (!books?.length) return [];
    const { data: days } = await admin
      .from('voca_days')
      .select('id')
      .in('book_id', books.map((b: { id: string }) => b.id));
    if (!days?.length) return [];
    const dayIds = (days as { id: string }[]).map((d) => d.id);
    const words = new Set<string>();
    for (let i = 0; i < dayIds.length; i += 40) {
      let from = 0;
      while (true) {
        const { data } = await admin
          .from('voca_vocabulary')
          .select('id, front_text')
          .in('day_id', dayIds.slice(i, i + 40))
          .order('id')
          .range(from, from + 999);
        for (const w of (data ?? []) as { front_text: string }[]) words.add(w.front_text.trim().toLowerCase());
        if (!data || data.length < 1000) break;
        from += 1000;
      }
    }
    return [...words];
  },
  'diagnostic-lower-words',
  TTL.CONTENT,
);

/** Day를 조금씩 넓혀가며 제외 단어를 뺀 풀을 확보 — 변별용(easySet 제외) 단어가 minPool에 찰 때까지 */
async function fetchPool(
  supabase: SupabaseLike,
  dayIds: string[],
  excludeIds: Set<string>,
  minPool: number,
  easySet: Set<string>,
): Promise<PoolWord[]> {
  const pool: PoolWord[] = [];
  const seenFront = new Set<string>();
  const CHUNK = 12; // Day 12개 ≈ 단어 300~500개
  let hardCount = 0;

  for (let i = 0; i < dayIds.length && hardCount < minPool; i += CHUNK) {
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
      if (!easySet.has(key)) hardCount++;
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
  // 하위 밴드에 등장하는 쉬운 단어는 출제 제외 (변별력) — 풀이 부족하면 전체 풀로 폴백
  const easySet = new Set(await getLowerBandWords(bandKey));
  // 모의고사 단어장 밴드(L4+)는 기초 빈도어도 제외 — 지문 추출 리스트라 situation/experience
  // 같은 기본어가 섞여 첫 라운드가 물러지는 문제 보강. L1~L3 교재 밴드에는 적용 금지
  // (중등 교재 표제어 자체가 기초 단어라 풀이 무너진다).
  if (BAND_KEYS.indexOf(bandKey) >= BAND_KEYS.indexOf('L4')) {
    for (const w of BASIC_ENGLISH_WORDS) easySet.add(w);
  }
  // 문항 10 + 보기용 여유. 40개 미만이면 보기 다양성이 떨어진다.
  const fullPool = await fetchPool(supabase, shuffledDayIds, new Set(excludeIds), 120, easySet);
  const hardPool = fullPool.filter((w) => !easySet.has(w.front_text.trim().toLowerCase()));
  const pool = hardPool.length >= ROUND_SIZE + 10 ? hardPool : fullPool;
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

  return Promise.all(targets.map(async (target) => {
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
    const shuffled = shuffle([target, ...distractors]);
    const correctIndex = shuffled.findIndex((w) => w.id === target.id);
    // 정답 인덱스·단어·밴드를 토큰에 봉인 — 클라이언트에는 텍스트만 내려간다
    const token = await signDiagnosticToken({
      v: target.id,
      f: target.front_text,
      b: target.back_text,
      c: correctIndex,
      band: bandKey,
    });
    return {
      token,
      type,
      prompt: type === 'en-to-ko' ? target.front_text : target.back_text,
      options: shuffled.map(optionText),
    };
  }));
}
