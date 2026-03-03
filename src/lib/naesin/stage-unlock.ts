import type {
  NaesinStudentProgress,
  NaesinStageStatus,
  NaesinStageStatuses,
  NaesinContentAvailability,
} from '@/types/database';

export function calculateStageStatuses(
  progress: NaesinStudentProgress | null,
  content: NaesinContentAvailability
): NaesinStageStatuses {
  // Stage 1: Vocab — always available (first stage)
  const vocabStatus = getVocabStatus(progress, content.hasVocab);

  // Stage 2: Passage — requires vocab completed
  const passageStatus = getPassageStatus(progress, content.hasPassage, vocabStatus);

  // Stage 3: Grammar — requires passage completed
  const grammarStatus = getGrammarStatus(progress, content.hasGrammar, passageStatus);

  // Stage 4: OMR — requires grammar completed
  const omrStatus = getOmrStatus(progress, content.hasOmr, grammarStatus);

  return {
    vocab: vocabStatus,
    passage: passageStatus,
    grammar: grammarStatus,
    omr: omrStatus,
  };
}

function getVocabStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean
): NaesinStageStatus {
  if (!hasContent) return 'completed'; // auto-complete if no content
  if (progress?.vocab_completed) return 'completed';
  return 'available';
}

function getPassageStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
  prevStatus: NaesinStageStatus
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.passage_completed) return 'completed';
  if (prevStatus !== 'completed') return 'locked';
  return 'available';
}

function getGrammarStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
  prevStatus: NaesinStageStatus
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.grammar_completed) return 'completed';
  if (prevStatus !== 'completed') return 'locked';
  return 'available';
}

function getOmrStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
  prevStatus: NaesinStageStatus
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.omr_completed) return 'completed';
  if (prevStatus !== 'completed') return 'locked';
  return 'available';
}
