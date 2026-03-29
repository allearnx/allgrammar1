export type VocabModule = 'naesin' | 'voca';

export interface VocabDialogProps {
  module: VocabModule;
  parentId: string; // unitId (naesin) or dayId (voca)
  onAdd: () => void;
}

export function getVocabConfig(module: VocabModule) {
  return module === 'naesin'
    ? { parentIdKey: 'unit_id' as const, apiBase: '/api/naesin/vocabulary', logPrefix: 'admin' }
    : { parentIdKey: 'day_id' as const, apiBase: '/api/voca/vocabulary', logPrefix: 'voca_admin' };
}
