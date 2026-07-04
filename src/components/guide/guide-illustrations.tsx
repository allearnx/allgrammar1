'use client';

import { Check, Copy, Plus, ChevronDown, User, BookOpen, ToggleRight, Search, Save, CreditCard, BarChart3 } from 'lucide-react';

/* ─────────── shared ─────────── */
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>
);

const Pill = ({ children, active = false }: { children: React.ReactNode; active?: boolean }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
    {active && <Check className="h-2.5 w-2.5" />}
    {children}
  </span>
);

const StudentRow = ({ name, sub, tag }: { name: string; sub?: string; tag?: React.ReactNode }) => (
  <div className="flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 last:border-0">
    <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center">
      <User className="h-3.5 w-3.5 text-brand-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-700 truncate">{name}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
    {tag}
  </div>
);

/* ─────────── students ─────────── */
export function StudentsStepIllustration({ step }: { step: number }) {
  if (step === 0) {
    return (
      <Card>
        <div className="p-3 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400">초대코드</p>
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
            <span className="text-sm font-mono font-bold text-brand-700 tracking-wider">ABC-1234</span>
            <button className="ml-auto p-1 rounded hover:bg-brand-100">
              <Copy className="h-3.5 w-3.5 text-brand-500" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400">이 코드를 학생에게 공유하세요</p>
        </div>
      </Card>
    );
  }
  if (step === 1) {
    return (
      <Card>
        <div className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-brand-600" />
            <p className="text-xs font-semibold text-gray-700">학생 추가</p>
          </div>
          <div className="space-y-1.5">
            <div className="rounded-lg border border-gray-200 px-2.5 py-1.5">
              <p className="text-[10px] text-gray-400">이름</p>
              <p className="text-xs text-gray-700">김학생</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-2.5 py-1.5">
              <p className="text-[10px] text-gray-400">이메일</p>
              <p className="text-xs text-gray-700">student@email.com</p>
            </div>
          </div>
          <div className="rounded-lg bg-brand-600 text-white text-center py-1.5 text-xs font-medium">등록</div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-green-500" />
          <p className="text-xs font-semibold text-green-700">등록 완료</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-[10px] text-gray-500">임시 비밀번호</p>
          <p className="text-sm font-mono font-bold text-amber-700">Tmp@5829</p>
        </div>
        <p className="text-[10px] text-gray-400">학생에게 전달해 주세요</p>
      </div>
    </Card>
  );
}

export function StudentsCompletedIllustration() {
  return (
    <Card>
      <div className="py-1">
        <StudentRow name="김학생" sub="student@email.com" tag={<Pill active>등록됨</Pill>} />
        <StudentRow name="이학생" sub="lee@email.com" tag={<Pill active>등록됨</Pill>} />
        <StudentRow name="박학생" sub="park@email.com" tag={<Pill active>등록됨</Pill>} />
      </div>
    </Card>
  );
}

/* ─────────── textbook ─────────── */
export function TextbookStepIllustration({ step }: { step: number }) {
  if (step === 0) {
    return (
      <Card>
        <div className="py-1">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-blue-50">
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700">김학생</p>
            </div>
            <span className="text-[10px] font-medium text-blue-600 border border-blue-200 rounded px-2 py-0.5">상세 →</span>
          </div>
          <StudentRow name="이학생" />
          <StudentRow name="박학생" />
        </div>
      </Card>
    );
  }
  if (step === 1) {
    return (
      <Card>
        <div className="p-3 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400">교과서 선택</p>
          <div className="flex items-center justify-between rounded-lg border border-blue-300 bg-blue-50 px-3 py-2">
            <span className="text-xs text-blue-700">능률 중2</span>
            <ChevronDown className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400">동아 중2</div>
          <div className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400">천재 중2</div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-green-500" />
          <p className="text-xs font-semibold text-green-700">배정 완료</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">능률 중2</span>
        </div>
      </div>
    </Card>
  );
}

export function TextbookCompletedIllustration() {
  return (
    <Card>
      <div className="py-1">
        <StudentRow name="김학생" tag={<Pill active>능률 중2</Pill>} />
        <StudentRow name="이학생" tag={<Pill active>동아 중2</Pill>} />
        <StudentRow name="박학생" tag={<Pill>미배정</Pill>} />
      </div>
    </Card>
  );
}

/* ─────────── services ─────────── */
export function ServicesStepIllustration({ step }: { step: number }) {
  if (step === 0) {
    return (
      <Card>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <p className="text-xs font-medium text-gray-700">김학생</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <span className="text-xs text-gray-600">올인내신</span>
              <div className="h-5 w-9 rounded-full bg-gray-200 relative">
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <span className="text-xs text-gray-600">올킬보카</span>
              <div className="h-5 w-9 rounded-full bg-gray-200 relative">
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-green-500" />
          <p className="text-xs font-medium text-gray-700">김학생</p>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <span className="text-xs text-green-700">올인내신</span>
            <div className="h-5 w-9 rounded-full bg-green-500 relative">
              <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <span className="text-xs text-green-700">올킬보카</span>
            <div className="h-5 w-9 rounded-full bg-green-500 relative">
              <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ServicesCompletedIllustration() {
  return (
    <Card>
      <div className="py-1">
        <StudentRow name="김학생" tag={<><Pill active>내신</Pill>{' '}<Pill active>보카</Pill></>} />
        <StudentRow name="이학생" tag={<Pill active>내신</Pill>} />
        <StudentRow name="박학생" tag={<><Pill active>내신</Pill>{' '}<Pill active>보카</Pill></>} />
      </div>
    </Card>
  );
}

/* ─────────── teachers ─────────── */
export function TeachersStepIllustration({ step }: { step: number }) {
  if (step === 0) {
    return (
      <Card>
        <div className="p-3 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400">초대코드</p>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
            <span className="text-sm font-mono font-bold text-amber-700 tracking-wider">ABC-1234</span>
            <button className="ml-auto p-1 rounded hover:bg-amber-100">
              <Copy className="h-3.5 w-3.5 text-amber-500" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400">선생님에게 이 코드를 전달하세요</p>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="p-3 space-y-2">
        <p className="text-[10px] font-semibold text-gray-400">회원가입 시</p>
        <div className="space-y-1.5">
          <div className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400">학생</div>
          <div className="rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 flex items-center gap-1.5">
            <Check className="h-3 w-3" />
            선생님
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400">학원 원장</div>
        </div>
      </div>
    </Card>
  );
}

export function TeachersCompletedIllustration() {
  return (
    <Card>
      <div className="py-1">
        <StudentRow name="박선생님" sub="선생님" tag={<Pill active>활성</Pill>} />
        <StudentRow name="김선생님" sub="선생님" tag={<Pill active>활성</Pill>} />
      </div>
    </Card>
  );
}

/* ─────────── analytics ─────────── */
export function AnalyticsStepIllustration({ step }: { step: number }) {
  if (step === 0) {
    return (
      <Card>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
            <BarChart3 className="h-3.5 w-3.5 text-brand-600" />
            <span className="text-xs font-medium text-brand-700">학원 통계</span>
            <span className="ml-auto text-[10px] text-brand-400">클릭 →</span>
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400">학생 관리</div>
          <div className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400">결제 관리</div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="p-3 space-y-2">
        <p className="text-[10px] font-semibold text-gray-400">학생별 현황</p>
        <div className="flex items-center gap-2">
          <Search className="h-3 w-3 text-gray-400" />
          <span className="text-[10px] text-gray-400">학생 검색...</span>
        </div>
        <div className="space-y-1">
          {['김학생 — 82%', '이학생 — 91%', '박학생 — 67%'].map((t) => (
            <div key={t} className="flex items-center gap-2 text-[10px]">
              <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand-400" style={{ width: t.split('— ')[1] }} />
              </div>
              <span className="text-gray-500 w-20 text-right">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function AnalyticsCompletedIllustration() {
  return (
    <Card>
      <div className="p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-brand-50 p-2 text-center">
            <p className="text-lg font-bold text-brand-700">24</p>
            <p className="text-[10px] text-brand-500">전체 학생</p>
          </div>
          <div className="rounded-lg bg-green-50 p-2 text-center">
            <p className="text-lg font-bold text-green-700">78%</p>
            <p className="text-[10px] text-green-500">평균 정답률</p>
          </div>
        </div>
        <div className="flex items-end gap-1 h-10 px-1">
          {[40, 65, 55, 80, 70, 90, 85].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-brand-300" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ─────────── settings ─────────── */
export function SettingsStepIllustration({ step }: { step: number }) {
  if (step === 0) {
    return (
      <Card>
        <div className="p-3 space-y-2">
          <div className="space-y-1.5">
            <div className="rounded-lg border border-gray-200 px-2.5 py-1.5">
              <p className="text-[10px] text-gray-400">학원명</p>
              <p className="text-xs text-gray-700">올라영 어학원</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-2.5 py-1.5">
              <p className="text-[10px] text-gray-400">연락처</p>
              <p className="text-xs text-gray-700">010-1234-5678</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="p-3 space-y-2">
        <div className="rounded-lg bg-gray-600 text-white text-center py-1.5 text-xs font-medium flex items-center justify-center gap-1.5">
          <Save className="h-3 w-3" />
          저장
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <Check className="h-3.5 w-3.5 text-green-500" />
          <span className="text-[10px] text-green-600">저장되었습니다</span>
        </div>
      </div>
    </Card>
  );
}

export function SettingsCompletedIllustration() {
  return (
    <Card>
      <div className="p-3 space-y-1.5">
        {[
          { label: '학원명', value: '올라영 어학원' },
          { label: '연락처', value: '010-1234-5678' },
          { label: '주소', value: '서울시 강남구' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5">
            <span className="text-[10px] text-gray-400">{item.label}</span>
            <span className="text-xs font-medium text-gray-700">{item.value}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 justify-center pt-1">
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-[10px] text-green-600">설정 완료</span>
        </div>
      </div>
    </Card>
  );
}

/* ─────────── billing ─────────── */
export function BillingStepIllustration({ step }: { step: number }) {
  if (step === 0) {
    return (
      <Card>
        <div className="p-3 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400">현재 플랜</p>
          <div className="rounded-lg border-2 border-pink-200 bg-pink-50 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-700">무료 플랜</span>
              <span className="text-[10px] text-pink-500">5명 / 5명</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-pink-200 overflow-hidden">
              <div className="h-full w-full rounded-full bg-pink-500" />
            </div>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="p-3 space-y-2">
        <div className="rounded-lg border border-pink-200 bg-pink-50 p-2 text-center">
          <p className="text-xs font-bold text-pink-700">Pro 40</p>
          <p className="text-[10px] text-pink-500">월 84,000원</p>
        </div>
        <div className="rounded-lg bg-pink-500 text-white text-center py-1.5 text-xs font-medium flex items-center justify-center gap-1.5">
          <CreditCard className="h-3 w-3" />
          결제하기
        </div>
      </div>
    </Card>
  );
}

export function BillingCompletedIllustration() {
  return (
    <Card>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">Pro 40</span>
          <Pill active>구독 중</Pill>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-pink-400" style={{ width: '30%' }} />
        </div>
        <p className="text-[10px] text-gray-400">12명 / 40명 사용 중</p>
        <div className="border-t border-gray-100 pt-2 mt-1">
          <p className="text-[10px] font-semibold text-gray-400">최근 결제</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-gray-500">2026.04.01</span>
            <span className="text-xs font-medium text-gray-700">84,000원</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─────────── Mapper ─────────── */

type IllustrationMap = {
  StepIllustration: React.ComponentType<{ step: number }>;
  CompletedIllustration: React.ComponentType;
};

export const ILLUSTRATION_MAP: Record<string, IllustrationMap> = {
  students: { StepIllustration: StudentsStepIllustration, CompletedIllustration: StudentsCompletedIllustration },
  textbook: { StepIllustration: TextbookStepIllustration, CompletedIllustration: TextbookCompletedIllustration },
  services: { StepIllustration: ServicesStepIllustration, CompletedIllustration: ServicesCompletedIllustration },
  teachers: { StepIllustration: TeachersStepIllustration, CompletedIllustration: TeachersCompletedIllustration },
  analytics: { StepIllustration: AnalyticsStepIllustration, CompletedIllustration: AnalyticsCompletedIllustration },
  settings: { StepIllustration: SettingsStepIllustration, CompletedIllustration: SettingsCompletedIllustration },
  billing: { StepIllustration: BillingStepIllustration, CompletedIllustration: BillingCompletedIllustration },
};
