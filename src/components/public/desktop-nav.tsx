import { useState } from 'react';
import Link from 'next/link';

interface MenuItem {
  label: string;
  href: string;
  hasDropdown: boolean;
  isExternal?: boolean;
  dropdownItems?: { label: string; href: string; isExternal?: boolean }[];
}

interface DesktopNavProps {
  menuItems: MenuItem[];
  isLoggedIn: boolean;
}

export function DesktopNav({ menuItems, isLoggedIn }: DesktopNavProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {menuItems.map((item) => (
        <div
          key={item.label}
          className="relative"
          onMouseEnter={() => item.hasDropdown && setOpenDropdown(item.label)}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          {item.hasDropdown ? (
            <button
              className="px-2.5 py-2 text-[15px] font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors duration-200 flex items-center gap-1"
            >
              {item.label}
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : item.isExternal ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 text-[15px] font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors duration-200 flex items-center gap-1"
            >
              {item.label}
            </a>
          ) : (
            <Link
              href={item.href}
              className="px-2.5 py-2 text-[15px] font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors duration-200 flex items-center gap-1"
            >
              {item.label}
            </Link>
          )}

          {item.hasDropdown && item.dropdownItems && (
            <div
              className={`absolute top-full left-0 mt-1 py-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100 min-w-[160px] transition-all duration-200 ${
                openDropdown === item.label
                  ? 'opacity-100 visible translate-y-0'
                  : 'opacity-0 invisible -translate-y-2'
              }`}
            >
              {item.dropdownItems.map((dropItem) => (
                dropItem.isExternal ? (
                  <a
                    key={dropItem.label}
                    href={dropItem.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2.5 text-base font-medium text-[#1d1d1f] hover:text-[#0071e3] hover:bg-gray-50 transition-colors text-center"
                  >
                    {dropItem.label}
                    <svg className="inline-block w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <Link
                    key={dropItem.label}
                    href={dropItem.href}
                    className="block px-4 py-2.5 text-base font-medium text-[#1d1d1f] hover:text-[#0071e3] hover:bg-gray-50 transition-colors text-center"
                  >
                    {dropItem.label}
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      ))}
      {/* 올인내신 강조 버튼 */}
      <Link
        href="/courses/school_exam"
        className="ml-2 relative px-5 py-2.5 text-[15px] font-bold text-white rounded-full transition-all duration-200 shadow-lg hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)', boxShadow: '0 4px 20px rgba(59,130,246,0.4)' }}
      >
        <span className="absolute -top-2 -right-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">NEW</span>
        ✦ 올인내신
      </Link>
      {/* 올킬보카 강조 버튼 */}
      <Link
        href="/allkill"
        className="relative px-5 py-2.5 text-[15px] font-bold text-white rounded-full transition-all duration-200 shadow-lg hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #4DD9C0 100%)', boxShadow: '0 4px 20px rgba(167,139,250,0.4)' }}
      >
        <span className="absolute -top-2 -right-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">NEW</span>
        ✦ 올킬보카
      </Link>
      {/* 내 대시보드 / 로그인 */}
      {isLoggedIn ? (
        <Link
          href="/student"
          className="ml-2 px-5 py-2.5 text-[15px] font-medium text-white bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 rounded-full transition-all duration-200 shadow-lg shadow-violet-300/30"
        >
          내 대시보드
        </Link>
      ) : (
        <Link
          href="/login"
          className="ml-2 px-5 py-2.5 text-[15px] font-medium text-[#A78BFA] border-2 border-[#A78BFA] hover:bg-[#A78BFA] hover:text-white rounded-full transition-all duration-200"
        >
          로그인
        </Link>
      )}
    </nav>
  );
}
