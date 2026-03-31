'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { CourseTable } from './course-table';
import { CourseFormDialog } from './course-form-dialog';
import type { CourseItem, TeacherOption, CourseFormData } from './types';
import { defaultForm } from './types';

export function CoursesClient({ courses, teachers }: { courses: CourseItem[]; teachers: TeacherOption[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(course: CourseItem) {
    setEditingId(course.id);
    let detailUrls: string[] = [];
    if (course.detail_image_url) {
      try {
        const parsed = JSON.parse(course.detail_image_url);
        detailUrls = Array.isArray(parsed) ? parsed : [course.detail_image_url];
      } catch {
        detailUrls = [course.detail_image_url];
      }
    }
    setForm({
      title: course.title,
      category: course.category,
      description: course.description,
      price: course.price,
      thumbnail_url: course.thumbnail_url || '',
      detail_image_urls: detailUrls,
      teacher_id: course.teacher_id || '',
      is_active: course.is_active,
      sort_order: course.sort_order,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = editingId !== null;
      const { detail_image_urls, ...rest } = form;
      const payload = {
        ...rest,
        thumbnail_url: form.thumbnail_url || null,
        detail_image_url: detail_image_urls.length > 0 ? JSON.stringify(detail_image_urls) : null,
        teacher_id: form.teacher_id || null,
      };
      await fetchWithToast('/api/boss/courses', {
        method: isEdit ? 'PATCH' : 'POST',
        body: isEdit ? { id: editingId, ...payload } : payload,
        successMessage: isEdit ? '코스가 수정되었습니다' : '코스가 추가되었습니다',
        errorMessage: '저장 실패',
      });
      setDialogOpen(false);
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetchWithToast('/api/boss/courses', {
        method: 'DELETE',
        body: { id },
        successMessage: '코스가 삭제되었습니다',
        errorMessage: '삭제 실패',
      });
      router.refresh();
    } catch {
      // error already toasted
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">총 {courses.length}개</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          코스 추가
        </Button>
      </div>

      <CourseTable courses={courses} onEdit={openEdit} onDelete={setDeleteId} />

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        teachers={teachers}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        description="정말 이 코스를 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
