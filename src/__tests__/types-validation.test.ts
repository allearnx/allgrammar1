import { describe, it, expect } from 'vitest';
import type {
  NaesinStageStatuses,
  NaesinContentAvailability,
  NaesinExamDate,
  NaesinVocabQuizSet,
  NaesinGrammarVideoProgress,
  NaesinProblemSheet,
  NaesinWrongAnswer,
  NaesinSimilarProblem,
  NaesinLastReviewContent,
  NaesinStudentProgress,
} from '@/types/database';

describe('타입 검증 (컴파일 타임 + 런타임 구조 확인)', () => {
  describe('NaesinStageStatuses', () => {
    it('8단계 key를 가진다', () => {
      const statuses: NaesinStageStatuses = {
        vocab: 'available',
        passage: 'locked',
        dialogue: 'locked',
        textbookVideo: 'locked',
        grammar: 'locked',
        problem: 'locked',
        mockExam: 'locked',
        lastReview: 'locked',
      };
      expect(statuses.vocab).toBe('available');
      expect(statuses.dialogue).toBe('locked');
      expect(statuses.problem).toBe('locked');
      expect(statuses.lastReview).toBe('locked');
    });

    it('omr는 optional이다', () => {
      const statuses: NaesinStageStatuses = {
        vocab: 'completed',
        passage: 'completed',
        dialogue: 'completed',
        textbookVideo: 'completed',
        grammar: 'completed',
        problem: 'completed',
        mockExam: 'completed',
        lastReview: 'available',
        omr: 'completed', // deprecated but still valid
      };
      expect(statuses.omr).toBe('completed');
    });
  });

  describe('NaesinContentAvailability', () => {
    it('hasProblem, hasLastReview, hasDialogue 포함', () => {
      const content: NaesinContentAvailability = {
        hasVocab: true,
        hasPassage: true,
        hasDialogue: false,
        hasTextbookVideo: false,
        hasGrammar: true,
        hasProblem: false,
        hasMockExam: false,
        hasLastReview: false,
      };
      expect(content.hasDialogue).toBe(false);
      expect(content.hasProblem).toBe(false);
      expect(content.hasLastReview).toBe(false);
    });
  });

  describe('NaesinStudentProgress 새 컬럼', () => {
    it('신규 컬럼이 모두 존재해야 한다', () => {
      const progress: Partial<NaesinStudentProgress> = {
        vocab_quiz_sets_completed: 2,
        vocab_total_quiz_sets: 3,
        passage_translation_best: 85,
        grammar_videos_completed: 4,
        grammar_total_videos: 5,
        problem_completed: true,
        last_review_unlocked: false,
      };
      expect(progress.vocab_quiz_sets_completed).toBe(2);
      expect(progress.passage_translation_best).toBe(85);
      expect(progress.grammar_videos_completed).toBe(4);
      expect(progress.problem_completed).toBe(true);
    });
  });

  describe('NaesinExamDate', () => {
    it('student_id + textbook_id + exam_date 구조', () => {
      const examDate: NaesinExamDate = {
        id: 'ed-1',
        student_id: 's-1',
        textbook_id: 'tb-1',
        exam_date: '2026-03-15',
        created_at: '',
        updated_at: '',
      };
      expect(examDate.exam_date).toBe('2026-03-15');
    });
  });

  describe('NaesinVocabQuizSet', () => {
    it('vocab_ids는 UUID 배열', () => {
      const set: NaesinVocabQuizSet = {
        id: 'qs-1',
        unit_id: 'u-1',
        title: '시험지 A',
        set_order: 1,
        vocab_ids: ['v-1', 'v-2', 'v-3'],
        created_at: '',
      };
      expect(set.vocab_ids).toHaveLength(3);
      expect(set.set_order).toBe(1);
    });
  });

  describe('NaesinGrammarVideoProgress', () => {
    it('watch_percent, max_position_reached, cumulative_watch_seconds 구조', () => {
      const progress: NaesinGrammarVideoProgress = {
        id: 'vp-1',
        student_id: 's-1',
        lesson_id: 'l-1',
        watch_percent: 85,
        max_position_reached: 255.5,
        duration: 300,
        cumulative_watch_seconds: 240,
        last_position: 250,
        completed: true,
        updated_at: '',
      };
      expect(progress.watch_percent).toBe(85);
      expect(progress.completed).toBe(true);
      expect(progress.cumulative_watch_seconds).toBe(240);
    });
  });

  describe('NaesinProblemSheet', () => {
    it('interactive 모드 구조', () => {
      const sheet: NaesinProblemSheet = {
        id: 'ps-1',
        unit_id: 'u-1',
        title: '1차 문제지',
        mode: 'interactive',
        questions: [
          { number: 1, question: 'What is...?', options: ['a', 'b', 'c', 'd', 'e'], answer: '3', explanation: '' },
        ],
        pdf_url: null,
        answer_key: ['3'],
        sort_order: 0,
        category: 'problem',
        created_at: '',
      };
      expect(sheet.mode).toBe('interactive');
      expect(sheet.questions).toHaveLength(1);
      expect(sheet.category).toBe('problem');
    });

    it('image_answer 모드 구조', () => {
      const sheet: NaesinProblemSheet = {
        id: 'ps-2',
        unit_id: 'u-1',
        title: '이미지 문제지',
        mode: 'image_answer',
        questions: [],
        pdf_url: 'https://storage.example.com/test.pdf',
        answer_key: ['1', '3', '2', '4', '5'],
        sort_order: 0,
        category: 'last_review',
        created_at: '',
      };
      expect(sheet.mode).toBe('image_answer');
      expect(sheet.pdf_url).toBeTruthy();
      expect(sheet.category).toBe('last_review');
    });
  });

  describe('NaesinWrongAnswer', () => {
    it('stage 값은 5가지 중 하나', () => {
      const stages: NaesinWrongAnswer['stage'][] = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'];
      stages.forEach((stage) => {
        const wa: NaesinWrongAnswer = {
          id: 'wa-1',
          student_id: 's-1',
          unit_id: 'u-1',
          stage,
          source_type: 'fill_blank',
          question_data: { answer: 'test' },
          resolved: false,
          created_at: '',
        };
        expect(wa.stage).toBe(stage);
      });
    });
  });

  describe('NaesinSimilarProblem', () => {
    it('status: pending → approved → rejected 흐름', () => {
      const statuses: NaesinSimilarProblem['status'][] = ['pending', 'approved', 'rejected'];
      statuses.forEach((status) => {
        const sp: NaesinSimilarProblem = {
          id: 'sp-1',
          unit_id: 'u-1',
          wrong_answer_id: null,
          grammar_tag: 'present_perfect',
          question_data: { number: 1, question: 'test', answer: '1' },
          status,
          quality_score: null,
          rejection_reason: null,
          validation_result: null,
          created_by: null,
          reviewed_by: null,
          created_at: '',
          updated_at: '',
        };
        expect(sp.status).toBe(status);
      });
    });
  });

  describe('NaesinLastReviewContent', () => {
    it('3가지 content_type 지원', () => {
      const types: NaesinLastReviewContent['content_type'][] = ['video', 'pdf', 'text'];
      types.forEach((ct) => {
        const content: NaesinLastReviewContent = {
          id: 'lrc-1',
          unit_id: 'u-1',
          content_type: ct,
          title: '보충 자료',
          youtube_url: ct === 'video' ? 'https://youtube.com/...' : null,
          youtube_video_id: ct === 'video' ? 'abc123' : null,
          pdf_url: ct === 'pdf' ? 'https://storage.example.com/file.pdf' : null,
          text_content: ct === 'text' ? '텍스트 내용' : null,
          sort_order: 0,
          created_at: '',
        };
        expect(content.content_type).toBe(ct);
      });
    });
  });
});
