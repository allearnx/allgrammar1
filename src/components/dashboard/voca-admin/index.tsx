'use client';

import { useState, useEffect, useReducer } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { DaySection } from './day-section';
import { BookFormDialog } from './book-form-dialog';
import type { VocaBook, VocaDay } from '@/types/voca';

interface VocaAdminClientProps {
  books: VocaBook[];
  /** 교재별 Day 수 — 비슷한 이름의 빈 교재를 착각하지 않도록 카드에 표시 */
  dayCounts?: Record<string, number>;
}

interface VocaAdminState {
  selectedBook: VocaBook | null;
  days: VocaDay[];
  expandedDay: string | null;
  deleteBookId: string | null;
  editingBook: VocaBook | null;
}

type VocaAdminAction =
  | { type: 'SELECT_BOOK'; book: VocaBook }
  | { type: 'SET_DAYS'; days: VocaDay[] }
  | { type: 'TOGGLE_DAY'; dayId: string }
  | { type: 'ADD_DAY'; day: VocaDay }
  | { type: 'DELETE_DAY'; dayId: string }
  | { type: 'SET_DELETE_BOOK'; id: string | null }
  | { type: 'SET_EDITING_BOOK'; book: VocaBook | null }
  | { type: 'CLEAR_SELECTION' };

function vocaAdminReducer(state: VocaAdminState, action: VocaAdminAction): VocaAdminState {
  switch (action.type) {
    case 'SELECT_BOOK':
      return { ...state, selectedBook: action.book, days: [], expandedDay: null };
    case 'SET_DAYS':
      return { ...state, days: action.days };
    case 'TOGGLE_DAY':
      return { ...state, expandedDay: state.expandedDay === action.dayId ? null : action.dayId };
    case 'ADD_DAY':
      return { ...state, days: [...state.days, action.day] };
    case 'DELETE_DAY':
      return { ...state, days: state.days.filter((d) => d.id !== action.dayId) };
    case 'SET_DELETE_BOOK':
      return { ...state, deleteBookId: action.id };
    case 'SET_EDITING_BOOK':
      return { ...state, editingBook: action.book };
    case 'CLEAR_SELECTION':
      return { ...state, selectedBook: null, days: [], expandedDay: null };
    default:
      return state;
  }
}

const initialState: VocaAdminState = {
  selectedBook: null,
  days: [],
  expandedDay: null,
  deleteBookId: null,
  editingBook: null,
};

export function VocaAdminClient({ books: initialBooks, dayCounts = {} }: VocaAdminClientProps) {
  const [books, setBooks] = useState(initialBooks);
  const [query, setQuery] = useState('');
  const [state, dispatch] = useReducer(vocaAdminReducer, initialState);

  // 교재가 많아져서(19권+) 검색 + 활성/비활성 분리로 정리
  const q = query.trim().toLowerCase();
  const filtered = q ? books.filter((b) => b.title.toLowerCase().includes(q)) : books;
  const activeBooks = filtered.filter((b) => b.is_active);
  const inactiveBooks = filtered.filter((b) => !b.is_active);

  async function loadDays(bookId: string) {
    try {
      const data = await fetchWithToast<VocaDay[]>(`/api/voca/days?bookId=${bookId}`, {
        method: 'GET',
        silent: true,
        logContext: 'voca_admin.index',
      });
      dispatch({ type: 'SET_DAYS', days: data || [] });
    } catch {
      toast.error('Day 목록을 불러오지 못했습니다');
    }
  }

  useEffect(() => {
    if (!state.selectedBook) {
      dispatch({ type: 'SET_DAYS', days: [] });
      return;
    }
    loadDays(state.selectedBook.id);
  }, [state.selectedBook?.id, state.selectedBook]);

  const renderBookCard = (book: VocaBook) => (
    <Card
      key={book.id}
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        state.selectedBook?.id === book.id ? 'ring-2 ring-brand-600' : ''
      }`}
      onClick={() => dispatch({ type: 'SELECT_BOOK', book })}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{book.title}</p>
            {book.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{book.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {(dayCounts[book.id] ?? 0) > 0 ? (
              <Badge variant="outline" className="text-gray-500">Day {dayCounts[book.id]}</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">빈 교재</Badge>
            )}
            {book.definition_lang === 'en' && <Badge className="bg-brand-100 text-brand-700 hover:bg-brand-100">영영</Badge>}
            {!book.is_active && <Badge variant="secondary">비활성</Badge>}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_EDITING_BOOK', book }); }}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_DELETE_BOOK', id: book.id }); }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold shrink-0">올킬보카 관리</h2>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="교재 검색"
            className="h-9 pl-8"
          />
        </div>
        <BookFormDialog mode="add" onSave={(book) => setBooks([...books, book])} />
      </div>

      {books.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          등록된 교재가 없습니다. 교재를 추가해주세요.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          &ldquo;{query}&rdquo; 검색 결과가 없습니다.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeBooks.map(renderBookCard)}
          </div>

          {/* 비활성 교재는 접어서 — 활성 목록이 어수선해지지 않게 */}
          {inactiveBooks.length > 0 && (
            <details open={!!q}>
              <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-gray-600">
                비활성 교재 ({inactiveBooks.length})
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inactiveBooks.map(renderBookCard)}
              </div>
            </details>
          )}
        </>
      )}

      {state.selectedBook && (
        <DaySection
          book={state.selectedBook}
          days={state.days}
          expandedDay={state.expandedDay}
          onToggleDay={(dayId) => dispatch({ type: 'TOGGLE_DAY', dayId })}
          onAddDay={(day) => dispatch({ type: 'ADD_DAY', day })}
          onDeleteDay={(dayId) => {
            dispatch({ type: 'DELETE_DAY', dayId });
            toast.success('Day가 삭제되었습니다');
          }}
          onDaysCreated={() => loadDays(state.selectedBook!.id)}
        />
      )}

      <ConfirmDialog
        open={state.deleteBookId !== null}
        onOpenChange={(open) => { if (!open) dispatch({ type: 'SET_DELETE_BOOK', id: null }); }}
        description="이 교재를 삭제하시겠습니까? 포함된 모든 Day와 단어도 삭제됩니다."
        onConfirm={async () => {
          const id = state.deleteBookId;
          dispatch({ type: 'SET_DELETE_BOOK', id: null });
          if (!id) return;
          try {
            await fetchWithToast(`/api/voca/books/${id}`, {
              method: 'DELETE',
              successMessage: '교재가 삭제되었습니다',
              errorMessage: '교재 삭제에 실패했습니다',
              logContext: 'voca_admin.index',
            });
            setBooks(books.filter((b) => b.id !== id));
            if (state.selectedBook?.id === id) dispatch({ type: 'CLEAR_SELECTION' });
          } catch {
            // fetchWithToast already shows toast
          }
        }}
      />

      {state.editingBook && (
        <BookFormDialog
          mode="edit"
          book={state.editingBook}
          open
          onOpenChange={(open) => { if (!open) dispatch({ type: 'SET_EDITING_BOOK', book: null }); }}
          onSave={(updated) => {
            setBooks(books.map((b) => (b.id === updated.id ? updated : b)));
            if (state.selectedBook?.id === updated.id) dispatch({ type: 'SELECT_BOOK', book: updated });
          }}
        />
      )}
    </div>
  );
}
