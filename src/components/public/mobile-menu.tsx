import { useState } from 'react';
import Link from 'next/link';

interface MenuItem {
  label: string;
  href: string;
  hasDropdown: boolean;
  isExternal?: boolean;
  dropdownItems?: { label: string; href: string; isExternal?: boolean }[];
}

interface MobileMenuProps {
  menuItems: MenuItem[];
  isLoggedIn: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ menuItems, isLoggedIn, isOpen, onClose }: MobileMenuProps) {
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);

  return (
    <div
      className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <nav className="px-4 py-3 bg-white/95 backdrop-blur-xl border-t border-gray-100">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.hasDropdown ? (
              <>
                <button
                  onClick={() => setMobileOpenDropdown(mobileOpenDropdown === item.label ? null : item.label)}
                  className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
                >
                  {item.label}
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${mobileOpenDropdown === item.label ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${
                  mobileOpenDropdown === item.label ? 'max-h-60' : 'max-h-0'
                }`}>
                  {item.dropdownItems?.map((dropItem) => (
                    dropItem.isExternal ? (
                      <a
                        key={dropItem.label}
                        href={dropItem.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block pl-8 pr-4 py-2.5 text-sm font-medium text-[#424245] hover:text-[#0071e3] transition-colors"
                        onClick={onClose}
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
                        className="block pl-8 pr-4 py-2.5 text-sm font-medium text-[#424245] hover:text-[#0071e3] transition-colors"
                        onClick={onClose}
                      >
                        {dropItem.label}
                      </Link>
                    )
                  ))}
                </div>
              </>
            ) : item.isExternal ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-base font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
                onClick={onClose}
              >
                {item.label}
              </a>
            ) : (
              <Link
                href={item.href}
                className="block px-4 py-3 text-base font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
                onClick={onClose}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
        {/* 올인내신 강조 버튼 (모바일) */}
        <Link
          href="/courses/school_exam"
          className="relative block mt-3 px-4 py-3 text-base font-bold text-white text-center rounded-full transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)', boxShadow: '0 4px 20px rgba(59,130,246,0.4)' }}
          onClick={onClose}
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full leading-none whitespace-nowrap">NEW</span>
          ✦ 올인내신
        </Link>
        {/* 올킬보카 강조 버튼 (모바일) */}
        <Link
          href="/allkill"
          className="relative block mt-2 px-4 py-3 text-base font-bold text-white text-center rounded-full transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #4DD9C0 100%)', boxShadow: '0 4px 20px rgba(167,139,250,0.4)' }}
          onClick={onClose}
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full leading-none whitespace-nowrap">NEW</span>
          ✦ 올킬보카
        </Link>
        {/* 내 대시보드 / 로그인 (모바일) */}
        {isLoggedIn ? (
          <Link
            href="/student"
            className="block mt-3 px-4 py-3 text-base font-medium text-white text-center bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 rounded-full transition-all shadow-lg shadow-violet-300/30"
            onClick={onClose}
          >
            내 대시보드
          </Link>
        ) : (
          <Link
            href="/login"
            className="block mt-3 px-4 py-3 text-base font-medium text-[#A78BFA] text-center border-2 border-[#A78BFA] hover:bg-[#A78BFA] hover:text-white rounded-full transition-all"
            onClick={onClose}
          >
            로그인
          </Link>
        )}
      </nav>
    </div>
  );
}
