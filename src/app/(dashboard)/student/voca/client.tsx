'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, CheckCircle } from 'lucide-react';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

interface VocaHomeClientProps {
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
}

export function VocaHomeClient({ books, days, progressList }: VocaHomeClientProps) {
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');

  const filteredDays = useMemo(
    () => days.filter((d) => d.book_id === selectedBookId),
    [days, selectedBookId]
  );

  const progressMap = useMemo(() => {
    const map = new Map<string, VocaStudentProgress>();
    progressList.forEach((p) => map.set(p.day_id, p));
    return map;
  }, [progressList]);

  if (books.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 교재가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Book selector */}
      {books.length > 1 && (
        <Select value={selectedBookId} onValueChange={setSelectedBookId}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="교재 선택" />
          </SelectTrigger>
          <SelectContent>
            {books.map((book) => (
              <SelectItem key={book.id} value={book.id}>
                {book.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {books.length === 1 && (
        <h2 className="text-lg font-semibold">{books[0].title}</h2>
      )}

      {/* Day grid */}
      {filteredDays.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          아직 등록된 Day가 없습니다.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDays.map((day) => {
            const prog = progressMap.get(day.id);
            const completed = prog?.flashcard_completed &&
              (prog.quiz_score ?? 0) >= 80 &&
              (prog.spelling_score ?? 0) >= 80;

            return (
              <Link key={day.id} href={`/student/voca/${day.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{day.title}</p>
                          <DayProgressBadges progress={prog} />
                        </div>
                      </div>
                      {completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DayProgressBadges({ progress }: { progress?: VocaStudentProgress | null }) {
  if (!progress) return null;

  return (
    <div className="flex gap-1 mt-1">
      {progress.flashcard_completed && (
        <Badge variant="outline" className="text-[10px] h-4 px-1">카드</Badge>
      )}
      {progress.quiz_score != null && (
        <Badge variant="outline" className="text-[10px] h-4 px-1">퀴즈 {progress.quiz_score}%</Badge>
      )}
      {progress.spelling_score != null && (
        <Badge variant="outline" className="text-[10px] h-4 px-1">스펠링 {progress.spelling_score}%</Badge>
      )}
      {progress.matching_completed && (
        <Badge variant="outline" className="text-[10px] h-4 px-1">매칭</Badge>
      )}
    </div>
  );
}
