import { BRAND } from '@/lib/utils/brand-colors';

interface BannerBadgeProps {
  children: React.ReactNode;
  bold?: boolean;
}

export function BannerBadge({ children, bold }: BannerBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${bold ? 'font-bold' : 'font-medium'} text-white`}
      style={{ border: `1.5px solid ${BRAND.teal}`, background: 'rgba(255,255,255,0.15)' }}
    >
      {children}
    </span>
  );
}
