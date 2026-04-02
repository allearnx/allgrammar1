const DRAFT_VERSION = 1;

function draftKey(sheetId: string) {
  return `naesin-problem-draft-${sheetId}`;
}

export interface AiFeedback {
  score: number;
  feedback: string;
  correctedAnswer: string;
}

export interface WrongItem {
  number: number;
  userAnswer: string | number;
  correctAnswer: string | number;
  question: string;
  aiFeedback?: AiFeedback;
}

export interface InteractiveDraft {
  version: number;
  mode: 'interactive';
  sheetId: string;
  questionCount: number;
  savedAt: string;
  currentIndex: number;
  score: { correct: number; wrong: number };
  wrongList: WrongItem[];
  aiResultsMap: Record<string, AiFeedback>;
  answeredUpTo: number;
  overtimeQuestions: number[];
  answersMap: Record<number, string | number>;
}

export interface ImageAnswerDraft {
  version: number;
  mode: 'image_answer';
  sheetId: string;
  questionCount: number;
  savedAt: string;
  answers: Record<number, string>;
}

export type ProblemDraft = InteractiveDraft | ImageAnswerDraft;

type CommonKeys = 'version' | 'sheetId' | 'questionCount' | 'savedAt';
type InteractiveDraftInput = Omit<InteractiveDraft, CommonKeys>;
type ImageAnswerDraftInput = Omit<ImageAnswerDraft, CommonKeys>;
export type DraftInput = InteractiveDraftInput | ImageAnswerDraftInput;

export function useProblemDraft(sheetId: string, questionCount: number) {
  const key = draftKey(sheetId);

  function loadDraft(): ProblemDraft | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ProblemDraft;
      if (parsed.version !== DRAFT_VERSION) return null;
      if (parsed.questionCount !== questionCount) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveDraft(draft: DraftInput) {
    try {
      const full = {
        ...draft,
        version: DRAFT_VERSION,
        sheetId,
        questionCount,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(full));
    } catch {
      // localStorage unavailable (e.g. private browsing quota exceeded)
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  return { loadDraft, saveDraft, clearDraft };
}
