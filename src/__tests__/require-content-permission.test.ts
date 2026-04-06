import { describe, it, expect, vi } from 'vitest';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { ForbiddenError } from '@/lib/api/errors';
import type { AuthUser } from '@/types/auth';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'u1',
    email: 'test@test.com',
    full_name: 'Test',
    role: 'teacher',
    academy_id: 'a1',
    ...overrides,
  };
}

function makeSupabase(canManageContent: boolean) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { can_manage_content: canManageContent },
            error: null,
          }),
        }),
      }),
    }),
  } as unknown as Parameters<typeof requireContentPermission>[1];
}

describe('requireContentPermission', () => {
  it('boss는 DB 조회 없이 즉시 통과', async () => {
    const supabase = makeSupabase(false);
    await expect(
      requireContentPermission(makeUser({ role: 'boss' }), supabase)
    ).resolves.toBeUndefined();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('teacher + can_manage_content=true → 통과', async () => {
    await expect(
      requireContentPermission(makeUser(), makeSupabase(true))
    ).resolves.toBeUndefined();
  });

  it('teacher + can_manage_content=false → ForbiddenError', async () => {
    await expect(
      requireContentPermission(makeUser(), makeSupabase(false))
    ).rejects.toThrow(ForbiddenError);
  });

  it('teacher + academy_id 없음 → ForbiddenError', async () => {
    await expect(
      requireContentPermission(
        makeUser({ academy_id: null }),
        makeSupabase(true)
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it('admin + can_manage_content=true → 통과', async () => {
    await expect(
      requireContentPermission(makeUser({ role: 'admin' }), makeSupabase(true))
    ).resolves.toBeUndefined();
  });

  it('admin + can_manage_content=false → ForbiddenError', async () => {
    await expect(
      requireContentPermission(makeUser({ role: 'admin' }), makeSupabase(false))
    ).rejects.toThrow(ForbiddenError);
  });

  it('에러 메시지가 올바름', async () => {
    try {
      await requireContentPermission(makeUser(), makeSupabase(false));
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect((err as ForbiddenError).message).toBe('콘텐츠 관리 권한이 없습니다.');
    }
  });
});
