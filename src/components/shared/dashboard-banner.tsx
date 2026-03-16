interface DashboardBannerProps {
  greeting: string;
  subtitle: string;
  roleBadge: string;
  chips?: { label: string }[];
}

export function DashboardBanner({ greeting, subtitle, roleBadge, chips }: DashboardBannerProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
      style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
    >
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

      <h2 className="relative text-2xl md:text-3xl font-bold">{greeting}</h2>
      <p className="relative mt-1 text-white/80">{subtitle}</p>

      <div className="relative mt-4 flex flex-wrap gap-3">
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
