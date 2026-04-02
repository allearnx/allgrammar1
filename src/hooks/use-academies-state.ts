import { useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export interface Academy {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  user_count: number;
  student_count: number;
  max_students: number | null;
  teachers: string[];
  students: string[];
  services: string[];
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
}

export interface AcademyState {
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

export type AcademyAction =
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

export function useAcademiesState() {
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

  return {
    state,
    dispatch,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCopyCode,
    handleRegenerateCode,
  };
}
