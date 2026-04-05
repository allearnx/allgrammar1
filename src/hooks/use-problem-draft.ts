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

  async function saveServerDraft(draft: DraftInput, unitId?: string | null): Promise<boolean> {
    try {
      const full: ProblemDraft = {
        ...draft,
        version: DRAFT_VERSION,
        sheetId,
        questionCount,
        savedAt: new Date().toISOString(),
      } as ProblemDraft;

      const answeredCount = full.mode === 'interactive'
        ? Object.keys(full.answersMap ?? {}).length
        : Object.keys((full as ImageAnswerDraft).answers ?? {}).length;

      const res = await fetch('/api/naesin/problems/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId,
          unitId: unitId ?? null,
          draftData: full,
          answeredCount,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function loadServerDraft(): Promise<ProblemDraft | null> {
    try {
      const res = await fetch(`/api/naesin/problems/draft/load?sheetId=${sheetId}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.draft_data) return null;
      const draft = data.draft_data as ProblemDraft;
      if (draft.version !== DRAFT_VERSION) return null;
      if (draft.questionCount !== questionCount) return null;
      return draft;
    } catch {
      return null;
    }
  }

  async function clearServerDraft(): Promise<void> {
    try {
      await fetch('/api/naesin/problems/draft/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId }),
      });
    } catch {
      // ignore
    }
  }

  return { loadDraft, saveDraft, clearDraft, saveServerDraft, loadServerDraft, clearServerDraft };
}
