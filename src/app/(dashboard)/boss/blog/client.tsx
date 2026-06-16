'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, Pencil, Trash2, Eye, FileText } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { BlogPost, BlogCategory } from '@/types/blog';
import { BLOG_CATEGORY_LABELS } from '@/types/blog';

type BlogListItem = Omit<BlogPost, 'content' | 'meta_title' | 'meta_description' | 'author_id' | 'attachments'>;

const categoryBadgeColors: Record<BlogCategory, string> = {
  grammar_tip: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  study_method: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  exam_prep: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  news: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function BlogClient({ posts }: { posts: BlogListItem[] }) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    try {
      await fetchWithToast('/api/boss/blog', {
        method: 'DELETE',
        body: { id },
        successMessage: '글이 삭제되었습니다',
        errorMessage: '삭제 실패',
      });
      router.refresh();
    } catch {
      // error already toasted
    }
  }

  async function handleTogglePublish(post: BlogListItem) {
    setTogglingId(post.id);
    try {
      await fetchWithToast('/api/boss/blog', {
        method: 'PATCH',
        body: { id: post.id, is_published: !post.is_published },
        successMessage: post.is_published ? '비공개로 전환되었습니다' : '공개로 전환되었습니다',
        errorMessage: '상태 변경 실패',
      });
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      setTogglingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">총 {posts.length}개</p>
        <Button onClick={() => router.push('/boss/blog/write')}>
          <Plus className="h-4 w-4 mr-1" />
          새 글 작성
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead className="w-[90px]">카테고리</TableHead>
              <TableHead className="w-[80px]">공개 상태</TableHead>
              <TableHead className="hidden md:table-cell w-[80px]">조회수</TableHead>
              <TableHead className="hidden md:table-cell w-[100px]">작성일</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="font-medium">{post.title}</div>
                  {post.excerpt && (
                    <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {post.excerpt}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={categoryBadgeColors[post.category]}>
                    {BLOG_CATEGORY_LABELS[post.category]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(post)}
                    disabled={togglingId === post.id}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    <Badge variant={post.is_published ? 'default' : 'secondary'}>
                      {post.is_published ? '공개' : '비공개'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    {post.view_count}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatDate(post.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push(`/boss/blog/write?id=${post.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteId(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  블로그 글이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        description="정말 이 글을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
