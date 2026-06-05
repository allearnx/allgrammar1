import { revalidateTag } from 'next/cache';
import { cacheTags } from './tags';

/**
 * 캐시 무효화 헬퍼 — mutation API 라우트에서 호출
 *
 * Next.js 16: revalidateTag 두 번째 인자 "max" 필수 (전체 캐시 수명 무효화)
 *
 * @example
 * // 학생 진도 업데이트 후
 * invalidateStudent(studentId);
 *
 * // 문제 시트 수정 후
 * invalidateUnitContent(unitId);
 */

/** 학생 관련 캐시 전부 무효화 (진도 변경, 서비스 할당 변경 등) */
export function invalidateStudent(studentId: string) {
  revalidateTag(cacheTags.studentProgress(studentId), 'max');
  revalidateTag(cacheTags.naesinSidebar(studentId), 'max');
}

/** 서비스 할당 변경 시 */
export function invalidateStudentServices(studentId: string) {
  revalidateTag(cacheTags.studentServices(studentId), 'max');
  revalidateTag(cacheTags.naesinSidebar(studentId), 'max');
}

/** 유닛 콘텐츠 변경 시 (문제 시트 추가/수정, 단어 수정 등) */
export function invalidateUnitContent(unitId: string) {
  revalidateTag(cacheTags.unitContent(unitId), 'max');
}

/** 결제 상태 변경 시 */
export function invalidatePayment(academyId: string) {
  revalidateTag(cacheTags.isPaid(academyId), 'max');
}

/** 보카 Day 변경 시 */
export function invalidateVocaContent(bookId: string) {
  revalidateTag(cacheTags.vocaContent(bookId), 'max');
}

/** 보카 교재 목록 변경 시 */
export function invalidateVocaBooks() {
  revalidateTag(cacheTags.vocaBooks(), 'max');
}
