'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, Pencil, Trash2, UserCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { TeacherProfile } from '@/types/public';
import { TeacherProfileForm, defaultForm } from './teacher-profile-form';
import type { FormData } from './teacher-profile-form';

export function TeacherProfilesClient({ profiles }: { profiles: TeacherProfile[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  function openCreate() {
    setEditingId(null);
    setFormData(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(profile: TeacherProfile) {
    setEditingId(profile.id);
    setFormData({
      display_name: profile.display_name,
      bio: profile.bio,
      image_url: profile.image_url || '',
      image_position: (profile.image_position as 'center' | 'top' | 'bottom') || 'center',
      is_visible: profile.is_visible,
      sort_order: profile.sort_order,
    });
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await fetchWithToast('/api/boss/teacher-profiles', {
        method: 'DELETE',
        body: { id },
        successMessage: '프로필이 삭제되었습니다',
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
        <p className="text-muted-foreground">총 {profiles.length}명</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          프로필 추가
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">순서</TableHead>
              <TableHead className="w-[60px]">사진</TableHead>
              <TableHead>이름</TableHead>
              <TableHead className="hidden md:table-cell">소개</TableHead>
              <TableHead className="w-[70px]">공개</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="text-muted-foreground">{profile.sort_order}</TableCell>
                <TableCell>
                  {profile.image_url ? (
                    <Image
                      src={profile.image_url}
                      alt={profile.display_name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover w-10 h-10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{profile.display_name}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                  {profile.bio}
                </TableCell>
                <TableCell>
                  <Badge variant={profile.is_visible ? 'default' : 'secondary'}>
                    {profile.is_visible ? '공개' : '비공개'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(profile)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(profile.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <UserCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  등록된 선생님 프로필이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TeacherProfileForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        initialForm={formData}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        description="정말 이 프로필을 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
