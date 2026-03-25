export type { ExamSet, Question, MCQuestion, SubjectiveQuestion, Section } from './types';

import { m2Miraeen } from './m2-miraeen';
import { m2Chunjae } from './m2-chunjae';
import { m2Ybm } from './m2-ybm';
import { m3Bisang } from './m3-bisang';
import { m3Chunjae } from './m3-chunjae';
import { m3Dongayun } from './m3-dongayun';

export const EXAM_SETS = [
  m2Miraeen,
  m2Chunjae,
  m2Ybm,
  m3Bisang,
  m3Chunjae,
  m3Dongayun,
] as const;
