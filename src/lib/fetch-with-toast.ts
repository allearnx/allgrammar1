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
  /** Additional fetch options (e.g. AbortController signal) */
  fetchOptions?: RequestInit;
  /** Number of automatic retries for network/5xx errors (default: 0) */
  retry?: number;
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
  const { method = 'POST', body, successMessage, errorMessage, logContext, silent, fetchOptions, retry = 0 } = options;

  const isFormData = body instanceof FormData;
  const buildInit = (): RequestInit => ({
    method,
    ...(body != null
      ? isFormData
        ? { body }
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
    ...fetchOptions,
  });

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s...
        await new Promise(r => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      }

      const res = await fetch(url, buildInit());

      if (!res.ok) {
        // Retry on 5xx server errors
        if (res.status >= 500 && attempt < retry) {
          lastError = new Error(`Server error ${res.status}`);
          continue;
        }

        let serverError: string | undefined;
        try {
          const data = await res.json();
          serverError = data.error;
          if (data.details?.length) {
            serverError = `${serverError} (${data.details.join(', ')})`;
          }
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
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Retry on network errors (TypeError from fetch = network failure)
      if (err instanceof TypeError && attempt < retry) continue;
      // Re-throw non-retryable errors (e.g. 4xx from above)
      if (!(err instanceof TypeError) && !(lastError.message.startsWith('Server error'))) throw err;
    }
  }

  // All retries exhausted
  const message = errorMessage || '네트워크 오류';
  if (logContext) {
    logger.error(logContext, { url, error: lastError?.message, retries: retry });
  }
  if (!silent) {
    toast.error(message, { description: '네트워크 연결을 확인해 주세요.' });
  }
  throw lastError ?? new Error(message);
}
