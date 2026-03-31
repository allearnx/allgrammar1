import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface FetchWithToastOptions {
  method?: string;
  body?: unknown | FormData;
  successMessage?: string;
  errorMessage?: string;
  logContext?: string;
  /** Skip toast notifications entirely */
  silent?: boolean;
}

/**
 * Wrapper around fetch that handles:
 * - JSON serialization (or FormData passthrough)
 * - Error extraction from response body
 * - Toast notifications on success/error
 * - Structured logging on error
 */
export async function fetchWithToast<T = unknown>(
  url: string,
  options: FetchWithToastOptions = {},
): Promise<T> {
  const { method = 'POST', body, successMessage, errorMessage, logContext, silent } = options;

  const isFormData = body instanceof FormData;

  const res = await fetch(url, {
    method,
    ...(body != null
      ? isFormData
        ? { body }
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });

  if (!res.ok) {
    let serverError: string | undefined;
    try {
      const data = await res.json();
      serverError = data.error;
    } catch {
      // response may not be JSON
    }
    const message = serverError || errorMessage || '요청 실패';
    if (logContext) {
      logger.error(logContext, { url, status: res.status, error: message });
    }
    if (!silent) {
      toast.error(errorMessage || '요청 실패', { description: serverError });
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) {
    if (successMessage && !silent) toast.success(successMessage);
    return undefined as T;
  }

  const data = await res.json();
  if (successMessage && !silent) toast.success(successMessage);
  return data as T;
}
