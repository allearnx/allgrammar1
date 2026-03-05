import type { Grammar } from './grammar';

export interface Level {
  id: string;
  level_number: number;
  title: string;
  title_ko: string;
  description: string | null;
  created_at: string;
}

export interface LevelWithGrammars extends Level {
  grammars: Grammar[];
}

export interface LevelWithProgress extends Level {
  grammars: Grammar[];
  completed_count: number;
  total_count: number;
}
