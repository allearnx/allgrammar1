/**
 * 무료 학생 안내 문구 — 환영 팝업·사이드 메뉴 배지·홈 추천 카드가 같은 문구를 쓴다.
 * 숫자는 feature-gate의 실제 제한값에서 가져와 안내와 동작이 어긋나지 않게 한다.
 */
import { FREE_NAESIN_UNIT_LIMIT, FREE_VOCA_DAY_LIMIT, FREE_VOCA_TRIAL_DAYS } from './feature-gate';

export type FreeServiceKey = 'voca' | 'naesin';

export interface FreeServiceInfo {
  label: string;
  href: string;
  /** 한 줄 소개 (추천 카드) */
  tagline: string;
  /** 무료 범위 한 줄 (사이드 메뉴 배지 툴팁) */
  freeScope: string;
  /** 무료 범위 자세히 (환영 팝업) */
  freeScopeDetail: string[];
  /** 사용법 단계 (환영 팝업) */
  steps: { title: string; desc: string }[];
}

export const FREE_SERVICE_INFO: Record<FreeServiceKey, FreeServiceInfo> = {
  voca: {
    label: '올킬보카',
    href: '/student/voca',
    tagline: '교과서·모의고사 기출 단어를 4단계로 완벽 암기',
    freeScope: `${FREE_VOCA_TRIAL_DAYS}일 전체 체험 · 이후 Day ${FREE_VOCA_DAY_LIMIT}개 무료`,
    freeScopeDetail: [
      `가입 후 ${FREE_VOCA_TRIAL_DAYS}일 동안은 모든 Day 1회독`,
      `교재마다 Day 1~${FREE_VOCA_DAY_LIMIT}은 2회독(유의어·반의어·숙어)까지`,
      `${FREE_VOCA_TRIAL_DAYS}일이 지나면 교재마다 Day 1~${FREE_VOCA_DAY_LIMIT}`,
    ],
    steps: [
      { title: '교재 고르기', desc: '학년에 맞는 추천 교재를 골라요.' },
      { title: 'Day 학습', desc: '카드 → 종합 → 스펠링 → 매칭 4단계로 외워요.' },
      { title: '2회독', desc: '유의어·반의어·숙어까지 한 번 더 외워요.' },
      { title: '올킬시험', desc: '왼쪽 메뉴 ‘올킬시험’에서 외운 단어를 시험 봐요.' },
    ],
  },
  naesin: {
    label: '올인내신',
    href: '/student/naesin',
    tagline: '우리 학교 교과서로 어휘·지문·대화문 암기',
    freeScope: `${FREE_NAESIN_UNIT_LIMIT}단원 · 어휘·지문·대화문 무료`,
    freeScopeDetail: [
      `첫 ${FREE_NAESIN_UNIT_LIMIT}단원 무료`,
      '어휘 · 지문 · 대화문 암기 3종',
      '문법 · 문제풀이 · 영상 · 모의고사는 유료 플랜에서 열려요',
    ],
    steps: [
      { title: '교과서 고르기', desc: '우리 학교·학년 교과서를 골라요.' },
      { title: '어휘 암기', desc: '단원 단어를 카드와 퀴즈로 외워요.' },
      { title: '지문 암기', desc: '본문을 빈칸·순서 맞추기로 외워요.' },
      { title: '대화문 암기', desc: '대화문까지 외우면 단원 완료!' },
    ],
  },
};

export function otherFreeService(service: FreeServiceKey): FreeServiceKey {
  return service === 'voca' ? 'naesin' : 'voca';
}
