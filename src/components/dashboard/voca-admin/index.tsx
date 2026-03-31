'use client';

import { useState, useEffect, useReducer } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Pencil, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DaySection } from './day-section';
import type { VocaBook, VocaDay } from '@/types/voca';
import { logger } from '@/lib/logger';

interface VocaAdminClientProps {
  books: VocaBook[];
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

export function VocaAdminClient({ books: initialBooks }: VocaAdminClientProps) {
  const [books, setBooks] = useState(initialBooks);
  const [state, dispatch] = useReducer(vocaAdminReducer, initialState);

  async function loadDays(bookId: string) {
    try {
      const res = await fetch(`/api/voca/days?bookId=${bookId}`);
      const data = await res.json();
      dispatch({ type: 'SET_DAYS', days: data || [] });
    } catch (err) {
      logger.error('voca_admin.index', { error: err instanceof Error ? err.message : String(err) });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">올킬보카 관리</h2>
        <AddBookDialog onAdd={(book) => setBooks([...books, book])} />
      </div>

      {books.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          등록된 교재가 없습니다. 교재를 추가해주세요.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card
              key={book.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                state.selectedBook?.id === book.id ? 'ring-2 ring-violet-600' : ''
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
          ))}
        </div>
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
            const res = await fetch(`/api/voca/books/${id}`, { method: 'DELETE' });
            if (res.ok) {
              setBooks(books.filter((b) => b.id !== id));
              if (state.selectedBook?.id === id) dispatch({ type: 'CLEAR_SELECTION' });
              toast.success('교재가 삭제되었습니다');
            } else {
              toast.error('교재 삭제에 실패했습니다');
            }
          } catch (err) {
            logger.error('voca_admin.index', { error: err instanceof Error ? err.message : String(err) });
            toast.error('교재 삭제 중 오류가 발생했습니다');
          }
        }}
      />

      {state.editingBook && (
        <EditBookDialog
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

function AddBookDialog({ onAdd }: { onAdd: (book: VocaBook) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/voca/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd(data);
      setOpen(false);
      setTitle('');
      setDescription('');
      toast.success('교재가 추가되었습니다');
    } catch (err) {
      logger.error('voca_admin.index', { error: err instanceof Error ? err.message : String(err) });
      toast.error('교재 추가 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />교재 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>교재 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>교재명</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 올킬보카 중1" />
          </div>
          <div>
            <Label>설명 (선택)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="교재 설명" />
          </div>
          <Button type="submit" className="w-full" disabled={saving || !title.trim()}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditBookDialog({
  book,
  open,
  onOpenChange,
  onSave,
}: {
  book: VocaBook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (book: VocaBook) => void;
}) {
  const [title, setTitle] = useState(book.title);
  const [description, setDescription] = useState(book.description || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/voca/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: book.id, title: title.trim(), description: description.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSave(data);
      onOpenChange(false);
      toast.success('교재가 수정되었습니다');
    } catch (err) {
      logger.error('voca_admin.index', { error: err instanceof Error ? err.message : String(err) });
      toast.error('교재 수정 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>교재 수정</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>교재명</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>설명 (선택)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving || !title.trim()}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
