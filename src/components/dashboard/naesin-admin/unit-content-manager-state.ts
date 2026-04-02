export interface ContentManagerState {
  showVocabList: boolean;
  showPassageList: boolean;
  showGrammarList: boolean;
  showProblemList: boolean;
  showTextbookVideoList: boolean;
  showMockExamList: boolean;
  bulkDeleteOpen: boolean;
  dialogueCount: number | null;
  omrCount: number | null;
  lastReviewCount: number | null;
  regeneratingGV: string | null;
}

export type ContentManagerAction =
  | { type: 'TOGGLE_SECTION'; section: 'vocab' | 'passage' | 'grammar' | 'problem' | 'textbookVideo' | 'mockExam' }
  | { type: 'SET_BULK_DELETE_OPEN'; open: boolean }
  | { type: 'SET_COUNTS'; dialogueCount: number; omrCount: number; lastReviewCount: number }
  | { type: 'SET_REGENERATING_GV'; id: string | null };

const SECTION_KEY_MAP: Record<string, keyof ContentManagerState> = {
  vocab: 'showVocabList',
  passage: 'showPassageList',
  grammar: 'showGrammarList',
  problem: 'showProblemList',
  textbookVideo: 'showTextbookVideoList',
  mockExam: 'showMockExamList',
};

export function contentManagerReducer(state: ContentManagerState, action: ContentManagerAction): ContentManagerState {
  switch (action.type) {
    case 'TOGGLE_SECTION': {
      const key = SECTION_KEY_MAP[action.section];
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
  showTextbookVideoList: false,
  showMockExamList: false,
  bulkDeleteOpen: false,
  dialogueCount: null,
  omrCount: null,
  lastReviewCount: null,
  regeneratingGV: null,
};
