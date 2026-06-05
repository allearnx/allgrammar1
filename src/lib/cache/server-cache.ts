import { unstable_cache } from 'next/cache';

/**
 * TTL 프리셋 (초 단위)
 *
 * STATIC  — 거의 안 바뀌는 데이터 (교과서 목록, 보카 북 등)
 * CONTENT — 관리자가 수정할 수 있는 콘텐츠 (문제 시트, 단어 등)
 * SESSION — 세션 중 자주 조회하는 데이터 (서비스 할당, 결제 상태)
 * LIVE    — 자주 바뀌는 데이터 (사이드바 진도, 모니터링)
 */
export const TTL = {
  STATIC: 3600,   // 1시간
  CONTENT: 300,   // 5분
  SESSION: 300,   // 5분
  LIVE: 60,       // 1분
} as const;

type TTLValue = (typeof TTL)[keyof typeof TTL];

/**
 * unstable_cache 래퍼 — 보일러플레이트 제거
 *
 * @example
 * const getServices = cached(
 *   async (studentId: string) => { ... },
 *   'student-services',
 *   TTL.SESSION,
 *   (studentId) => [cacheTags.studentServices(studentId)],
 * );
 * const services = await getServices(userId);
 */
export function cached<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyPrefix: string,
  revalidate: TTLValue | number,
  tagsFn?: (...args: TArgs) => string[],
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => {
    const keyParts = [keyPrefix, ...args.map(String)];
    const tags = tagsFn?.(...args);

    return unstable_cache(
      () => fn(...args),
      keyParts,
      { revalidate, ...(tags ? { tags } : {}) },
    )();
  };
}
