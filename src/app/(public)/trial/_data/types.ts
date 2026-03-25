export interface MCQuestion {
  id: number;
  type: 'mc';
  question: string;
  options: string[];
  answer: number | number[]; // 1-5, or array for multiple correct answers
}

export interface SubjectiveQuestion {
  id: number;
  type: 'subjective';
  question: string;
  answer: string;
  acceptableAnswers?: string[];
}

export type Question = MCQuestion | SubjectiveQuestion;

export interface Section {
  passage?: string;
  questions: Question[];
}

export interface ExamSet {
  id: string;
  label: string;
  grade: 2 | 3;
  sections: Section[];
}
