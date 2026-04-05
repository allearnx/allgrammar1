'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

export function StudentSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [, startTransition] = useTransition();

  function handleChange(value: string) {
    setQuery(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="이름으로 검색..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {query && (
        <button
          type="button"
          onClick={() => handleChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
