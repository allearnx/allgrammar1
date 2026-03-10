import { NextRequest, NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import { getUser } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import type { AuthUser } from '@/types/auth';
import type { UserRole } from '@/types/database';
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  errorResponse,
} from './errors';
import { logger } from '@/lib/logger';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface HandlerContext<T = unknown> {
  user: AuthUser;
  body: T;
  supabase: SupabaseClient;
  request: NextRequest;
  params: Record<string, string>;
}

interface HandlerConfig<T = unknown> {
  roles?: UserRole[];
  schema?: ZodType<T>;
  hasBody?: boolean;
}

async function safeParseJson(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await request.json();
    } catch {
      throw new ValidationError('잘못된 JSON 형식입니다.');
    }
  }

  // Support sendBeacon (text/plain)
  if (contentType.includes('text/plain')) {
    try {
      const text = await request.text();
      return JSON.parse(text);
    } catch {
      throw new ValidationError('잘못된 JSON 형식입니다.');
    }
  }

  // No content-type but try JSON anyway
  try {
    return await request.json();
  } catch {
    throw new ValidationError('잘못된 요청 형식입니다.');
  }
}

export function createApiHandler<T = unknown>(
  config: HandlerConfig<T>,
  handler: (ctx: HandlerContext<T>) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    routeContext?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const start = Date.now();
    const method = request.method.toUpperCase();
    const path = new URL(request.url).pathname;
    let userId: string | undefined;

    try {
      // 1. Auth
      const user = await getUser();
      if (!user) throw new UnauthorizedError();
      userId = user.id;

      // 2. Role check
      if (config.roles && !config.roles.includes(user.role)) {
        throw new ForbiddenError();
      }

      // 3. Parse body
      const shouldParseBody =
        config.hasBody ?? ['POST', 'PUT', 'PATCH'].includes(method);

      let body: T = undefined as T;
      if (shouldParseBody) {
        const raw = await safeParseJson(request);

        // 4. Zod validation
        if (config.schema) {
          const result = config.schema.safeParse(raw);
          if (!result.success) {
            const details = result.error.issues.map(
              (i) => `${i.path.join('.')}: ${i.message}`
            );
            throw new ValidationError('입력값이 올바르지 않습니다.', details);
          }
          body = result.data;
        } else {
          body = raw as T;
        }
      }

      // 5. Supabase client
      const supabase = await createClient();

      // 6. Resolve dynamic params
      const params = routeContext?.params ? await routeContext.params : {};

      const response = await handler({ user, body, supabase, request, params });
      const status = response.status;
      const ms = Date.now() - start;

      if (status >= 500) {
        logger.error('api.error', { method, path, status, userId, ms });
      } else {
        logger.info('api.request', { method, path, status, userId, ms });
      }

      return response;
    } catch (error) {
      const ms = Date.now() - start;
      const res = errorResponse(error);
      const status = res.status;

      if (error instanceof ApiError && status < 500) {
        logger.warn('api.request', { method, path, status, userId, code: error.code, ms });
      } else {
        logger.error('api.error', { method, path, status, userId, ms, error: error instanceof Error ? error.message : String(error) });
      }

      return res;
    }
  };
}
