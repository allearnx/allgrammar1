interface DashboardBannerProps {
  greeting: string;
  subtitle: string;
  roleBadge: string;
  chips?: { label: string }[];
}

export function DashboardBanner({ greeting, subtitle, roleBadge, chips }: DashboardBannerProps) {
  return (
    <div
      className="rounded-2xl p-6 md:p-8 text-white"
      style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
    >
      <h2 className="text-2xl md:text-3xl font-bold">{greeting}</h2>
      <p className="mt-1 text-white/80">{subtitle}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-800">
          {roleBadge}
        </span>
        {chips?.map((chip) => (
          <span
            key={chip.label}
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          >
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}
