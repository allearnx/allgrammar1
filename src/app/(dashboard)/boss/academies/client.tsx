'use client';

import { useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Building2, Copy, RefreshCw, GraduationCap, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface Academy {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  user_count: number;
  student_count: number;
  max_students: number | null;
  teachers: string[];
  services: string[];
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
}

interface AcademiesClientProps {
  academies: Academy[];
}

interface AcademyState {
  addOpen: boolean;
  editOpen: boolean;
  editingAcademy: Academy | null;
  name: string;
  maxStudents: string;
  services: string[];
  saving: boolean;
  deleting: string | null;
  deleteConfirmId: string | null;
  regenerateConfirmId: string | null;
  regenerating: string | null;
}

type AcademyAction =
  | { type: 'SET_ADD_OPEN'; open: boolean }
  | { type: 'OPEN_EDIT'; academy: Academy }
  | { type: 'CLOSE_EDIT' }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_MAX_STUDENTS'; value: string }
  | { type: 'SET_SERVICES'; services: string[] }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_DELETING'; id: string | null }
  | { type: 'SET_DELETE_CONFIRM'; id: string | null }
  | { type: 'SET_REGENERATE_CONFIRM'; id: string | null }
  | { type: 'SET_REGENERATING'; id: string | null }
  | { type: 'RESET_ADD_FORM' };

function academyReducer(state: AcademyState, action: AcademyAction): AcademyState {
  switch (action.type) {
    case 'SET_ADD_OPEN':
      return { ...state, addOpen: action.open };
    case 'OPEN_EDIT':
      return {
        ...state,
        editingAcademy: action.academy,
        name: action.academy.name,
        maxStudents: action.academy.max_students?.toString() || '',
        services: action.academy.services || [],
        editOpen: true,
      };
    case 'CLOSE_EDIT':
      return { ...state, editOpen: false, editingAcademy: null, name: '' };
    case 'SET_NAME':
      return { ...state, name: action.name };
    case 'SET_MAX_STUDENTS':
      return { ...state, maxStudents: action.value };
    case 'SET_SERVICES':
      return { ...state, services: action.services };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };
    case 'SET_DELETING':
      return { ...state, deleting: action.id };
    case 'SET_DELETE_CONFIRM':
      return { ...state, deleteConfirmId: action.id };
    case 'SET_REGENERATE_CONFIRM':
      return { ...state, regenerateConfirmId: action.id };
    case 'SET_REGENERATING':
      return { ...state, regenerating: action.id };
    case 'RESET_ADD_FORM':
      return { ...state, name: '', addOpen: false };
    default:
      return state;
  }
}

const academyInitialState: AcademyState = {
  addOpen: false,
  editOpen: false,
  editingAcademy: null,
  name: '',
  maxStudents: '',
  services: [],
  saving: false,
  deleting: null,
  deleteConfirmId: null,
  regenerateConfirmId: null,
  regenerating: null,
};

export function AcademiesClient({ academies }: AcademiesClientProps) {
  const [state, dispatch] = useReducer(academyReducer, academyInitialState);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: 'SET_SAVING', saving: true });

    try {
      await fetchWithToast('/api/boss/academies', {
        body: { name: state.name },
        successMessage: '학원이 추가되었습니다',
        errorMessage: '추가 실패',
      });
      dispatch({ type: 'RESET_ADD_FORM' });
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.editingAcademy) return;
    dispatch({ type: 'SET_SAVING', saving: true });

    try {
      await fetchWithToast(`/api/boss/academies/${state.editingAcademy.id}`, {
        method: 'PATCH',
        body: { name: state.name, max_students: state.maxStudents ? parseInt(state.maxStudents, 10) : null, services: state.services },
        successMessage: '학원 이름이 변경되었습니다',
        errorMessage: '변경 실패',
      });
      dispatch({ type: 'CLOSE_EDIT' });
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  }

  async function handleDelete(academyId: string) {
    dispatch({ type: 'SET_DELETING', id: academyId });

    try {
      await fetchWithToast(`/api/boss/academies/${academyId}`, {
        method: 'DELETE',
        successMessage: '학원이 삭제되었습니다',
        errorMessage: '삭제 실패',
      });
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      dispatch({ type: 'SET_DELETING', id: null });
    }
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('초대 코드가 복사되었습니다');
  }

  async function handleRegenerateCode(academyId: string) {
    dispatch({ type: 'SET_REGENERATING', id: academyId });

    try {
      await fetchWithToast(`/api/boss/academies/${academyId}`, {
        successMessage: '초대 코드가 재생성되었습니다',
        errorMessage: '재생성 실패',
      });
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      dispatch({ type: 'SET_REGENERATING', id: null });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          총 {academies.length}개 학원
        </p>
        <Dialog open={state.addOpen} onOpenChange={(open) => dispatch({ type: 'SET_ADD_OPEN', open })}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              학원 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>학원 추가</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>학원 이름</Label>
                <Input
                  value={state.name}
                  onChange={(e) => dispatch({ type: 'SET_NAME', name: e.target.value })}
                  placeholder="예: 올라영어학원"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={state.saving}>
                {state.saving ? '저장 중...' : '추가'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {academies.map((academy) => (
        <Card key={academy.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium truncate block">{academy.name}</span>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      초대 코드: <code className="font-mono font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">{academy.invite_code}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyCode(academy.invite_code)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => dispatch({ type: 'SET_REGENERATE_CONFIRM', id: academy.id })}
                        disabled={state.regenerating === academy.id}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${state.regenerating === academy.id ? 'animate-spin' : ''}`} />
                      </Button>
                    </span>
                    <span>회원 {academy.user_count}명</span>
                    {academy.max_students && (
                      <span>좌석 {academy.student_count}/{academy.max_students}명</span>
                    )}
                    <span>생성일: {format(new Date(academy.created_at), 'yyyy-MM-dd')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      선생님 {academy.teachers.length}명
                      {academy.teachers.length > 0 && (
                        <span className="text-foreground ml-1">
                          ({academy.teachers.join(', ')})
                        </span>
                      )}
                    </span>
                  </div>
                  {academy.owner_name && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        원장: <span className="text-foreground">{academy.owner_name}</span>
                      </span>
                      {academy.owner_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-foreground">{academy.owner_email}</span>
                        </span>
                      )}
                      {academy.owner_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-foreground">{academy.owner_phone}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {academy.services && academy.services.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5">
                      {academy.services.includes('naesin') && (
                        <Badge variant="secondary">올인내신</Badge>
                      )}
                      {academy.services.includes('voca') && (
                        <Badge variant="secondary">올킬보카</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch({ type: 'OPEN_EDIT', academy })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => dispatch({ type: 'SET_DELETE_CONFIRM', id: academy.id })}
                  disabled={state.deleting === academy.id}
                >
                  {state.deleting === academy.id ? '...' : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {academies.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          등록된 학원이 없습니다.
        </p>
      )}

      <ConfirmDialog
        open={state.deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) dispatch({ type: 'SET_DELETE_CONFIRM', id: null }); }}
        description="정말 이 학원을 삭제하시겠습니까?"
        onConfirm={() => {
          const id = state.deleteConfirmId;
          dispatch({ type: 'SET_DELETE_CONFIRM', id: null });
          if (id) handleDelete(id);
        }}
      />

      <ConfirmDialog
        open={state.regenerateConfirmId !== null}
        onOpenChange={(open) => { if (!open) dispatch({ type: 'SET_REGENERATE_CONFIRM', id: null }); }}
        description="초대 코드를 재생성하시겠습니까? 기존 코드는 더 이상 사용할 수 없습니다."
        onConfirm={() => {
          const id = state.regenerateConfirmId;
          dispatch({ type: 'SET_REGENERATE_CONFIRM', id: null });
          if (id) handleRegenerateCode(id);
        }}
      />

      <Dialog open={state.editOpen} onOpenChange={(open) => { if (!open) dispatch({ type: 'CLOSE_EDIT' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학원 이름 변경</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>학원 이름</Label>
              <Input
                value={state.name}
                onChange={(e) => dispatch({ type: 'SET_NAME', name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>최대 학생 수 (좌석)</Label>
              <Input
                type="number"
                min="1"
                value={state.maxStudents}
                onChange={(e) => dispatch({ type: 'SET_MAX_STUDENTS', value: e.target.value })}
                placeholder="비워두면 무제한"
              />
            </div>
            <div className="space-y-2">
              <Label>서비스 배정</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={state.services.includes('naesin')}
                    onCheckedChange={(checked) =>
                      dispatch({
                        type: 'SET_SERVICES',
                        services: checked
                          ? [...state.services.filter((s) => s !== 'naesin'), 'naesin']
                          : state.services.filter((s) => s !== 'naesin'),
                      })
                    }
                  />
                  <span className="text-sm">올인내신</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={state.services.includes('voca')}
                    onCheckedChange={(checked) =>
                      dispatch({
                        type: 'SET_SERVICES',
                        services: checked
                          ? [...state.services.filter((s) => s !== 'voca'), 'voca']
                          : state.services.filter((s) => s !== 'voca'),
                      })
                    }
                  />
                  <span className="text-sm">올킬보카</span>
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={state.saving}>
              {state.saving ? '저장 중...' : '변경'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
