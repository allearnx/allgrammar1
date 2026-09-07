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
 * keepalive 적용 상한. 브라우저는 keepalive 요청의 동시 본문 합계를 64KB로 제한하므로
 * 그 절반만 쓴다(초과분은 keepalive 없이 보내 정상 요청으로 처리). 한글은 3바이트/자라
 * 문자 수가 아니라 바이트로 잰다.
 */
const KEEPALIVE_MAX_BYTES = 32 * 1024;

function byteLength(text: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
  return text.length * 3; // 인코더 없는 환경: 최악(3바이트/자)으로 보수적 추정
}

/**
 * Wrapper around fetch that handles:
 * - JSON serialization (or FormData passthrough)
 * - Error extraction from response body
 * - Toast notifications on success/error
 * - Structured logging on error
 * - 작은 JSON 본문에는 keepalive 기본 적용 — 페이지가 내려가는(리로드·크래시·이동) 순간
 *   일반 fetch는 중단되어 점수·진도 저장이 조용히 유실된다(2026-09-07 정재원: 완료 직후
 *   기기에서 페이지가 내려가 채점 POST는 전부 유실, keepalive인 학습시간 heartbeat만 저장됨).
 *   keepalive 요청은 언로드 후에도 서버에 도달한다. 호출자가 fetchOptions.keepalive를 주면 그 값이 우선.
 */
export async function fetchWithToast<T = unknown>(
  url: string,
  options: FetchWithToastOptions = {},
): Promise<T> {
  const { method = 'POST', body, successMessage, errorMessage, logContext, silent, fetchOptions, retry = 0 } = options;

  const isFormData = body instanceof FormData;
  const serialized = body != null && !isFormData ? JSON.stringify(body) : undefined;
  const useKeepalive = serialized != null && byteLength(serialized) <= KEEPALIVE_MAX_BYTES;
  const buildInit = (): RequestInit => ({
    method,
    ...(body != null
      ? isFormData
        ? { body }
        : { headers: { 'Content-Type': 'application/json' }, body: serialized }
      : {}),
    ...(useKeepalive ? { keepalive: true } : {}),
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
