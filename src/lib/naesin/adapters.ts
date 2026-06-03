import type {
  MemoryItem,
  StudentMemoryProgress,
  TextbookPassage,
  NaesinVocabulary,
  NaesinPassage,
  GrammarVocabItem,
} from '@/types/database';
import type { SentenceItem } from '@/types/textbook';

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
 * 숫자만 있는 문장(단락 번호)을 다음 문장의 korean에 합침
 */
function mergeParagraphNumbers(sentences: SentenceItem[]): SentenceItem[] {
  const result: SentenceItem[] = [];
  let pendingNumber = '';

  for (const s of sentences) {
    if (/^\d+\.?\s*$/.test(s.original.trim())) {
      pendingNumber = s.original.trim();
    } else {
      result.push({
        ...s,
        korean: pendingNumber ? `${pendingNumber} ${s.korean}` : s.korean,
      });
      pendingNumber = '';
    }
  }

  return result;
}

/**
 * 설정(requiredStages)에 빠져 있더라도 passage 데이터가 실제로 존재하면 자동으로 탭을 추가한다.
 * 예: grammar_vocab_items 데이터가 있으면 grammar_vocab 탭을 자동 노출.
 */
export const DEFAULT_PASSAGE_STAGES: string[] = ['fill_blanks', 'translation'];

export function augmentPassageStages(
  requiredStages: string[] | undefined | null,
  passages: Pick<NaesinPassage, 'grammar_vocab_items'>[],
): string[] {
  const stages = [...(requiredStages ?? DEFAULT_PASSAGE_STAGES)];

  if (!stages.includes('grammar_vocab')) {
    const hasGV = passages.some(
      (p) => ((p.grammar_vocab_items ?? []) as GrammarVocabItem[]).length > 0,
    );
    if (hasGV) stages.push('grammar_vocab');
  }

  return stages;
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
    sentences: passage.sentences ? mergeParagraphNumbers(passage.sentences) : null,
    is_textbook_mode_active: true,
    created_at: passage.created_at,
  };
}
