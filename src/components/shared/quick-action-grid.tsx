import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StaggerContainer, StaggerItem } from './motion';

export interface QuickAction {
  title: string;
  description: string;
  href: string;
  /** 구글 4색 — 카드마다 다른 색을 돌려 단색 도배를 피한다 */
  color: 'blue' | 'green' | 'yellow' | 'red';
  icon: LucideIcon;
}

const COLOR_STYLES: Record<QuickAction['color'], { bg: string; text: string; hoverBg: string; hoverBorder: string }> = {
  blue: { bg: 'bg-[#E8F0FE]', text: 'text-[#1A73E8]', hoverBg: 'group-hover:bg-[#D2E3FC]', hoverBorder: 'hover:border-[#AECBFA]' },
  green: { bg: 'bg-[#E6F4EA]', text: 'text-[#188038]', hoverBg: 'group-hover:bg-[#CEEAD6]', hoverBorder: 'hover:border-[#A8DAB5]' },
  yellow: { bg: 'bg-[#FEF7E0]', text: 'text-[#B06000]', hoverBg: 'group-hover:bg-[#FEEFC3]', hoverBorder: 'hover:border-[#FDE293]' },
  red: { bg: 'bg-[#FCE8E6]', text: 'text-[#C5221F]', hoverBg: 'group-hover:bg-[#FAD2CF]', hoverBorder: 'hover:border-[#F6AEA9]' },
};

export function QuickActionGrid({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <StaggerContainer className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => {
        const style = COLOR_STYLES[action.color];
        const Icon = action.icon;
        return (
          <StaggerItem key={action.href}>
            <Link
              href={action.href}
              className={`group block rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.hoverBorder}`}
            >
              <div className={`inline-flex rounded-xl ${style.bg} ${style.hoverBg} p-3 transition-colors`}>
                <Icon className={`h-6 w-6 ${style.text} transition-transform duration-200 group-hover:scale-110`} />
              </div>
              <h3 className="mt-3 font-semibold">{action.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{action.description}</p>
              <ArrowRight className="mt-3 h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
