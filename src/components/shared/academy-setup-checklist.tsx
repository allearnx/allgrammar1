'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Map,
  ChevronDown,
  ArrowRight,
  UserPlus,
  BookMarked,
  ToggleRight,
  GraduationCap,
  BarChart3,
  Settings,
  CreditCard,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

const STORAGE_KEY = 'allgrammar:setup-checklist-expanded';

interface ChecklistItem {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

interface ChecklistGroup {
  label: string;
  items: ChecklistItem[];
}

const GROUPS: ChecklistGroup[] = [
  {
    label: '시작하기',
    items: [
      { icon: UserPlus, title: '학생 등록', description: '초대코드 공유 또는 직접 등록', href: '/admin/guide/students' },
      { icon: BookMarked, title: '교과서 배정', description: '학생별 교과서를 선택해 주세요', href: '/admin/guide/textbook' },
      { icon: ToggleRight, title: '서비스 배정', description: '올인내신 / 올킬보카 활성화', href: '/admin/guide/services' },
      { icon: GraduationCap, title: '선생님 등록', description: '초대코드로 선생님 계정 생성', href: '/admin/guide/teachers' },
    ],
  },
  {
    label: '학원 운영',
    items: [
      { icon: BarChart3, title: '학습 현황 확인', description: '학생 진도 및 성적 분석', href: '/admin/guide/analytics' },
      { icon: Settings, title: '학원 설정', description: '학원 정보 및 연락처 관리', href: '/admin/guide/settings' },
      { icon: CreditCard, title: '요금제 관리', description: '플랜 확인 및 업그레이드', href: '/admin/billing' },
    ],
  },
  {
    label: '도움말',
    items: [
      { icon: BookOpen, title: '사용 가이드', description: '자주 묻는 질문과 사용법', href: '/admin/guide' },
    ],
  },
];

export function AcademySetupChecklist() {
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setExpanded(stored === 'true');
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  let counter = 0;

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ background: '#E8F0FE' }}
      >
        <div className="flex items-center gap-2.5">
          <Map className="h-5 w-5 text-brand-600" />
          <span className="font-semibold text-brand-900">학원 셋업 가이드</span>
        </div>
        <ChevronDown
          className="h-5 w-5 text-brand-500 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </button>

      {/* Body */}
      {mounted && expanded && (
        <div className="px-2 pb-3">
          {GROUPS.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div className="border-t mx-3" />}
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 pt-3 pb-1">
                {group.label}
              </p>
              {group.items.map((item) => {
                counter++;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-brand-50"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {counter}
                    </span>
                    <Icon className="h-4.5 w-4.5 shrink-0 text-gray-400 group-hover:text-brand-600 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-tight">{item.title}</p>
                      <p className="text-xs text-gray-400 leading-tight">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-brand-500 transition-colors" />
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
