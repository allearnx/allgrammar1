interface BannerBadgeProps {
  children: React.ReactNode;
  bold?: boolean;
}

/** 흰 배너 카드용 라이트 필 — 구글 스타일 */
export function BannerBadge({ children, bold }: BannerBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border bg-muted px-3 py-1 text-sm ${bold ? 'font-bold text-primary' : 'font-medium text-gray-700'}`}
    >
      {children}
    </span>
  );
}
