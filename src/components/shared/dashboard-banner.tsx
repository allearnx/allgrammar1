'use client';

import { FadeIn } from './motion';
import { Sun, Sunset, Moon } from 'lucide-react';

function TimeIcon({ variant = 'gradient' }: { variant?: 'gradient' | 'white' }) {
  const hour = new Date().getHours();
  const className = variant === 'white' ? 'h-7 w-7 text-violet-500' : 'h-7 w-7 text-white/90';
  if (hour >= 6 && hour < 12) return <Sun className={className} />;
  if (hour >= 12 && hour < 18) return <Sunset className={className} />;
  return <Moon className={className} />;
}

interface DashboardBannerProps {
  greeting: string;
  subtitle: string;
  roleBadge: string;
  chips?: { label: string }[];
  variant?: 'gradient' | 'white';
}

export function DashboardBanner({ greeting, subtitle, roleBadge, chips, variant = 'gradient' }: DashboardBannerProps) {
  if (variant === 'white') {
    return (
      <FadeIn>
        <div className="rounded-2xl bg-violet-50 px-6 py-8 md:px-8 md:py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{greeting}</h2>
          <p className="mt-1.5 text-gray-500">{subtitle}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
              {roleBadge}
            </span>
            {chips?.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
      >
        {/* dot pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative flex items-start gap-3">
          <TimeIcon />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{greeting}</h2>
            <p className="mt-1 text-white/80">{subtitle}</p>
          </div>
        </div>

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
    </FadeIn>
  );
}
