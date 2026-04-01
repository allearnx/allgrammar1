import { fetchWithToast } from '@/lib/fetch-with-toast';

/** 공통 삭제 핸들러 생성 */
export function makeDeleteHandler(
  endpoint: string,
  setList: (fn: (prev: { id: string }[]) => { id: string }[]) => void,
  messages: { success: string; error: string; logKey: string },
) {
  return async (id: string) => {
    try {
      await fetchWithToast(endpoint, {
        method: 'DELETE',
        body: { id },
        successMessage: messages.success,
        errorMessage: messages.error,
        logContext: messages.logKey,
      });
      setList((prev) => prev.filter((item) => item.id !== id));
    } catch { /* fetchWithToast handles toasts/logging */ }
  };
}
