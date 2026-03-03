import type {
  MemoryItem,
  StudentMemoryProgress,
  TextbookPassage,
  NaesinVocabulary,
  NaesinPassage,
} from '@/types/database';

/**
 * NaesinVocabulary → MemoryItem shape (for reusing FlashcardView, QuizView, SpellingView)
 */
export function vocabToMemoryItem(
  vocab: NaesinVocabulary
): MemoryItem & { progress: StudentMemoryProgress | null } {
  return {
    id: vocab.id,
    grammar_id: '', // not used in naesin context
    item_type: 'vocabulary',
    front_text: vocab.front_text,
    back_text: vocab.back_text,
    quiz_options: vocab.quiz_options,
    quiz_correct_index: vocab.quiz_correct_index,
    spelling_hint: vocab.spelling_hint,
    spelling_answer: vocab.spelling_answer,
    sort_order: vocab.sort_order,
    created_at: vocab.created_at,
    progress: null, // naesin tracks progress separately
  };
}

/**
 * NaesinPassage → TextbookPassage shape (for reusing FillBlanksView, OrderingView)
 */
export function passageToTextbookPassage(passage: NaesinPassage): TextbookPassage {
  return {
    id: passage.id,
    grammar_id: '', // not used in naesin context
    title: passage.title,
    original_text: passage.original_text,
    korean_translation: passage.korean_translation,
    blanks_easy: passage.blanks_easy,
    blanks_medium: passage.blanks_medium,
    blanks_hard: passage.blanks_hard,
    sentences: passage.sentences,
    is_textbook_mode_active: true,
    created_at: passage.created_at,
  };
}
