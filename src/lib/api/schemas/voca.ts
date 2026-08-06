import { z } from 'zod';
import { ID, SHORT, MEDIUM } from './_shared';

// ── 올킬보카 Schemas ──

export const vocaBookCreateSchema = z.object({
  title: SHORT,
  description: MEDIUM.nullish(),
  cover_image_url: z.string().url().nullish(),
  definition_lang: z.enum(['ko', 'en']).optional(), // null 불가 — DB not null (default 'ko')
  sort_order: z.number().nullish(),
});

export const vocaBookPatchSchema = z.object({
  id: ID,
}).passthrough();

export const vocaDayCreateSchema = z.object({
  book_id: ID,
  day_number: z.number(),
  title: SHORT,
  sort_order: z.number().nullish(),
});

export const vocaVocabCreateSchema = z.object({
  day_id: ID,
  front_text: SHORT,
  back_text: SHORT,
  part_of_speech: SHORT.nullish(),
  example_sentence: MEDIUM.nullish(),
  example_sentence_ko: MEDIUM.nullish(),
  synonyms: SHORT.nullish(),
  antonyms: SHORT.nullish(),
  spelling_hint: SHORT.nullish(),
  spelling_answer: SHORT.nullish(),
  sort_order: z.number().nullish(),
});

export const vocaVocabPatchSchema = z.object({
  id: ID,
}).passthrough();

export const vocaVocabBulkSchema = z.object({
  day_id: ID,
  items: z.array(z.object({
    front_text: SHORT,
    back_text: SHORT,
    part_of_speech: SHORT.nullish(),
    example_sentence: MEDIUM.nullish(),
    example_sentence_ko: MEDIUM.nullish(),
    synonyms: SHORT.nullish(),
    antonyms: SHORT.nullish(),
    spelling_hint: SHORT.nullish(),
    spelling_answer: SHORT.nullish(),
    exam_source: SHORT.nullish(), // 기출 지문에서 추출 시 출처 라벨
    idioms: z.array(z.object({
      en: z.string(),
      ko: z.string(),
      example_en: z.string().optional(),
      example_ko: z.string().optional(),
    })).nullish(),
  })).min(1).max(500),
});

export const vocaProgressSaveSchema = z.object({
  dayId: ID,
  type: z.enum(['flashcard', 'quiz', 'spelling', 'matching', 'exam']),
  score: z.number().min(0).max(100).nullish(),
  matchingAttempt: z.number().int().min(1).max(99).nullish(),
  round: z.enum(['1', '2']).default('1'),
  spellingWrongWords: z.array(z.object({
    front_text: z.string(),
    back_text: z.string(),
  })).nullish(),
});

// 묶음 보너스 시험 (Day 1~3개) 결과 저장
export const vocaExamSaveSchema = z.object({
  bookId: ID,
  dayIds: z.array(ID).min(1).max(3),
  score: z.number().int().min(0).max(100),
  wrongWords: z.array(z.object({
    front_text: z.string(),
    back_text: z.string(),
  })).nullish(),
  assignmentId: ID.nullish(), // 선생님 배정 시험이면 연결
  examType: z.enum(['headword', 'syn_ant']).default('headword'), // 1회독 표제어 / 2회독 유의어·반의어
});

// 선생님 배정형 시험 생성 (학생들에게 Day 묶음 시험 배정)
export const vocaExamAssignmentCreateSchema = z.object({
  bookId: ID,
  dayIds: z.array(ID).min(1).max(3),
  studentIds: z.array(ID).min(1).max(200),
  title: z.string().trim().max(100).nullish(),
  /** 이 배정 시험의 제한시간(초) 오버라이드. null = 학생/학원 강도 따름 */
  secondsPerWord: z.number().int().min(0).max(60).nullish(),
  examType: z.enum(['headword', 'syn_ant']).default('headword'),
});

export const vocaExamAssignmentDeleteSchema = z.object({
  id: ID,
});

export const vocaMatchingSubmissionSchema = z.object({
  dayId: ID,
  wrongWords: z.array(z.object({
    word: SHORT,
    match: SHORT,
    type: z.enum(['synonym', 'antonym', 'sentence']),
  })),
  writings: z.array(z.object({
    word: SHORT,
    attempts: z.array(SHORT),
  })),
});

export const vocaMatchingReviewSchema = z.object({
  id: ID,
  status: z.enum(['pending', 'reviewed']),
});

export const vocaDaysWithVocabSchema = z.object({
  book_id: ID,
  words_per_day: z.number().min(1).max(200).default(30),
  items: z.array(z.object({
    front_text: SHORT,
    back_text: SHORT,
    part_of_speech: SHORT.nullish(),
    example_sentence: MEDIUM.nullish(),
    example_sentence_ko: MEDIUM.nullish(),
    synonyms: SHORT.nullish(),
    antonyms: SHORT.nullish(),
    spelling_hint: SHORT.nullish(),
    spelling_answer: SHORT.nullish(),
    exam_source: SHORT.nullish(), // 기출 지문에서 추출 시 출처 라벨
    idioms: z.array(z.object({
      en: z.string(),
      ko: z.string(),
      example_en: z.string().optional(),
      example_ko: z.string().optional(),
    })).nullish(),
  })).min(1).max(2000),
});

// ── 보카 교재 배정 Schemas ──

export const vocaBookAssignmentSchema = z.object({
  studentId: ID,
  bookId: ID,
});

export const vocaBookAssignmentDeleteSchema = z.object({
  studentId: ID,
});

// ── 어휘 레벨 진단 Schemas ──

const diagnosticBand = z.enum(['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']);

/**
 * 토큰 라운드 — 문항은 HMAC 봉인 토큰으로 식별하고 클라이언트는 답만 보고한다:
 * 타이핑 문항은 typed, 5지선다 문항은 chosenIndex (null = "모르겠어요").
 * 정오 판정·밴드는 전부 서버가 토큰을 열어 결정 (정답 노출·위조 방지).
 */
const diagnosticTokenItems = z.array(z.object({
  token: z.string().min(20).max(4000),
  typed: z.string().max(80).nullable().optional(),
  chosenIndex: z.number().int().min(0).max(4).nullable().optional(),
})).min(1).max(20);

const diagnosticTokenRounds = z.array(diagnosticTokenItems).max(6);

const diagnosticGrade = z.enum(['elementary', 'm1', 'm2', 'm3', 'h1', 'h2', 'h3']);

/**
 * 다음 문항 배치 요청 — 스테어케이스 판단도 서버가 한다.
 * rounds가 비면 학년 시작 밴드의 앞 배치, 차 있으면 검증 후 nextStep으로 다음 밴드/종료 결정.
 * currentRound(진행 중 라운드의 앞 배치 답)가 있으면 중간 채점 후 뒤 배치를 돌려준다.
 */
export const vocaDiagnosticQuestionsSchema = z.object({
  grade: diagnosticGrade,
  rounds: diagnosticTokenRounds.default([]),
  currentRound: diagnosticTokenItems.optional(),
  excludeIds: z.array(ID).max(1000).default([]), // 재진단 시 이전 회차 출제 단어 제외
});

export const vocaDiagnosticSubmitSchema = z.object({
  grade: diagnosticGrade,
  rounds: diagnosticTokenRounds.min(1),
  /** /level-test 익명 완주 기록 id — 가입 제출 시 계정과 연결 */
  leadId: ID.optional(),
});

/** 비로그인 완주 기록 (value-first 게이트 도달 시점) */
export const vocaDiagnosticCompleteSchema = z.object({
  grade: diagnosticGrade,
  rounds: diagnosticTokenRounds.min(1),
});

/** 게이트 연락처 제출 — leadId가 있으면 기존 기록에 연결, 없으면 rounds로 새로 계산 */
export const vocaDiagnosticLeadSchema = z.object({
  name: z.string().trim().min(1).max(30),
  phone: z.string().trim().regex(/^01[016789]-?\d{3,4}-?\d{4}$/, '올바른 휴대폰 번호가 아닙니다'),
  leadId: ID.optional(),
  grade: diagnosticGrade.optional(),
  rounds: diagnosticTokenRounds.min(1).optional(),
});
