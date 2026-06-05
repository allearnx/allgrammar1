/**
 * Cache tag generators — revalidateTag()와 unstable_cache tags에 동일하게 사용
 *
 * 규칙: `{도메인}:{id}` 형식. 도메인은 kebab-case.
 */
export const cacheTags = {
  /** 학생 서비스 할당 (service_assignments) */
  studentServices: (studentId: string) => `student-services:${studentId}`,

  /** 학원 결제 상태 (subscriptions) */
  isPaid: (academyId: string) => `is-paid:${academyId}`,

  /** 내신 사이드바 트리 (assignments + units + progress + content) */
  naesinSidebar: (studentId: string) => `naesin-sidebar:${studentId}`,

  /** 학생 진도 (naesin_student_progress) */
  studentProgress: (studentId: string) => `student-progress:${studentId}`,

  /** 유닛 콘텐츠 (vocab, passages, grammar, problems) */
  unitContent: (unitId: string) => `unit-content:${unitId}`,

  /** 보카 데이터 (voca_days by book) */
  vocaContent: (bookId: string) => `voca-content:${bookId}`,

  /** 보카 교재 목록 (voca_books, 글로벌) */
  vocaBooks: () => 'voca-books' as const,
} as const;
