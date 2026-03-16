import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface QuickAction {
  title: string;
  description: string;
  href: string;
  color: 'indigo' | 'blue' | 'purple' | 'emerald';
  icon: LucideIcon;
}

const COLOR_STYLES: Record<string, { bg: string; text: string; hoverBorder: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-300' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hoverBorder: 'hover:border-blue-300' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hoverBorder: 'hover:border-purple-300' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-300' },
};

export function QuickActionGrid({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => {
        const style = COLOR_STYLES[action.color];
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-2xl border bg-white p-5 transition-all hover:shadow-md ${style.hoverBorder}`}
          >
            <div className={`inline-flex rounded-xl ${style.bg} p-3`}>
              <Icon className={`h-6 w-6 ${style.text}`} />
            </div>
            <h3 className="mt-3 font-semibold">{action.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{action.description}</p>
            <ArrowRight className="mt-3 h-4 w-4 text-gray-400" />
          </Link>
        );
      })}
    </div>
  );
}
