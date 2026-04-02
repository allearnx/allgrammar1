'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useScrolled } from './use-scrolled';
import { DesktopNav } from './desktop-nav';
import { MobileMenu } from './mobile-menu';

const menuItems = [
  {
    label: '올라운더영어 소개',
    href: '#',
    hasDropdown: true,
    dropdownItems: [
      { label: '올라영 소개', href: '/about' },
      { label: '커리큘럼', href: '/curriculum' },
    ]
  },
  { label: '시간표', href: '/schedule', hasDropdown: false },
  { label: '선생님 소개', href: '/teachers', hasDropdown: false },
  {
    label: '전체 강의',
    href: '#',
    hasDropdown: true,
    dropdownItems: [
      { label: '문법', href: '/courses/grammar' },
      { label: '내신', href: '/courses/school_exam' },
      { label: '국제학교/유학생', href: '/courses/international' },
      { label: '올킬보카', href: '/courses/voca' },
      { label: '리딩', href: '/courses/reading' },
    ]
  },
  { label: '레벨테스트', href: 'https://leveltest.allrounderenglish.co.kr/', hasDropdown: false, isExternal: true },
];

interface PublicHeaderProps {
  isLoggedIn?: boolean;
}

export default function PublicHeader({ isLoggedIn = false }: PublicHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isScrolled = useScrolled();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50'
          : 'bg-white/50 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* 로고 */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/logo.png"
              alt="올라영"
              width={360}
              height={120}
              className="h-16 w-auto"
              priority
            />
          </Link>

          <DesktopNav menuItems={menuItems} isLoggedIn={isLoggedIn} />

          {/* 모바일 햄버거 버튼 (lg 미만) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 rounded-lg text-[#1d1d1f] hover:bg-gray-100 transition-all duration-200"
            aria-label="메뉴 열기"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 ${
                isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`} />
              <span className={`block h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 ${
                isMenuOpen ? 'opacity-0' : ''
              }`} />
              <span className={`block h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 ${
                isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`} />
            </div>
          </button>
        </div>
      </div>

      <MobileMenu
        menuItems={menuItems}
        isLoggedIn={isLoggedIn}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </header>
  );
}
