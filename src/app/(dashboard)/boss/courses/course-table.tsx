'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, BookOpen } from 'lucide-react';
import { CATEGORY_LABELS, formatPrice } from '@/types/public';
import type { CourseItem } from './types';
import { CATEGORIES } from './types';

interface CourseTableProps {
  courses: CourseItem[];
  onEdit: (course: CourseItem) => void;
  onDelete: (id: string) => void;
}

export function CourseTable({ courses, onEdit, onDelete }: CourseTableProps) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? courses : courses.filter((c) => c.category === filter);

  return (
    <>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">순서</TableHead>
              <TableHead className="w-[60px]">썸네일</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="hidden md:table-cell">카테고리</TableHead>
              <TableHead className="hidden md:table-cell">선생님</TableHead>
              <TableHead className="hidden lg:table-cell">가격</TableHead>
              <TableHead className="w-[70px]">활성</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="text-muted-foreground">{course.sort_order}</TableCell>
                <TableCell>
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      width={40}
                      height={40}
                      className="rounded object-cover w-10 h-10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary">{CATEGORY_LABELS[course.category]}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {course.teacher_name || '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatPrice(course.price)}원
                </TableCell>
                <TableCell>
                  <Badge variant={course.is_active ? 'default' : 'secondary'}>
                    {course.is_active ? '활성' : '비활성'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(course)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(course.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  코스가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
