'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen, ChevronDown, Search, CheckCircle } from 'lucide-react';
import type { VocaBook } from '@/types/voca';

/** 교재 드롭다운 — 7권 이상이면 검색창 */
export function BookSelector({ books, selectedBookId, onSelect }: { books: VocaBook[]; selectedBookId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = books.find((b) => b.id === selectedBookId);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? books.filter((b) => b.title.toLowerCase().includes(q)) : books;
  const showSearch = books.length > 6;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-gray-300"
      >
        <span className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="voca-display truncate text-gray-800" style={{ fontWeight: 700 }}>{selected?.title || '교재 선택'}</span>
          <span className="shrink-0 text-xs font-medium text-gray-400">{books.length}권</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {showSearch && (
            <div className="border-b p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="교재 검색"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-[#d2e3fc]"
                />
              </div>
            </div>
          )}
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">검색 결과가 없습니다</p>
            ) : (
              filtered.map((book) => {
                const isSel = book.id === selectedBookId;
                return (
                  <button
                    key={book.id}
                    onClick={() => { onSelect(book.id); setOpen(false); setQuery(''); }}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${isSel ? 'font-bold text-primary' : 'text-gray-700'}`}
                  >
                    <span className="truncate">{book.title}</span>
                    {isSel && <CheckCircle className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
