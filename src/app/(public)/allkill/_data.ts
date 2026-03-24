export const C = {
  lavender: '#A78BFA',
  lavenderDark: '#7C3AED',
  lavenderLight: '#F5F3FF',
  mint: '#4DD9C0',
  mintLight: '#D9F7FC',
  mintDark: '#0B7A6A',
  gray50: '#F9F8FF',
  gray400: '#9E97C8',
  gray600: '#5C5490',
  gray800: '#2D2760',
};

export const bentoCard1Steps = [
  { label: '플래시카드', active: false },
  { label: '퀴즈 80%', active: false },
  { label: '스펠링 80%', active: false },
  { label: '매칭 90%', active: true },
];

export const bentoReportRows = [
  { label: '플래시카드', pct: '100%', done: true },
  { label: '퀴즈', pct: '88%', done: true },
  { label: '스펠링', pct: '76%', done: true },
  { label: '매칭', pct: '40%', done: false },
];

export const vocabMiddlePublishers = [
  { name: '천재교육', color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  { name: '비상교육', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
  { name: 'YBM', color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' },
  { name: '동아출판', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  { name: '미래엔', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
  { name: '지학사', color: '#F472B6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.3)' },
];

export const vocabMockYears = [
  { year: '2024', active: true },
  { year: '2023', active: false },
  { year: '2022', active: false },
  { year: '2021', active: false },
  { year: '2020', active: false },
];

export const vocabSatYears = ['2024수능', '2023수능', '2022수능', '2021수능', '2020수능'];

export const flowSteps1 = [
  { n: 1, name: '플래시카드', pass: '자유 학습', passColor: '#0D9E8A', desc: '단어·뜻·예문을 카드로 확인하고 앞뒤로 넘기며 자유롭게 학습하세요.', borderColor: '#4DD9C0', dark: false, bg: 'white' },
  { n: 2, name: '퀴즈', pass: '80점 통과', passColor: '#7C3AED', desc: '4지선다 객관식으로 단어 뜻을 확인합니다. 80점 이상이어야 다음 단계로 넘어가요.', borderColor: '#06B6D4', dark: false, bg: 'white' },
  { n: 3, name: '스펠링', pass: '80점 통과', passColor: '#7C3AED', desc: '뜻을 보고 영어 단어를 직접 입력합니다. 80점 이상이어야 다음 단계로 넘어가요.', borderColor: '#0891B2', dark: false, bg: 'white' },
  { n: 4, name: '매칭', pass: '90점 통과', passColor: '#1E3A5F', desc: '단어와 뜻을 연결하는 최종 단계. 90점 이상이어야 1회독 완료!', borderColor: '#3B82F6', dark: true, bg: '#1E3A5F' },
];

export const flowSteps2 = [
  { n: 5, name: '플래시카드 심화', pass: '유의어·반의어·숙어', passColor: '#7C3AED', desc: '유의어, 반의어, 숙어까지 확장 학습합니다. 단어의 쓰임새를 폭넓게 익히세요.', borderColor: '#A78BFA', dark: false, bg: 'white' },
  { n: 6, name: '종합문제', pass: '9가지 유형', passColor: '#7C3AED', desc: '9가지 유형의 종합문제로 단어를 다각도로 확인합니다. AI가 영작 답안을 직접 채점합니다.', borderColor: '#7C3AED', dark: false, bg: 'white' },
  { n: 7, name: '심화 매칭', pass: '2회독 완료', passColor: '#3B0764', desc: '심화 매칭으로 2회독을 마무리합니다. 여기까지 완료하면 진짜 내 단어!', borderColor: '#7C3AED', dark: true, bg: '#3B0764' },
];

export const personaCards = [
  {
    tag: '학부모',
    tagBg: '#F5F3FF',
    tagColor: '#7C3AED',
    title: '우리 아이가\n진짜 외웠는지 알 수 있어요',
    desc: '단순히 "공부했어요"가 아니라,\n어떤 단어를 몇 번 틀렸는지,\n몇 단계를 통과했는지 데이터로 확인하세요.',
    points: ['학습 완료 후 리포트 링크 바로 공유', '틀린 단어 & 오답 횟수 상세 확인', '단계별 통과 현황 한눈에 파악', '별도 앱 설치 없이 링크 하나로 확인'],
  },
  {
    tag: '학생',
    tagBg: '#D9F7FC',
    tagColor: '#0B7A6A',
    title: '게임처럼 하다 보면\n단어가 머릿속에 남아요',
    desc: '7단계를 하나씩 통과하는 과정에서\n성취감이 생깁니다.\n지루한 암기가 아니라 클리어하는 재미로 공부하세요.',
    points: ['단계별 통과 기준으로 성취감 UP', '틀린 단어만 반복 복습 시스템', '수능 기출 단어 DB 완벽 커버', '2회독 AI 서술형 채점으로 완전 정복'],
  },
];

export const statsItems = [
  { num: '7단계', label: '2회독 완전 정복 시스템' },
  { num: 'AI', label: '서술형 영작 자동 채점' },
  { num: '90점', label: '매칭 통과 기준' },
];

export const freePlanIncluded = ['최근 4개년 수능·모의고사 기출', '틀린 단어 복습'];

export const freePlanSteps = [
  { step: '01', name: '플래시카드', note: '자유 학습' },
  { step: '02', name: '퀴즈', note: '80점 통과' },
  { step: '03', name: '스펠링', note: '80점 통과' },
  { step: '04', name: '매칭', note: '90점 통과' },
];

export const freePlanLocked = [
  { icon: '🔒', text: '2회독 심화 학습 (7단계 전체)' },
  { icon: '🔒', text: 'AI 서술형 영작 채점' },
  { icon: '🔒', text: '학부모 학습 리포트 공유' },
];

export const proPlanFeatures = ['수록 단어 전체 무제한 이용', 'AI 서술형 채점', '학부모 리포트 공유', '틀린 단어 복습 시스템'];

export const proRoundSteps = [
  { step: '01', name: '플래시카드', note: '자유 학습', round: 1 },
  { step: '02', name: '퀴즈', note: '80점 통과', round: 1 },
  { step: '03', name: '스펠링', note: '80점 통과', round: 1 },
  { step: '04', name: '매칭', note: '90점 통과', round: 1 },
  { step: '05', name: '플래시카드 심화', note: '유의어·반의어', round: 2 },
  { step: '06', name: '종합문제', note: 'AI 영작 채점', round: 2 },
  { step: '07', name: '심화 매칭', note: '2회독 완료', round: 2 },
];

export const academyFeatures = ['학생 수 맞춤 가격', '선생님용 관리 대시보드', '일괄 리포트 관리', '전담 고객 지원'];
