import { describe, it, expect } from 'vitest';

describe('auth/logout', () => {
  it('POST → 쿠키 삭제 + ok: true', async () => {
    const { POST } = await import('@/app/api/auth/logout/route');
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('x-user-profile');
    expect(setCookie).toContain('Max-Age=0');
  });
});
