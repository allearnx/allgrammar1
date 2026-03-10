'use client';

import { useState, useEffect } from 'react';
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

interface VocaAdminClientProps {
  books: VocaBook[];
}

export function VocaAdminClient({ books: initialBooks }: VocaAdminClientProps) {
  const [books, setBooks] = useState(initialBooks);
  const [selectedBook, setSelectedBook] = useState<VocaBook | null>(null);
  const [days, setDays] = useState<VocaDay[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<VocaBook | null>(null);

  useEffect(() => {
    if (!selectedBook) {
      setDays([]);
      return;
    }
    loadDays(selectedBook.id);
  }, [selectedBook?.id]);

  async function loadDays(bookId: string) {
    try {
      const res = await fetch(`/api/voca/days?bookId=${bookId}`);
      const data = await res.json();
      setDays(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Day 목록을 불러오지 못했습니다');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">올톡보카 관리</h2>
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
                selectedBook?.id === book.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedBook(book)}
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
                      onClick={(e) => { e.stopPropagation(); setEditingBook(book); }}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); setDeleteBookId(book.id); }}
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

      {selectedBook && (
        <DaySection
          book={selectedBook}
          days={days}
          expandedDay={expandedDay}
          onToggleDay={(dayId) => setExpandedDay(expandedDay === dayId ? null : dayId)}
          onAddDay={(day) => setDays([...days, day])}
          onDeleteDay={(dayId) => {
            setDays(days.filter((d) => d.id !== dayId));
            toast.success('Day가 삭제되었습니다');
          }}
          onDaysCreated={() => loadDays(selectedBook.id)}
        />
      )}

      <ConfirmDialog
        open={deleteBookId !== null}
        onOpenChange={(open) => { if (!open) setDeleteBookId(null); }}
        description="이 교재를 삭제하시겠습니까? 포함된 모든 Day와 단어도 삭제됩니다."
        onConfirm={async () => {
          const id = deleteBookId;
          setDeleteBookId(null);
          if (!id) return;
          try {
            const res = await fetch(`/api/voca/books/${id}`, { method: 'DELETE' });
            if (res.ok) {
              setBooks(books.filter((b) => b.id !== id));
              if (selectedBook?.id === id) setSelectedBook(null);
              toast.success('교재가 삭제되었습니다');
            } else {
              toast.error('교재 삭제에 실패했습니다');
            }
          } catch (err) {
            console.error(err);
            toast.error('교재 삭제 중 오류가 발생했습니다');
          }
        }}
      />

      {editingBook && (
        <EditBookDialog
          book={editingBook}
          open
          onOpenChange={(open) => { if (!open) setEditingBook(null); }}
          onSave={(updated) => {
            setBooks(books.map((b) => (b.id === updated.id ? updated : b)));
            if (selectedBook?.id === updated.id) setSelectedBook(updated);
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
      console.error(err);
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 올톡보카 중1" />
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
      console.error(err);
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
