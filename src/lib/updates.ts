// 플랫폼 업데이트·사용법 공지 (최신순으로 위에 추가).
// 기능 배포 시 여기에 한 항목 추가하면 사이드바 '업데이트·사용법' + 상단 배너에 자동 반영됩니다.

export type UpdateTag = 'new' | 'improve' | 'guide';

export interface PlatformUpdate {
  id: string;        // 고유값 (배너 '닫기' 기억용). 새 항목마다 새 id.
  date: string;      // YYYY-MM-DD
  tag: UpdateTag;
  title: string;
  body: string;      // 줄바꿈(\n) 지원
}

export const UPDATES: PlatformUpdate[] = [
  {
    id: '2026-07-05-voca-exam-guide',
    date: '2026-07-05',
    tag: 'guide',
    title: '보카 스펠링 시험 — 채점 기준과 결과 확인법',
    body:
      '선생님들이 자주 묻는 내용을 정리했어요.\n' +
      '• 채점 기준: "첫 시도에 정확히 입력한 글자 비율"이 점수예요. 틀린 키를 누르면 입력은 되지 않지만 그 자리는 감점되고, 해당 단어는 틀린 단어로 자동 기록됩니다 (시험 통과 90점)\n' +
      '• 결과 확인: 선생님 메뉴 "보카 시험 결과"에서 학생별 점수 · 재응시 횟수 · 틀린 단어 목록을 볼 수 있어요 — 학생이 오답을 직접 써서 제출하지 않아도 시스템이 잡아냅니다\n' +
      '• 보너스 시험은 통과해도 Day 진도와 무관한 추가 시험이에요. Day 통과는 1회독 4단계(플래시카드 → 퀴즈 → 스펠링 → 매칭)로만 결정됩니다.',
  },
  {
    id: '2026-06-30-voca-exam',
    date: '2026-06-30',
    tag: 'new',
    title: '올킬보카 표제어 스펠링 시험 + 학부모 공유',
    body:
      '보카에 표제어 스펠링 시험이 생겼어요.\n' +
      '• 학생: 보카 홈에서 Day를 1~3개 골라 보너스 시험에 도전 (진도엔 영향 없음)\n' +
      '• 선생님: "보카 시험 결과"에서 학생에게 시험 범위를 정해 배정 + 결과(최고점·재응시·오답) 확인\n' +
      '• 학부모: 결과 페이지의 "링크" 버튼으로 학부모에게 전송 → 오늘 본 시험이 맨 위로 보여요.',
  },
  {
    id: '2026-06-29-voca-matching',
    date: '2026-06-29',
    tag: 'improve',
    title: '올킬보카 매칭 개선',
    body:
      '• 한 세트(5단어)를 다 맞추면 "세트 완료" 신호가 떠요 (조용히 넘어가지 않음)\n' +
      '• 맞은 짝을 같은 번호로 연결해 보여줘서 어떤 단어-뜻이 이어졌는지 명확\n' +
      '• 같은 뜻의 단어 2개가 한 세트에 같이 나오지 않게 배정',
  },
  {
    id: '2026-06-28-voca-book-picker',
    date: '2026-06-28',
    tag: 'improve',
    title: '올킬보카 교재 선택 편의 개선',
    body:
      '• 교재가 많아도 깔끔하게 — 검색 가능한 드롭다운으로 변경\n' +
      '• 교재를 바꾼 뒤 뒤로가기/사이드바로 돌아와도 선택이 유지돼요\n' +
      '• 오답은 퀴즈에서 틀린 단어만 모아서 보여줘요.',
  },
];

export const LATEST_UPDATE: PlatformUpdate | null = UPDATES[0] ?? null;

export const TAG_LABEL: Record<UpdateTag, string> = {
  new: 'NEW',
  improve: '개선',
  guide: '사용법',
};
