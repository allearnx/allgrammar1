export type ClassType = 'grammar' | 'reading' | 'international' | 'hackers' | 'guhaeyoung' | 'voca';

export interface ClassItem {
  name: string;
  subName?: string;
  time: string;
  teacher: string;
  isNew?: boolean;
  tags?: string[];
  type: ClassType;
}

export interface ScheduleCell {
  classes: ClassItem[];
}

export const typeColors: Record<ClassType, string> = {
  grammar: 'border-l-violet-500',
  reading: 'border-l-cyan-500',
  international: 'border-l-slate-500',
  hackers: 'border-l-emerald-500',
  guhaeyoung: 'border-l-amber-500',
  voca: 'border-l-rose-500',
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

export const dayBgColors: Record<string, string> = {
  '월': 'bg-rose-50/50', '화': 'bg-amber-50/50', '수': 'bg-emerald-50/50',
  '목': 'bg-sky-50/50', '토': 'bg-violet-50/50', '일': 'bg-orange-50/50',
};

export const scheduleData: Record<string, Record<string, ScheduleCell>> = {
  'am-9': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [
      { name: '천일문', subName: '기본', time: '8:40-9:50', teacher: '유혜령 T', type: 'hackers' },
      { name: '리딩 4.0 해외반', time: '9:00-10:20', teacher: '안홍미 T', isNew: true, tags: ['국제학교', '리딩'], type: 'reading' },
      { name: '구해영', subName: '중학영문법 Level 1', time: '9:00-10:20', teacher: '이다은 T', isNew: true, type: 'guhaeyoung' },
    ]},
    '일': { classes: [] },
  },
  'am-10': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [
      { name: '중학 영문법', subName: '3800제 2학년', time: '10:00-11:20', teacher: '유혜령 T', isNew: true, type: 'grammar' },
    ]},
    '일': { classes: [] },
  },
  'am-11': {
    '월': { classes: [] }, '화': { classes: [] }, '수': { classes: [] }, '목': { classes: [] },
    '토': { classes: [] }, '일': { classes: [] },
  },
  'pm-6': {
    '월': { classes: [] },
    '화': { classes: [
      { name: '리딩', time: '5:30-6:50', teacher: '안홍미 T', isNew: true, tags: ['리딩'], type: 'reading' },
    ]},
    '수': { classes: [
      { name: '구해영', subName: '중학영문법 Level 0', time: '6:30-7:50', teacher: '', isNew: true, type: 'guhaeyoung' },
    ]},
    '목': { classes: [] }, '토': { classes: [] }, '일': { classes: [] },
  },
  'pm-7': {
    '월': { classes: [
      { name: '해커스', subName: '중학영문법 2학년', time: '7:00-8:20', teacher: '안홍미 T', isNew: true, type: 'hackers' },
    ]},
    '화': { classes: [] },
    '수': { classes: [
      { name: '중학 영문법', subName: '3800제 3학년', time: '7:00-8:00', teacher: '안홍미 T', isNew: true, type: 'grammar' },
    ]},
    '목': { classes: [
      { name: '리딩 4.0 국내 A반', time: '7:00-8:20', teacher: '안홍미 T', isNew: true, tags: ['리딩'], type: 'reading' },
    ]},
    '토': { classes: [] },
    '일': { classes: [
      { name: '구해영', subName: '독해 Level 3', time: '7:00-8:20', teacher: '황지환 T', isNew: true, type: 'reading' },
    ]},
  },
  'pm-8': {
    '월': { classes: [
      { name: 'Grammar Zone', subName: '고등 기본', time: '8:30-9:50', teacher: '안홍미 T', isNew: true, type: 'hackers' },
    ]},
    '화': { classes: [] },
    '수': { classes: [
      { name: 'G6 Writing', time: '8:30-9:40', teacher: 'Samuel T', isNew: true, tags: ['국제학교'], type: 'international' },
    ]},
    '목': { classes: [] }, '토': { classes: [] },
    '일': { classes: [
      { name: '고2 모의고사', subName: '기출', time: '8:30-9:50', teacher: '황지환 T', isNew: true, type: 'reading' },
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
  { color: 'bg-violet-500', label: '3800제' },
  { color: 'bg-emerald-500', label: '해커스 / Grammar Zone' },
  { color: 'bg-amber-500', label: '구해영' },
  { color: 'bg-cyan-500', label: '리딩' },
  { color: 'bg-rose-500', label: '단어' },
  { color: 'bg-slate-500', label: '국제학교' },
];
