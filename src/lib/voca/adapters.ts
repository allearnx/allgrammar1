import type { MemoryItem, StudentMemoryProgress, NaesinVocabulary } from '@/types/database';
import type { VocaVocabulary } from '@/types/voca';

/**
 * VocaVocabulary → MemoryItem shape (for reusing FlashcardView, SpellingView)
 */
export function vocaToMemoryItem(
  vocab: VocaVocabulary
): MemoryItem & { progress: StudentMemoryProgress | null } {
  return {
    id: vocab.id,
    grammar_id: '',
    item_type: 'vocabulary',
    front_text: vocab.front_text,
    back_text: vocab.back_text,
    quiz_options: null,
    quiz_correct_index: null,
    spelling_hint: vocab.spelling_hint,
    spelling_answer: vocab.spelling_answer,
    sort_order: vocab.sort_order,
    created_at: vocab.created_at,
    progress: null,
  };
}

/**
 * VocaVocabulary → NaesinVocabulary shape (for reusing QuizView)
 */
export function vocaToNaesinVocabulary(vocab: VocaVocabulary): NaesinVocabulary {
  return {
    id: vocab.id,
    unit_id: vocab.day_id,
    front_text: vocab.front_text,
    back_text: vocab.back_text,
    part_of_speech: vocab.part_of_speech,
    example_sentence: vocab.example_sentence,
    synonyms: vocab.synonyms,
    antonyms: vocab.antonyms,
    quiz_options: null,
    quiz_correct_index: null,
    spelling_hint: vocab.spelling_hint,
    spelling_answer: vocab.spelling_answer,
    sort_order: vocab.sort_order,
    created_at: vocab.created_at,
  };
}
