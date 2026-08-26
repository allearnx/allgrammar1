// 내신 학년 코드: 1~3 = 중1~중3, 4~6 = 고1~고3
// naesin_textbooks.grade CHECK (1~6, 105 마이그레이션)와 일치해야 함
export const NAESIN_GRADES = [1, 2, 3, 4, 5, 6];

export function gradeLabel(grade: number): string {
  return grade <= 3 ? `중${grade}` : `고${grade - 3}`;
}
