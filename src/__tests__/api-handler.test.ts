import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock getUser and createClient before importing handler
const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

import { createApiHandler } from '@/lib/api/handler';

function makeRequest(
  method: string,
  body?: unknown,
  contentType = 'application/json'
) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = contentType;
  }

  return new NextRequest('http://localhost/api/test', {
    ...init,
    headers,
  });
}

const fakeUser = {
  id: 'user-1',
  email: 'test@test.com',
  role: 'student' as const,
  full_name: 'Test User',
  academy_id: null,
  is_active: true,
};

const fakeSupabase = { from: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(fakeUser);
  mockCreateClient.mockResolvedValue(fakeSupabase);
});

describe('createApiHandler', () => {
  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const handler = createApiHandler({}, async () => {
        return NextResponse.json({ ok: true });
      });

      const res = await handler(makeRequest('GET'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('passes authenticated user to handler', async () => {
      const handler = createApiHandler({}, async ({ user }) => {
        return NextResponse.json({ userId: user.id });
      });

      const res = await handler(makeRequest('GET'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.userId).toBe('user-1');
    });
  });

  describe('role checking', () => {
    it('returns 403 when user role is not in allowed roles', async () => {
      const handler = createApiHandler(
        { roles: ['teacher', 'admin', 'boss'] },
        async () => NextResponse.json({ ok: true })
      );

      const res = await handler(makeRequest('GET'));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe('FORBIDDEN');
    });

    it('allows access when user role matches', async () => {
      mockGetUser.mockResolvedValue({ ...fakeUser, role: 'teacher' });

      const handler = createApiHandler(
        { roles: ['teacher', 'admin', 'boss'] },
        async () => NextResponse.json({ ok: true })
      );

      const res = await handler(makeRequest('GET'));
      expect(res.status).toBe(200);
    });

    it('skips role check when roles not configured', async () => {
      const handler = createApiHandler({}, async () =>
        NextResponse.json({ ok: true })
      );

      const res = await handler(makeRequest('GET'));
      expect(res.status).toBe(200);
    });
  });

  describe('body parsing', () => {
    it('parses JSON body for POST requests', async () => {
      const handler = createApiHandler({}, async ({ body }) => {
        return NextResponse.json({ received: body });
      });

      const res = await handler(makeRequest('POST', { foo: 'bar' }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toEqual({ foo: 'bar' });
    });

    it('parses text/plain body (sendBeacon)', async () => {
      const handler = createApiHandler({}, async ({ body }) => {
        return NextResponse.json({ received: body });
      });

      const res = await handler(
        makeRequest('POST', { position: 42 }, 'text/plain')
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toEqual({ position: 42 });
    });

    it('does not parse body for GET requests by default', async () => {
      const handler = createApiHandler({}, async ({ body }) => {
        return NextResponse.json({ body });
      });

      const res = await handler(makeRequest('GET'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.body).toBeUndefined();
    });

    it('does not parse body for DELETE requests by default', async () => {
      const handler = createApiHandler({}, async ({ body }) => {
        return NextResponse.json({ body });
      });

      const res = await handler(makeRequest('DELETE'));
      expect(res.status).toBe(200);
    });

    it('parses body for PATCH requests', async () => {
      const handler = createApiHandler({}, async ({ body }) => {
        return NextResponse.json({ received: body });
      });

      const res = await handler(makeRequest('PATCH', { key: 'val' }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toEqual({ key: 'val' });
    });

    it('skips body parsing for POST when hasBody is false', async () => {
      const handler = createApiHandler({ hasBody: false }, async ({ body }) => {
        return NextResponse.json({ body });
      });

      const res = await handler(makeRequest('POST'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.body).toBeUndefined();
    });
  });

  describe('Zod validation', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('validates body against schema', async () => {
      const handler = createApiHandler({ schema }, async ({ body }) => {
        return NextResponse.json(body);
      });

      const res = await handler(makeRequest('POST', { name: 'Kim', age: 15 }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Kim');
      expect(data.age).toBe(15);
    });

    it('returns 400 with details for invalid body', async () => {
      const handler = createApiHandler({ schema }, async () =>
        NextResponse.json({ ok: true })
      );

      const res = await handler(makeRequest('POST', { name: 123 }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
      expect(data.details.length).toBeGreaterThan(0);
    });

    it('returns 400 for missing required fields', async () => {
      const handler = createApiHandler({ schema }, async () =>
        NextResponse.json({ ok: true })
      );

      const res = await handler(makeRequest('POST', {}));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('dynamic params', () => {
    it('resolves route params from routeContext', async () => {
      const handler = createApiHandler({}, async ({ params }) => {
        return NextResponse.json({ id: params.id });
      });

      const res = await handler(makeRequest('GET'), {
        params: Promise.resolve({ id: 'abc-123' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe('abc-123');
    });

    it('returns empty params when routeContext is undefined', async () => {
      const handler = createApiHandler({}, async ({ params }) => {
        return NextResponse.json({ params });
      });

      const res = await handler(makeRequest('GET'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.params).toEqual({});
    });
  });

  describe('error handling', () => {
    it('catches thrown errors and returns error response', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const handler = createApiHandler({}, async () => {
        throw new Error('unexpected');
      });

      const res = await handler(makeRequest('GET'));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.code).toBe('INTERNAL_ERROR');
      spy.mockRestore();
    });

    it('returns 400 for malformed JSON', async () => {
      const handler = createApiHandler({}, async () =>
        NextResponse.json({ ok: true })
      );

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: 'not valid json{{{',
        headers: { 'content-type': 'application/json' },
      });

      const res = await handler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('supabase client', () => {
    it('passes supabase client to handler', async () => {
      const handler = createApiHandler({}, async ({ supabase }) => {
        return NextResponse.json({ hasSupabase: !!supabase });
      });

      const res = await handler(makeRequest('GET'));
      const data = await res.json();
      expect(data.hasSupabase).toBe(true);
      expect(mockCreateClient).toHaveBeenCalledOnce();
    });
  });
});
