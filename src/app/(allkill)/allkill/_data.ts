// 올킬보카 랜딩 — 구글 팔레트 기반 톤 (앱 내부 brand-* 스케일과 동일 계열)
export const C = {
  ink: '#1F1F1F',
  gray: '#5F6368',
  grayLight: '#9AA0A6',
  line: '#E8EAED',
  sky: '#EAF2FE',       // 파스텔 배경
  blue: '#1A73E8',      // 포인트 (롤링 워드, 강조)
  blueDark: '#174EA6',
  blueLight: '#E8F0FE',
  yellow: '#FDD663',    // 큰 버튼
  green: '#188038',
  greenLight: '#E6F4EA',
  red: '#D93025',
  redLight: '#FCE8E6',
};

// 히어로 롤링 워드 — "OO 단어, 이제 올킬"
export const rollingWords = ['중간고사', '기말고사', '모의고사', '수능'];

// 7단계 (랜딩에서 딱 한 번 보여주는 곳)
export const flowSteps1 = [
  { n: 1, name: '플래시카드', pass: '자유 학습', desc: '단어·뜻·예문을 카드로 넘기며 눈에 익혀요.' },
  { n: 2, name: '퀴즈', pass: '80점 통과', desc: '4지선다로 뜻을 확인해요. 80점을 넘어야 다음으로.' },
  { n: 3, name: '스펠링', pass: '80점 통과', desc: '뜻을 보고 단어를 직접 입력해요.' },
  { n: 4, name: '매칭', pass: '90점 통과', desc: '단어와 뜻을 연결하면 1회독 완료!' },
];

export const flowSteps2 = [
  { n: 5, name: '플래시카드 심화', pass: '유의어·반의어·숙어', desc: '단어의 쓰임새를 폭넓게 확장해요.' },
  { n: 6, name: '종합문제', pass: '9가지 유형', desc: '영작 답안은 AI가 직접 채점해요.' },
  { n: 7, name: '심화 매칭', pass: '2회독 완료', desc: '여기까지 오면 진짜 내 단어!' },
];

// 차별점 3가지
export const features = [
  {
    key: 'exam',
    tag: '기출 문장',
    title: '이 단어, 진짜 시험에\n이렇게 나왔어요',
    body: '만들어낸 예문이 아니라 실제 모의고사·수능 지문 속 문장으로 외워요. 어느 시험에 나왔는지 출처도 함께 보여줘요.',
  },
  {
    key: 'wrong',
    tag: '올킬오답',
    title: '틀린 단어는 3번 연속\n맞힐 때까지',
    body: '최근 3주 동안 틀린 단어를 자동으로 모아요. 3번 연속 정답이어야 졸업 — 어쩌다 한 번 맞힌 건 인정 안 해요.',
  },
  {
    key: 'report',
    tag: '학부모 리포트',
    title: '"공부했어요"가 아니라\n데이터로 확인해요',
    body: '단계별 점수, 틀린 단어, 통과 현황을 링크 하나로 공유해요. 앱 설치 없이 바로 열려요.',
  },
];

// 리포트 미리보기 (학부모 섹션 + 리포트 카드 공용)
export const reportRows = [
  { label: '플래시카드', pct: '100%', done: true },
  { label: '퀴즈', pct: '88%', done: true },
  { label: '스펠링', pct: '76%', done: true },
  { label: '매칭', pct: '40%', done: false },
];

// 수록 범위 칩 (교재 마퀴 위)
export const coverageChips = ['중1·2·3 전 교과서', '고1·2·3 모의고사 5개년', '수능 기출 5개년', '고등 교과서'];

// 가격
export const freePlanFeatures = ['교재당 Day 3개 체험', '7단계 학습 전부 체험', '카드 등록 없음'];

export const selfStudyPlanFeatures = ['모든 교재 무제한', '1회독 + 2회독 전체 포함', '오답 관리 & 틀린 단어 복습', 'AI 서술형 채점'];

export const proPlanFeatures = ['셀프 스터디 기능 전부 포함', '선생님과 주 2회 온라인 시험', '개별 진도 관리 (90점 통과)', '학부모 리포트 공유'];

export const academyFeatures = ['학생 수 맞춤 가격', '선생님용 관리 대시보드', '일괄 리포트 관리', '전담 고객 지원'];
