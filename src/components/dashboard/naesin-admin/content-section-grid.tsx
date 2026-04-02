import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface ContentSection {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number | null;
  color: string;
  toggle?: () => void;
  expanded?: boolean;
}

export function ContentSectionGrid({ sections }: { sections: ContentSection[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {sections.map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-2 p-2 rounded-lg bg-muted/50 ${s.toggle ? 'cursor-pointer hover:bg-muted' : ''}`}
          onClick={s.toggle}
        >
          <s.icon className={`h-4 w-4 ${s.color}`} />
          <span className="text-sm">{s.label}</span>
          <Badge variant="secondary" className="ml-auto">
            {s.count === null ? '...' : s.count}개
          </Badge>
          {s.toggle && (s.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
        </div>
      ))}
    </div>
  );
}
