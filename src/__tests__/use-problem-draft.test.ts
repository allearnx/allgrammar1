import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useProblemDraft } from '@/hooks/use-problem-draft';
import type { InteractiveDraft, ImageAnswerDraft } from '@/hooks/use-problem-draft';

const SHEET_ID = 'sheet-123';
const KEY = `naesin-problem-draft-${SHEET_ID}`;
const Q_COUNT = 10;

// Mock localStorage for node environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

function makeDraft(): InteractiveDraft {
  return {
    version: 1,
    mode: 'interactive',
    sheetId: SHEET_ID,
    questionCount: Q_COUNT,
    savedAt: new Date().toISOString(),
    currentIndex: 3,
    score: { correct: 2, wrong: 1 },
    wrongList: [
      { number: 2, userAnswer: '3', correctAnswer: '1', question: 'Q2' },
    ],
    aiResultsMap: {},
    answeredUpTo: 3,
    overtimeQuestions: [],
    answersMap: { 0: '2', 1: '3', 2: '1' },
  };
}

function makeImageDraft(): ImageAnswerDraft {
  return {
    version: 1,
    mode: 'image_answer',
    sheetId: SHEET_ID,
    questionCount: Q_COUNT,
    savedAt: new Date().toISOString(),
    answers: { 0: '1', 1: '3', 2: '2' },
  };
}

describe('useProblemDraft', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('loadDraft', () => {
    it('returns null when no draft exists', () => {
      const { loadDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      expect(loadDraft()).toBeNull();
    });

    it('restores a valid interactive draft', () => {
      const draft = makeDraft();
      localStorageMock.setItem(KEY, JSON.stringify(draft));

      const { loadDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      const loaded = loadDraft();
      expect(loaded).not.toBeNull();
      expect(loaded!.mode).toBe('interactive');
      expect((loaded as InteractiveDraft).currentIndex).toBe(3);
      expect((loaded as InteractiveDraft).score).toEqual({ correct: 2, wrong: 1 });
    });

    it('restores a valid image_answer draft', () => {
      const draft = makeImageDraft();
      localStorageMock.setItem(KEY, JSON.stringify(draft));

      const { loadDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      const loaded = loadDraft();
      expect(loaded).not.toBeNull();
      expect(loaded!.mode).toBe('image_answer');
      expect((loaded as ImageAnswerDraft).answers).toEqual({ 0: '1', 1: '3', 2: '2' });
    });

    it('returns null when version mismatches', () => {
      const draft = { ...makeDraft(), version: 999 };
      localStorageMock.setItem(KEY, JSON.stringify(draft));

      const { loadDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      expect(loadDraft()).toBeNull();
    });

    it('returns null when questionCount mismatches', () => {
      const draft = makeDraft();
      localStorageMock.setItem(KEY, JSON.stringify(draft));

      const { loadDraft } = useProblemDraft(SHEET_ID, 20);
      expect(loadDraft()).toBeNull();
    });

    it('returns null on corrupt JSON', () => {
      localStorageMock.setItem(KEY, '{not valid json!!!');

      const { loadDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      expect(loadDraft()).toBeNull();
    });
  });

  describe('saveDraft', () => {
    it('saves draft to localStorage', () => {
      const { saveDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      saveDraft({
        mode: 'interactive',
        currentIndex: 2,
        score: { correct: 1, wrong: 1 },
        wrongList: [],
        aiResultsMap: {},
        answeredUpTo: 2,
        overtimeQuestions: [],
        answersMap: { 0: '1', 1: '3' },
      });

      const stored = JSON.parse(store[KEY]);
      expect(stored.version).toBe(1);
      expect(stored.sheetId).toBe(SHEET_ID);
      expect(stored.questionCount).toBe(Q_COUNT);
      expect(stored.currentIndex).toBe(2);
      expect(stored.savedAt).toBeDefined();
    });

    it('saves image_answer draft', () => {
      const { saveDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      saveDraft({
        mode: 'image_answer',
        answers: { 0: '1', 1: '2' },
      });

      const stored = JSON.parse(store[KEY]);
      expect(stored.mode).toBe('image_answer');
      expect(stored.answers).toEqual({ 0: '1', 1: '2' });
    });
  });

  describe('clearDraft', () => {
    it('removes draft from localStorage', () => {
      localStorageMock.setItem(KEY, JSON.stringify(makeDraft()));

      const { clearDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      clearDraft();

      expect(store[KEY]).toBeUndefined();
    });
  });

  describe('localStorage unavailable', () => {
    it('loadDraft returns null without throwing', () => {
      localStorageMock.getItem.mockImplementationOnce(() => { throw new Error('SecurityError'); });

      const { loadDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      expect(loadDraft()).toBeNull();
    });

    it('saveDraft does not throw', () => {
      localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('QuotaExceeded'); });

      const { saveDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      expect(() =>
        saveDraft({ mode: 'interactive', currentIndex: 0, score: { correct: 0, wrong: 0 }, wrongList: [], aiResultsMap: {}, answeredUpTo: 0, overtimeQuestions: [], answersMap: {} })
      ).not.toThrow();
    });

    it('clearDraft does not throw', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => { throw new Error('SecurityError'); });

      const { clearDraft } = useProblemDraft(SHEET_ID, Q_COUNT);
      expect(() => clearDraft()).not.toThrow();
    });
  });
});
