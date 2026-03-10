import { describe, it, expect, vi } from 'vitest';
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  errorResponse,
} from '@/lib/api/errors';

describe('ApiError', () => {
  it('sets statusCode, message, and code', () => {
    const err = new ApiError(418, 'teapot', 'TEAPOT');
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe('teapot');
    expect(err.code).toBe('TEAPOT');
    expect(err.name).toBe('ApiError');
    expect(err).toBeInstanceOf(Error);
  });

  it('code is optional', () => {
    const err = new ApiError(500, 'fail');
    expect(err.code).toBeUndefined();
  });
});

describe('UnauthorizedError', () => {
  it('defaults to 401 with Korean message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('로그인이 필요합니다.');
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err).toBeInstanceOf(ApiError);
  });

  it('accepts custom message', () => {
    const err = new UnauthorizedError('custom');
    expect(err.message).toBe('custom');
    expect(err.statusCode).toBe(401);
  });
});

describe('ForbiddenError', () => {
  it('defaults to 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('접근 권한이 없습니다.');
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ValidationError', () => {
  it('defaults to 400', () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toBeUndefined();
  });

  it('stores details array', () => {
    const details = ['field1: required', 'field2: invalid'];
    const err = new ValidationError('bad input', details);
    expect(err.details).toEqual(details);
    expect(err.message).toBe('bad input');
  });
});

describe('NotFoundError', () => {
  it('defaults to 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });
});

describe('errorResponse', () => {
  it('returns correct JSON for ApiError', async () => {
    const err = new ApiError(422, 'unprocessable', 'UNPROCESSABLE');
    const res = errorResponse(err);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('unprocessable');
    expect(body.code).toBe('UNPROCESSABLE');
  });

  it('includes details for ValidationError', async () => {
    const err = new ValidationError('bad', ['a: required']);
    const res = errorResponse(err);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toEqual(['a: required']);
  });

  it('does not include details for non-ValidationError ApiError', async () => {
    const err = new ForbiddenError();
    const res = errorResponse(err);
    const body = await res.json();
    expect(body.details).toBeUndefined();
  });

  it('returns 500 for unknown errors', async () => {
    const res = errorResponse(new Error('random'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('returns 500 for non-Error values', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = errorResponse('string error');
    expect(res.status).toBe(500);
    spy.mockRestore();
  });
});
