export type ClassType = 'grammar' | 'reading' | 'international' | 'hackers' | 'guhaeyoung' | 'voca';

export interface ClassItem {
  name: string;
  subName?: string;
  time: string;
  teacher: string;
  isNew?: boolean;
  isClosed?: boolean;
  tags?: string[];
  type: ClassType;
}

export interface ScheduleCell {
  classes: ClassItem[];
}

// 구글 팔레트 (올킬보카 랜딩 문법): 문법=파랑, 리딩=초록, 국제=빨강, 단어=노랑
export const typeColors: Record<ClassType, string> = {
  grammar: 'border-l-[#1A73E8]',
  reading: 'border-l-[#188038]',
  international: 'border-l-[#D93025]',
  hackers: 'border-l-[#1A73E8]',
  guhaeyoung: 'border-l-[#1A73E8]',
  voca: 'border-l-[#F9AB00]',
};

export const typeLabelColors: Record<ClassType, string> = {
  grammar: 'text-[#174EA6]',
  reading: 'text-[#0D652D]',
  international: 'text-[#A50E0E]',
  hackers: 'text-[#174EA6]',
  guhaeyoung: 'text-[#174EA6]',
  voca: 'text-[#B06000]',
};

export const typeLabels: Record<ClassType, string> = {
  grammar: '문법',
  reading: '리딩',
  international: '국제',
  hackers: '문법',
  guhaeyoung: '문법',
  voca: '단어',
};

export const days = ['월', '화', '수', '목', '토', '일'];
export const amHours = ['9', '10', '11'];
export const pmHours = ['6', '7', '8', '9'];

// 요일 배경 — 구글 4색 라이트 틴트 순환
export const dayBgColors: Record<string, string> = {
  '월': 'bg-[#E8F0FE]/40', '화': 'bg-[#FCE8E6]/40', '수': 'bg-[#FEF7E0]/50',
  '목': 'bg-[#E6F4EA]/40', '토': 'bg-[#DFEFFF]/40', '일': 'bg-[#F8F9FA]',
};

export const scheduleData: Record<string, Record<string, ScheduleCell>> = {
  'am-9': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [
      { name: '해커스', subName: '중학영문법 2학년', time: '8:40-9:50', teacher: '유혜령 T', type: 'hackers' },
      { name: '구해영', subName: '중학영문법 Level 2', time: '9:00-10:20', teacher: '민경은 T', type: 'guhaeyoung' },
      { name: '유학생 북클럽', subName: 'G8-G9 문학', time: '9:00-10:10', teacher: 'Hyunwoo T', isNew: true, type: 'international' },
    ]},
    '일': { classes: [] },
  },
  'am-10': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [
      { name: '초등 영문법', subName: '3800제 4권', time: '10:00-11:20', teacher: '유혜령 T', type: 'grammar' },
    ]},
    '일': { classes: [] },
  },
  'am-11': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [] }, '일': { classes: [] },
  },
  'pm-6': {
    '월': { classes: [] },
    '화': { classes: [] },
    '수': { classes: [
      { name: '중학 3800제', subName: '중1', time: '6:30-7:50', teacher: '민경은 T', isNew: true, type: 'grammar' },
    ]},
    '목': { classes: [] }, '토': { classes: [] }, '일': { classes: [] },
  },
  'pm-7': {
    '월': { classes: [
      { name: '중3 3800제', subName: '중학영문법 3학년', time: '7:00-8:20', teacher: '안홍미 T', isNew: true, type: 'grammar' },
    ]},
    '화': { classes: [
      { name: '리딩 4.0 반', subName: '로알드 달 원서', time: '7:30-8:50', teacher: '민경은 T', isNew: true, type: 'reading' },
    ]},
    '수': { classes: [
      { name: '중학 영문법', subName: '3800제 3학년', time: '7:00-8:20', teacher: '안홍미 T', type: 'grammar' },
    ]},
    '목': { classes: [
      { name: '리딩 5.0 국내반', time: '7:00-8:20', teacher: '안홍미 T', tags: ['리딩'], type: 'reading' },
    ]},
    '토': { classes: [] },
    '일': { classes: [
      { name: '고1 올림푸스 기출', time: '7:00-8:20', teacher: '황지환 T', type: 'reading' },
    ]},
  },
  'pm-8': {
    '월': { classes: [
      { name: '어법끝', subName: 'Start 실력다지기', time: '8:30-9:50', teacher: '안홍미 T', isClosed: true, type: 'grammar' },
    ]},
    '화': { classes: [] },
    '수': { classes: [] },
    '목': { classes: [
      { name: 'Read & Write', subName: '국제반', time: '8:30-9:40', teacher: 'Hyunwoo T', isNew: true, type: 'international' },
    ]}, '토': { classes: [] },
    '일': { classes: [
      { name: '2027 수능특강', subName: '영어', time: '8:30-9:50', teacher: '황지환 T', type: 'reading' },
    ]},
  },
  'pm-9': {
    '월': { classes: [{ name: '올킬보카', time: '9:00-10:00', teacher: '', type: 'voca' }] },
    '화': { classes: [] },
    '수': { classes: [{ name: '올킬보카', time: '9:00-10:00', teacher: '', type: 'voca' }] },
    '목': { classes: [{ name: '올킬보카', time: '9:00-10:00', teacher: '', type: 'voca' }] },
    '토': { classes: [] },
    '일': { classes: [{ name: '올킬보카', time: '9:00-10:00', teacher: '', type: 'voca' }] },
  },
};

export const legendItems = [
  { color: 'bg-[#1A73E8]', label: '문법' },
  { color: 'bg-[#188038]', label: '리딩' },
  { color: 'bg-[#D93025]', label: '국제학교' },
  { color: 'bg-[#F9AB00]', label: '단어' },
];
