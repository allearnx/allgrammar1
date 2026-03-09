import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = '로그인이 필요합니다.') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = '접근 권한이 없습니다.') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ValidationError extends ApiError {
  constructor(message = '입력값이 올바르지 않습니다.', public details?: string[]) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(message = '요청한 데이터를 찾을 수 없습니다.') {
    super(404, message, 'NOT_FOUND');
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    const body: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    };
    if (error instanceof ValidationError && error.details) {
      body.details = error.details;
    }
    return NextResponse.json(body, { status: error.statusCode });
  }

  Sentry.captureException(error);
  return NextResponse.json(
    { error: '서버 오류가 발생했습니다.', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
