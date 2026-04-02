import { describe, it, expect } from 'vitest';
import { calculateStageStatuses, type StageUnlockInput } from '@/lib/naesin/stage-unlock';
import type { NaesinStudentProgress, NaesinContentAvailability } from '@/types/database';

function makeProgress(overrides: Partial<NaesinStudentProgress> = {}): NaesinStudentProgress {
  return {
    id: 'test-id',
    student_id: 'student-1',
    unit_id: 'unit-1',
    vocab_flashcard_count: 0,
    vocab_quiz_score: null,
    vocab_spelling_score: null,
    vocab_completed: false,
    passage_fill_blanks_best: null,
    passage_ordering_best: null,
    passage_completed: false,
    grammar_video_completed: false,
    grammar_text_read: false,
    grammar_completed: false,
    omr_completed: false,
    vocab_quiz_sets_completed: 0,
    vocab_total_quiz_sets: 0,
    passage_translation_best: null,
    passage_grammar_vocab_best: null,
    dialogue_translation_best: null,
    dialogue_completed: false,
    // Round 2 defaults
    round2_passage_fill_blanks_best: null,
    round2_passage_ordering_best: null,
    round2_passage_translation_best: null,
    round2_passage_grammar_vocab_best: null,
    round2_passage_completed: false,
    round2_dialogue_translation_best: null,
    round2_dialogue_completed: false,
    grammar_videos_completed: 0,
    grammar_total_videos: 0,
    problem_completed: false,
    last_review_unlocked: false,
    textbook_video_completed: false,
    textbook_videos_completed: 0,
    textbook_total_videos: 0,
    mock_exam_completed: false,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function makeContent(overrides: Partial<NaesinContentAvailability> = {}): NaesinContentAvailability {
  return {
    hasVocab: true,
    hasPassage: true,
    hasDialogue: true,
    hasTextbookVideo: true,
    hasGrammar: true,
    hasProblem: true,
    hasMockExam: true,
    hasLastReview: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<StageUnlockInput> = {}): StageUnlockInput {
  return {
    progress: null,
    content: makeContent(),
    vocabQuizSetCount: 0,
    grammarVideoCount: 0,
    examDate: null,
    ...overrides,
  };
}

describe('calculateStageStatuses', () => {
  describe('순서 잠금 없음 (모든 단계 즉시 접근)', () => {
    it('진도 없어도 콘텐츠 있는 모든 단계가 available', () => {
      const result = calculateStageStatuses(makeInput());
      expect(result.vocab).toBe('available');
      expect(result.passage).toBe('available');
      expect(result.dialogue).toBe('available');
      expect(result.grammar).toBe('available');
      expect(result.problem).toBe('available');
      expect(result.lastReview).toBe('locked'); // D-3 유지
    });

    it('vocab 완료 → vocab completed, 나머지 available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({ vocab_completed: true }),
      }));
      expect(result.vocab).toBe('completed');
      expect(result.passage).toBe('available');
      expect(result.dialogue).toBe('available');
      expect(result.grammar).toBe('available');
    });

    it('vocab+passage 완료 → 둘 completed, 나머지 available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_completed: true,
          passage_completed: true,
        }),
      }));
      expect(result.vocab).toBe('completed');
      expect(result.passage).toBe('completed');
      expect(result.dialogue).toBe('available');
      expect(result.grammar).toBe('available');
    });

    it('전체 완료 → 모두 completed (lastReview 제외 - D-3 필요)', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_completed: true,
          passage_completed: true,
          dialogue_completed: true,
          grammar_completed: true,
          problem_completed: true,
        }),
      }));
      expect(result.vocab).toBe('completed');
      expect(result.passage).toBe('completed');
      expect(result.dialogue).toBe('completed');
      expect(result.grammar).toBe('completed');
      expect(result.problem).toBe('completed');
      // lastReview는 D-3 이내여야 available
      expect(result.lastReview).toBe('locked');
    });
  });

  describe('콘텐츠 없는 단계 auto-complete', () => {
    it('vocab 콘텐츠 없으면 자동 완료 → passage available', () => {
      const result = calculateStageStatuses(makeInput({
        content: makeContent({ hasVocab: false }),
      }));
      expect(result.vocab).toBe('completed');
      expect(result.passage).toBe('available');
    });

    it('vocab+passage+dialogue 콘텐츠 없으면 → grammar available', () => {
      const result = calculateStageStatuses(makeInput({
        content: makeContent({ hasVocab: false, hasPassage: false, hasDialogue: false }),
      }));
      expect(result.vocab).toBe('completed');
      expect(result.passage).toBe('completed');
      expect(result.dialogue).toBe('completed');
      expect(result.grammar).toBe('available');
    });

    it('모든 콘텐츠 없으면 → 전부 completed (lastReview 제외)', () => {
      const result = calculateStageStatuses(makeInput({
        content: makeContent({
          hasVocab: false,
          hasPassage: false,
          hasDialogue: false,
          hasGrammar: false,
          hasProblem: false,
          hasLastReview: false,
        }),
      }));
      expect(result.vocab).toBe('completed');
      expect(result.passage).toBe('completed');
      expect(result.dialogue).toBe('completed');
      expect(result.grammar).toBe('completed');
      expect(result.problem).toBe('completed');
      expect(result.lastReview).toBe('locked');
    });
  });

  describe('직전보강 (lastReview) D-3 자동 해제', () => {
    it('시험일 7일 후 → locked', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const result = calculateStageStatuses(makeInput({
        examDate: futureDate.toISOString().split('T')[0],
      }));
      expect(result.lastReview).toBe('locked');
    });

    it('시험일 3일 후 → available', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const result = calculateStageStatuses(makeInput({
        examDate: futureDate.toISOString().split('T')[0],
      }));
      expect(result.lastReview).toBe('available');
    });

    it('시험일 1일 후 → available', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = calculateStageStatuses(makeInput({
        examDate: tomorrow.toISOString().split('T')[0],
      }));
      expect(result.lastReview).toBe('available');
    });

    it('시험일 오늘 (D-day) → available', () => {
      const today = new Date();
      const result = calculateStageStatuses(makeInput({
        examDate: today.toISOString().split('T')[0],
      }));
      expect(result.lastReview).toBe('available');
    });

    it('시험일 지남 → available (D-day 포함 과거)', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = calculateStageStatuses(makeInput({
        examDate: yesterday.toISOString().split('T')[0],
      }));
      expect(result.lastReview).toBe('available');
    });

    it('시험일 없고 콘텐츠 없으면 → locked', () => {
      const result = calculateStageStatuses(makeInput({
        examDate: null,
        content: makeContent({ hasLastReview: false }),
      }));
      expect(result.lastReview).toBe('locked');
    });

    it('진도 무관 — 다른 단계 미완료여도 D-3면 available', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const result = calculateStageStatuses(makeInput({
        progress: null, // 아무 진도 없음
        examDate: futureDate.toISOString().split('T')[0],
      }));
      expect(result.vocab).toBe('available');
      expect(result.passage).toBe('available');
      // lastReview는 D-3 이므로 available
      expect(result.lastReview).toBe('available');
    });
  });

  describe('문법 영상 80% 추적', () => {
    it('영상 3개 중 3개 완료 → grammar completed', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_completed: true,
          passage_completed: true,
          dialogue_completed: true,
          grammar_videos_completed: 3,
          grammar_total_videos: 3,
        }),
        grammarVideoCount: 3,
      }));
      expect(result.grammar).toBe('completed');
    });

    it('영상 3개 중 2개 완료 → grammar available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_completed: true,
          passage_completed: true,
          dialogue_completed: true,
          grammar_videos_completed: 2,
          grammar_total_videos: 3,
        }),
        grammarVideoCount: 3,
      }));
      expect(result.grammar).toBe('available');
    });

    it('영상 0개 (텍스트만) → grammar_completed 플래그로 판단', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_completed: true,
          passage_completed: true,
          dialogue_completed: true,
          grammar_completed: true,
        }),
        grammarVideoCount: 0,
      }));
      expect(result.grammar).toBe('completed');
    });
  });

  describe('단어 시험지 세트', () => {
    it('시험지 2개 중 2개 완료 + quiz/spelling 80% → vocab completed', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_quiz_sets_completed: 2,
          vocab_quiz_score: 85,
          vocab_spelling_score: 90,
        }),
        vocabQuizSetCount: 2,
      }));
      expect(result.vocab).toBe('completed');
    });

    it('시험지 2개 중 1개만 완료 → vocab available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_quiz_sets_completed: 1,
          vocab_quiz_score: 85,
          vocab_spelling_score: 90,
        }),
        vocabQuizSetCount: 2,
      }));
      expect(result.vocab).toBe('available');
    });

    it('시험지 완료했지만 quiz 80% 미만 → vocab available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_quiz_sets_completed: 2,
          vocab_quiz_score: 70,
          vocab_spelling_score: 90,
        }),
        vocabQuizSetCount: 2,
      }));
      expect(result.vocab).toBe('available');
    });
  });

  describe('교과서 암기 (passage) 완료 조건', () => {
    it('빈칸 80% + 영작 80% → passage completed', () => {
      // passage_completed is set server-side by progress API when all required stages ≥80
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_completed: true,
          passage_fill_blanks_best: 85,
          passage_translation_best: 80,
          passage_completed: true,
        }),
      }));
      expect(result.passage).toBe('completed');
    });

    it('빈칸 80% + 영작 79% → passage available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_completed: true,
          passage_fill_blanks_best: 85,
          passage_translation_best: 79,
        }),
      }));
      expect(result.passage).toBe('available');
    });

    it('빈칸 0% + 영작 100% → passage available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          vocab_completed: true,
          passage_fill_blanks_best: 0,
          passage_translation_best: 100,
        }),
      }));
      expect(result.passage).toBe('available');
    });
  });

  describe('enabledStages hidden 적용', () => {
    it('enabledStages에 없는 단계는 hidden', () => {
      const result = calculateStageStatuses(makeInput({
        enabledStages: ['vocab', 'passage', 'problem'],
      }));
      expect(result.vocab).toBe('available');
      expect(result.passage).toBe('available');
      expect(result.dialogue).toBe('hidden');
      expect(result.grammar).toBe('hidden');
      expect(result.problem).toBe('available');
      expect(result.lastReview).toBe('hidden');
    });
  });

  describe('하위 호환성 (레거시 2인자 호출)', () => {
    it('2인자 호출 시에도 정상 동작', () => {
      const progress = makeProgress({ vocab_completed: true });
      const content: NaesinContentAvailability = {
        hasVocab: true,
        hasPassage: true,
        hasDialogue: false,
        hasTextbookVideo: false,
        hasGrammar: false,
        hasProblem: false,
        hasMockExam: false,
        hasLastReview: false,
      };
      const result = calculateStageStatuses(progress, content);
      expect(result.vocab).toBe('completed');
      expect(result.passage).toBe('available');
      expect(result.dialogue).toBe('completed'); // no content
      expect(result.textbookVideo).toBe('completed'); // no content
      expect(result.grammar).toBe('completed'); // no content
      expect(result.problem).toBe('completed'); // no content
      expect(result.mockExam).toBe('completed'); // no content
      expect(result.lastReview).toBe('locked');
    });

    it('null progress + legacy 호출', () => {
      const content: NaesinContentAvailability = {
        hasVocab: true,
        hasPassage: false,
        hasDialogue: false,
        hasTextbookVideo: false,
        hasGrammar: false,
        hasProblem: false,
        hasMockExam: false,
        hasLastReview: false,
      };
      const result = calculateStageStatuses(null, content);
      expect(result.vocab).toBe('available');
      expect(result.passage).toBe('completed');
      expect(result.dialogue).toBe('completed');
    });
  });

  describe('2회독 (naesinRequiredRounds = 2)', () => {
    it('requiredRounds=2, round1만 완료 → passage available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          passage_completed: true,
          round2_passage_completed: false,
        }),
        naesinRequiredRounds: 2,
      }));
      expect(result.passage).toBe('available');
    });

    it('requiredRounds=2, round1 + round2 완료 → passage completed', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          passage_completed: true,
          round2_passage_completed: true,
        }),
        naesinRequiredRounds: 2,
      }));
      expect(result.passage).toBe('completed');
    });

    it('requiredRounds=1, round1만 완료 → passage completed (기존 동작)', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          passage_completed: true,
        }),
        naesinRequiredRounds: 1,
      }));
      expect(result.passage).toBe('completed');
    });

    it('requiredRounds=2, dialogue round1만 완료 → dialogue available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          dialogue_completed: true,
          round2_dialogue_completed: false,
        }),
        naesinRequiredRounds: 2,
      }));
      expect(result.dialogue).toBe('available');
    });

    it('requiredRounds=2, dialogue round1 + round2 완료 → dialogue completed', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          dialogue_completed: true,
          round2_dialogue_completed: true,
        }),
        naesinRequiredRounds: 2,
      }));
      expect(result.dialogue).toBe('completed');
    });

    it('requiredRounds=1, dialogue round1만 완료 → dialogue completed (기존 동작)', () => {
      const result = calculateStageStatuses(makeInput({
        progress: makeProgress({
          dialogue_completed: true,
        }),
        naesinRequiredRounds: 1,
      }));
      expect(result.dialogue).toBe('completed');
    });

    it('requiredRounds=2, 콘텐츠 없으면 → auto-complete (2회독 무관)', () => {
      const result = calculateStageStatuses(makeInput({
        content: makeContent({ hasPassage: false, hasDialogue: false }),
        naesinRequiredRounds: 2,
      }));
      expect(result.passage).toBe('completed');
      expect(result.dialogue).toBe('completed');
    });

    it('requiredRounds=2, 진도 없으면 → available', () => {
      const result = calculateStageStatuses(makeInput({
        progress: null,
        naesinRequiredRounds: 2,
      }));
      expect(result.passage).toBe('available');
      expect(result.dialogue).toBe('available');
    });
  });
});
