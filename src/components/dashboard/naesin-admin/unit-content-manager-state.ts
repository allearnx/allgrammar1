export interface ContentManagerState {
  showVocabList: boolean;
  showPassageList: boolean;
  showGrammarList: boolean;
  showProblemList: boolean;
  bulkDeleteOpen: boolean;
  dialogueCount: number | null;
  omrCount: number | null;
  lastReviewCount: number | null;
  regeneratingGV: string | null;
}

export type ContentManagerAction =
  | { type: 'TOGGLE_SECTION'; section: 'vocab' | 'passage' | 'grammar' | 'problem' }
  | { type: 'SET_BULK_DELETE_OPEN'; open: boolean }
  | { type: 'SET_COUNTS'; dialogueCount: number; omrCount: number; lastReviewCount: number }
  | { type: 'SET_REGENERATING_GV'; id: string | null };

export function contentManagerReducer(state: ContentManagerState, action: ContentManagerAction): ContentManagerState {
  switch (action.type) {
    case 'TOGGLE_SECTION': {
      const key = `show${action.section.charAt(0).toUpperCase() + action.section.slice(1)}List` as keyof ContentManagerState;
      return { ...state, [key]: !state[key] };
    }
    case 'SET_BULK_DELETE_OPEN':
      return { ...state, bulkDeleteOpen: action.open };
    case 'SET_COUNTS':
      return { ...state, dialogueCount: action.dialogueCount, omrCount: action.omrCount, lastReviewCount: action.lastReviewCount };
    case 'SET_REGENERATING_GV':
      return { ...state, regeneratingGV: action.id };
    default:
      return state;
  }
}

export const contentManagerInitialState: ContentManagerState = {
  showVocabList: false,
  showPassageList: false,
  showGrammarList: false,
  showProblemList: false,
  bulkDeleteOpen: false,
  dialogueCount: null,
  omrCount: null,
  lastReviewCount: null,
  regeneratingGV: null,
};
