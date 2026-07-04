import {
  UserPlus,
  BookMarked,
  ToggleRight,
  GraduationCap,
  BarChart3,
  Settings,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface GuideStep {
  title: string;
  description: string;
}

export interface GuideEntry {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  steps: GuideStep[];
  completedTitle: string;
  href: string;
}

export const GUIDE_ENTRIES: Record<string, GuideEntry> = {
  students: {
    slug: 'students',
    title: '학생 등록',
    description: '초대코드를 공유하거나 직접 등록하여 학생을 추가하세요',
    icon: UserPlus,
    color: '#4285F4',
    steps: [
      {
        title: '초대코드 공유',
        description: '대시보드의 초대코드를 학생에게 전달하세요. 학생이 회원가입 시 입력하면 자동으로 학원에 연결됩니다.',
      },
      {
        title: '직접 등록',
        description: '"학생 추가" 버튼을 눌러 이름과 이메일을 입력하면 임시 비밀번호가 생성됩니다.',
      },
      {
        title: '임시 비밀번호 전달',
        description: '생성된 임시 비밀번호를 학생에게 전달하세요. 첫 로그인 후 변경할 수 있습니다.',
      },
    ],
    completedTitle: '등록된 학생 목록',
    href: '/admin/students',
  },
  textbook: {
    slug: 'textbook',
    title: '교과서 배정',
    description: '학생별로 학교에서 사용하는 교과서를 배정하세요',
    icon: BookMarked,
    color: '#3B82F6',
    steps: [
      {
        title: '학생 "상세" 클릭',
        description: '학생 목록에서 배정할 학생의 "상세" 버튼을 클릭하세요.',
      },
      {
        title: '교과서 선택',
        description: '교과서 드롭다운에서 학생의 학교 교과서를 선택하세요.',
      },
      {
        title: '"배정" 클릭',
        description: '배정 버튼을 누르면 완료됩니다. 교과서는 한 번 배정 후 변경이 불가하며, 변경이 필요하면 카카오톡으로 문의해 주세요.',
      },
    ],
    completedTitle: '교과서 배정 완료',
    href: '/admin/students',
  },
  services: {
    slug: 'services',
    title: '서비스 배정',
    description: '학생에게 올인내신, 올킬보카 서비스를 활성화하세요',
    icon: ToggleRight,
    color: '#10B981',
    steps: [
      {
        title: '학생 카드에서 서비스 토글',
        description: '학생 목록에서 각 학생 카드의 서비스 토글 버튼을 찾으세요.',
      },
      {
        title: '올인내신 / 올킬보카 활성화',
        description: '원하는 서비스를 켜세요. 무료 플랜은 1개, Pro 플랜은 모든 서비스를 사용할 수 있습니다.',
      },
    ],
    completedTitle: '서비스 활성화 완료',
    href: '/admin/students',
  },
  teachers: {
    slug: 'teachers',
    title: '선생님 등록',
    description: '초대코드로 선생님 계정을 생성하세요',
    icon: GraduationCap,
    color: '#F59E0B',
    steps: [
      {
        title: '초대코드 공유',
        description: '학생과 동일한 초대코드를 선생님에게 전달하세요.',
      },
      {
        title: '회원가입 시 "선생님" 선택',
        description: '선생님이 가입할 때 역할을 "선생님"으로 선택하면 자동으로 학원에 연결됩니다.',
      },
    ],
    completedTitle: '등록된 선생님 목록',
    href: '/admin/teachers',
  },
  analytics: {
    slug: 'analytics',
    title: '학습 현황 확인',
    description: '학생 진도 및 성적을 분석하세요',
    icon: BarChart3,
    color: '#4285F4',
    steps: [
      {
        title: '대시보드 → 학원 통계 클릭',
        description: '대시보드 또는 사이드바에서 "학원 통계" 메뉴를 클릭하세요.',
      },
      {
        title: '학생별 진도 확인',
        description: '학생별 학습 진행률, 정답률, 취약 영역을 한눈에 파악할 수 있습니다.',
      },
    ],
    completedTitle: '학습 통계 대시보드',
    href: '/admin/analytics',
  },
  settings: {
    slug: 'settings',
    title: '학원 설정',
    description: '학원 정보 및 연락처를 관리하세요',
    icon: Settings,
    color: '#64748B',
    steps: [
      {
        title: '학원명 / 연락처 입력',
        description: '학원 이름, 대표 연락처, 주소 등 기본 정보를 입력하세요.',
      },
      {
        title: '"저장" 클릭',
        description: '정보를 입력한 뒤 저장 버튼을 누르면 반영됩니다.',
      },
    ],
    completedTitle: '설정 완료 화면',
    href: '/admin/settings',
  },
  billing: {
    slug: 'billing',
    title: '요금제 관리',
    description: '현재 플랜을 확인하고 업그레이드하세요',
    icon: CreditCard,
    color: '#EC4899',
    steps: [
      {
        title: '현재 플랜 확인',
        description: '결제 관리 페이지에서 현재 구독 중인 요금제와 남은 인원을 확인하세요.',
      },
      {
        title: '요금제 보기 → 결제',
        description: '더 큰 플랜이 필요하면 "요금제 보기"에서 원하는 플랜을 선택하고 결제하세요.',
      },
    ],
    completedTitle: '구독 현황',
    href: '/admin/billing',
  },
};

export const VALID_SLUGS = Object.keys(GUIDE_ENTRIES);
