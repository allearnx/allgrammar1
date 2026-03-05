import { NextRequest, NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import { getUser } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import type { AuthUser } from '@/types/auth';
import type { UserRole } from '@/types/database';
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  errorResponse,
} from './errors';

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
    try {
      // 1. Auth
      const user = await getUser();
      if (!user) throw new UnauthorizedError();

      // 2. Role check
      if (config.roles && !config.roles.includes(user.role)) {
        throw new ForbiddenError();
      }

      // 3. Parse body
      const method = request.method.toUpperCase();
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

      return await handler({ user, body, supabase, request, params });
    } catch (error) {
      return errorResponse(error);
    }
  };
}
